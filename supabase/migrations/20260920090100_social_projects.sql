alter table public.projects add column demo_url text not null default '' check(demo_url='' or demo_url ~* '^https?://[^[:space:]]+$');
alter table public.projects add column repository_url text not null default '' check(repository_url='' or repository_url ~* '^https?://[^[:space:]]+$');
alter table public.projects add column gallery jsonb not null default '[]' check(jsonb_typeof(gallery)='array' and jsonb_array_length(gallery)<=6);
alter table public.projects add column is_showcase boolean not null default false;
grant insert(demo_url,repository_url,gallery,is_showcase),update(demo_url,repository_url,gallery,is_showcase) on public.projects to authenticated;
create function app.validate_project_gallery() returns trigger language plpgsql set search_path='' as $$ declare image text;begin
 for image in select jsonb_array_elements_text(new.gallery) loop
  if image not like new.id::text||'/%' or image like '%..%' or image !~ '\.(jpg|jpeg|png|webp)$' then raise exception 'Gallery images must belong to this project';end if;
 end loop;return new;
end $$;
create trigger validate_project_gallery before insert or update of gallery on public.projects for each row execute function app.validate_project_gallery();

alter table public.join_requests add column invited_by uuid references public.profiles on delete set null;
alter table public.join_requests drop constraint join_requests_status_check;
alter table public.join_requests add constraint join_requests_status_check check(status in('pending','invited','approved','rejected','cancelled'));
create or replace function app.visible(p bigint) returns boolean language sql stable security definer set search_path='' as $$
 select app.staff() or exists(select 1 from public.projects where id=p and (is_public or (app.active() and (owner_id=auth.uid() or app.member(p) or exists(select 1 from public.join_requests j where j.project_id=p and j.user_id=auth.uid() and j.status='invited')))));
$$;
drop policy projects_read on public.projects;
create policy projects_read on public.projects for select using(app.visible(id));
grant select on public.projects,public.project_members to anon;
create policy public_project_members on public.project_members for select to anon using(exists(select 1 from public.projects p where p.id=project_id and p.is_public));
create policy public_project_images on storage.objects for select to anon using(bucket_id='project-covers' and exists(select 1 from public.projects p where p.id::text=(storage.foldername(name))[1] and p.is_public));

alter function public.colearn_action(text,jsonb) rename to colearn_action_before_social;
revoke all on function public.colearn_action_before_social(text,jsonb) from public,anon,authenticated;
create function public.colearn_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid();p public.projects;j public.join_requests;other uuid;prior text;
begin
 if action not in('join','invite','respond','cancel_invite') then return public.colearn_action_before_social(action,payload);end if;
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 if action in('respond','cancel_invite') then
  select pr.* into p from public.projects pr join public.join_requests r on r.project_id=pr.id where r.id=(payload->>'id')::bigint for update of pr;
  select * into j from public.join_requests where id=(payload->>'id')::bigint for update;
 else select * into p from public.projects where slug=payload->>'slug' for update;end if;
 if p.id is null then raise exception 'Project unavailable';end if;
 if action='cancel_invite' then
  if j.status<>'invited' or not (p.owner_id=u or j.invited_by=u) then raise exception 'Cannot cancel this invitation' using errcode='42501';end if;
  update public.join_requests set status='cancelled' where id=j.id returning * into j;
  return to_jsonb(j);
 end if;
 if p.status in('completed','archived') then raise exception 'Project is closed';end if;
 if action='invite' then
  if not app.member(p.id) then raise exception 'Project membership required' using errcode='42501';end if;
  select id into other from public.profiles where username=payload->>'username' and is_active;
  if other is null or not app.can_message(other) then raise exception 'Choose an accepted connection' using errcode='42501';end if;
  if exists(select 1 from public.project_members where project_id=p.id and user_id=other) then raise exception 'Already a member';end if;
  select * into j from public.join_requests where project_id=p.id and user_id=other;
  if j.status in('pending','invited') then raise exception 'A request or invitation is already waiting';end if;
  if j.id is not null and j.updated_at>now()-interval '1 day' then raise exception 'Wait a day before inviting this person again';end if;
  if (select count(*) from public.project_members where project_id=p.id)>=p.max_members then raise exception 'Project is full';end if;
  insert into public.join_requests(project_id,user_id,status,invited_by) values(p.id,other,'invited',u)
   on conflict(project_id,user_id) do update set status='invited',invited_by=u returning * into j;
  perform app.notify(other,u,'project_invite','project',p.id,p.title,p.slug);
 elsif action='join' then
  if not app.visible(p.id) then raise exception 'Project unavailable' using errcode='42501';end if;
  if exists(select 1 from public.project_members where project_id=p.id and user_id=u) then raise exception 'Already a member';end if;
  select * into j from public.join_requests where project_id=p.id and user_id=u;
  if j.status='pending' then return to_jsonb(j);end if;
  if j.status='invited' then prior='invited';update public.join_requests set status='approved' where id=j.id returning * into j;
  else
   if length(coalesce(payload->>'message',''))>1000 then raise exception 'Message must be at most 1000 characters';end if;
   if j.id is not null and j.updated_at>now()-interval '1 day' then raise exception 'Wait a day before requesting again';end if;
   insert into public.join_requests(project_id,user_id,message,status) values(p.id,u,coalesce(payload->>'message',''),'pending')
    on conflict(project_id,user_id) do update set status='pending',message=excluded.message returning * into j;
   perform app.notify(p.owner_id,u,'project_join_request','project',p.id,p.title,p.slug);
  end if;
 else
  if j.id is null or j.status not in('pending','invited') or (j.status='pending' and p.owner_id<>u) or (j.status='invited' and j.user_id<>u) then raise exception 'Cannot answer request' using errcode='42501';end if;
  if payload->>'status' is null or payload->>'status' not in('approved','rejected') then raise exception 'Invalid response';end if;
  prior=j.status;update public.join_requests set status=payload->>'status' where id=j.id returning * into j;
 end if;
 if j.status='approved' then
  if (select count(*) from public.project_members where project_id=p.id)>=p.max_members then raise exception 'Project is full';end if;
  insert into public.project_members(project_id,user_id) values(p.id,j.user_id) on conflict do nothing;
  perform app.award(j.user_id,'project_join',40,'project_join:'||p.id);perform app.check_badges(j.user_id);
 end if;
 if prior='invited' then perform app.notify(coalesce(j.invited_by,p.owner_id),u,case when j.status='approved' then 'project_invite_accepted' else 'project_invite_declined' end,'project',p.id,p.title,p.slug);
 elsif prior='pending' then perform app.notify(j.user_id,u,case when j.status='approved' then 'project_join_approved' else 'project_join_rejected' end,'project',p.id,p.title,p.slug);end if;
 return to_jsonb(j)||jsonb_build_object('user',(select to_jsonb(q) from public.profiles q where id=j.user_id),'project_slug',p.slug,'project_title',p.title);
end $$;
revoke all on function public.colearn_action(text,jsonb) from public,anon;
grant execute on function public.colearn_action(text,jsonb) to authenticated;
create policy requests_inviter_read on public.join_requests for select to authenticated using(app.active() and invited_by=auth.uid());
alter publication supabase_realtime add table public.join_requests;

create function app.project_activity_notification() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug,event_key)
 select m.user_id,new.author_id,'project_update','project',p.id,p.title,p.slug,'project-update:'||new.id
 from public.project_members m join public.projects p on p.id=m.project_id where p.id=new.project_id and m.user_id<>new.author_id on conflict do nothing;
 return new;end $$;
create trigger project_activity_notification after insert on public.project_updates for each row execute function app.project_activity_notification();
