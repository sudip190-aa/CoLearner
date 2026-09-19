-- Branch before accessing table-specific NEW fields: SQL AND does not guarantee
-- short-circuit evaluation while preparing a trigger expression.
create or replace function app.guard_content() returns trigger language plpgsql security definer set search_path='' as $$ declare parent public.comments;begin
 if tg_table_name='tasks' then
  if tg_op='INSERT' then new.xp_awarded=false;end if;
  if new.assignee_id is not null and not exists(select 1 from public.project_members where project_id=new.project_id and user_id=new.assignee_id) then raise exception 'Assignee must be a project member';end if;
 elsif tg_table_name='comments' then
  if new.parent_id is not null then
   select * into parent from public.comments where id=new.parent_id;
   if parent.thread_id is distinct from new.thread_id then raise exception 'Reply belongs to another discussion';end if;
   new.parent_id=coalesce(parent.parent_id,parent.id);
  end if;
 elsif tg_table_name='projects' then
  if tg_op='UPDATE' and new.max_members<(select count(*) from public.project_members where project_id=new.id) then raise exception 'Capacity is below current team size';end if;
 elsif tg_table_name='profiles' then
  if auth.role()='authenticated' and new.role='admin' and new.role is distinct from old.role and not app.staff() then raise exception 'Only staff can assign the admin role';end if;
 end if;return new;end $$;
create or replace function app.award(u uuid,r text,points integer,src text) returns integer language plpgsql security definer set search_path='' as $$ declare n integer; cap integer;begin
 perform 1 from public.profiles where id=u for update;
 cap=case r when 'project_create' then 3 when 'project_join' then 5 when 'task_complete' then 10 when 'milestone_complete' then 3 when 'thread_create' then 5 else null end;
 if cap is not null and (select count(*) from public.xp_events where user_id=u and reason=r and created_at>=current_date)>=cap then return 0;end if;
 insert into public.xp_events(user_id,amount,reason,source) values(u,points,r,src) on conflict do nothing;get diagnostics n=row_count;
 if n=0 then return 0;end if;
 update public.profiles set xp=xp+points,level=floor(sqrt((xp+points)/50.0))+1 where id=u;
 return points;end $$;
-- Notifications can refer to both bigint content IDs and UUID account IDs.
alter table public.notifications alter column target_id type text using target_id::text;
