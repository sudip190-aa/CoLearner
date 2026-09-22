-- Notify the task assignee when a task is assigned or when its status meaningfully changes.
-- The label now carries the task title so the notification names the task; the target slug
-- still points at the project workspace so the recipient can open the related project.
-- app.notify() already skips self-notification (u is distinct from a) and null assignees.
create or replace function app.content_rewards() returns trigger language plpgsql security definer set search_path='' as $$ declare u uuid;n integer;owner uuid;begin
 if tg_table_name='projects' then
  if tg_op='INSERT' then insert into public.project_members(project_id,user_id,role) values(new.id,new.owner_id,'owner');perform app.award(new.owner_id,'project_create',75,'project:'||new.id);end if;u=new.owner_id;
 elsif tg_table_name='tasks' then
  if tg_op='INSERT' then perform app.notify(new.assignee_id,auth.uid(),'task_assigned','project',new.project_id,new.title,(select slug from public.projects where id=new.project_id));
  elsif new.assignee_id is distinct from old.assignee_id then perform app.notify(new.assignee_id,auth.uid(),'task_assigned','project',new.project_id,new.title,(select slug from public.projects where id=new.project_id));
  elsif new.status is distinct from old.status then perform app.notify(new.assignee_id,auth.uid(),'task_status_'||lower(new.status),'project',new.project_id,new.title,(select slug from public.projects where id=new.project_id));
  end if;
  if new.status='done' and not new.xp_awarded then u=coalesce(new.assignee_id,auth.uid());perform app.award(u,'task_complete',15,'task:'||new.id);update public.tasks set xp_awarded=true where id=new.id;end if;
 elsif tg_table_name='milestones' then
  u=auth.uid();if u is null then select owner_id into u from public.projects where id=new.project_id;end if;
  if new.status='done' and not exists(select 1 from public.xp_events where reason='milestone_complete' and source='milestone:'||new.id) then perform app.award(u,'milestone_complete',60,'milestone:'||new.id);end if;
 elsif tg_table_name='threads' then u=new.author_id;perform app.award(u,'thread_create',20,'thread:'||new.id);
 elsif tg_table_name='comments' then
  u=new.author_id;select author_id into owner from public.threads where id=new.thread_id;perform app.notify(owner,u,'comment','comment',new.id,left(new.body,80),(select slug from public.threads where id=new.thread_id));
 end if;
 if u is not null then perform app.check_badges(u);end if;return new;end $$;
