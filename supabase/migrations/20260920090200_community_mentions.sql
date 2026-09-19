-- RETURNING must recognize a newly inserted private project's owner before its membership trigger runs.
drop policy projects_read on public.projects;
create policy projects_read on public.projects for select using(is_public or (app.active() and owner_id=auth.uid()) or app.visible(id));

create table public.comment_mentions (
 comment_id bigint not null references public.comments on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 primary key(comment_id,user_id)
);
alter table public.comment_mentions enable row level security;
grant select on public.comment_mentions to authenticated;
grant all on public.comment_mentions to service_role;
create policy mention_read on public.comment_mentions for select to authenticated using(app.active());
drop trigger comment_rewards on public.comments;
create function app.comment_notifications() returns trigger language plpgsql security definer set search_path='' as $$
declare t public.threads; person uuid; parent_author uuid;
begin
 select * into t from public.threads where id=new.thread_id;
 if tg_op='INSERT' then
  select author_id into parent_author from public.comments where id=new.parent_id;
  for person in select distinct id from (values(t.author_id),(parent_author)) as recipients(id) where id is not null and id<>new.author_id loop
   insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug,target_anchor,event_key)
   values(person,new.author_id,case when person=parent_author then 'replied_to_comment' else 'commented_on_thread' end,'thread',t.id,t.title,t.slug,'comment-'||new.id,'comment:'||new.id)
   on conflict do nothing;
  end loop;
  perform app.check_badges(new.author_id);
 end if;
 -- Resolve only accepted connections. Typing an unrelated username never notifies that account.
 for person in
  select distinct p.id from regexp_matches(new.body,'(^|[^A-Za-z0-9_@])@([A-Za-z0-9_][A-Za-z0-9_.-]{2,149})','g') as match
  join public.profiles p on lower(p.username)=lower(match[2]) and p.is_active
  join public.connections c on c.status='accepted' and least(c.from_user_id,c.to_user_id)=least(new.author_id,p.id) and greatest(c.from_user_id,c.to_user_id)=greatest(new.author_id,p.id)
  where p.id<>new.author_id
 loop
  insert into public.comment_mentions(comment_id,user_id) values(new.id,person) on conflict do nothing;
  if found then
   insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug,target_anchor,event_key)
   values(person,new.author_id,'mentioned_you','thread',t.id,t.title,t.slug,'comment-'||new.id,'comment:'||new.id)
   on conflict(user_id,event_key) where event_key is not null do update set verb='mentioned_you';
  end if;
 end loop;
 return new;
end $$;
create trigger comment_notifications after insert or update of body on public.comments for each row execute function app.comment_notifications();
create index comments_thread_order on public.comments(thread_id,created_at,id);
create index threads_latest on public.threads(created_at desc,id desc);
create index threads_category_latest on public.threads(category,created_at desc);
alter publication supabase_realtime add table public.comments;
