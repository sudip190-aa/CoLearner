-- Preserve existing collaboration permissions and prevent repeated historical rewards.
drop policy tasks_write on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check(app.member(project_id) or app.staff());
create policy tasks_update on public.tasks for update to authenticated using(app.member(project_id) or app.staff()) with check(app.member(project_id) or app.staff());
create policy tasks_delete on public.tasks for delete to authenticated using(app.owner(project_id) or app.staff());
create or replace function app.content_rewards() returns trigger language plpgsql security definer set search_path='' as $$ declare u uuid;n integer; owner uuid;begin
 if tg_table_name='projects' then
 if tg_op='INSERT' then insert into public.project_members(project_id,user_id,role) values(new.id,new.owner_id,'owner');perform app.award(new.owner_id,'project_create',75,'project:'||new.id);end if;u=new.owner_id;
 elsif tg_table_name='tasks' then
 if tg_op='INSERT' then perform app.notify(new.assignee_id,auth.uid(),'task_assigned','project',new.project_id,(select title from public.projects where id=new.project_id),(select slug from public.projects where id=new.project_id));elsif new.assignee_id is distinct from old.assignee_id then perform app.notify(new.assignee_id,auth.uid(),'task_assigned','project',new.project_id,(select title from public.projects where id=new.project_id),(select slug from public.projects where id=new.project_id));end if;
 if new.status='done' and not new.xp_awarded then u=coalesce(new.assignee_id,auth.uid());perform app.award(u,'task_complete',15,'task:'||new.id);update public.tasks set xp_awarded=true where id=new.id;end if;
 elsif tg_table_name='milestones' then
 u=auth.uid();if u is null then select owner_id into u from public.projects where id=new.project_id;end if;
 if new.status='done' and not exists(select 1 from public.xp_events where reason='milestone_complete' and source='milestone:'||new.id) then perform app.award(u,'milestone_complete',60,'milestone:'||new.id);end if;
 elsif tg_table_name='threads' then u=new.author_id;perform app.award(u,'thread_create',20,'thread:'||new.id);
 elsif tg_table_name='comments' then
 u=new.author_id;select author_id into owner from public.threads where id=new.thread_id;perform app.notify(owner,u,'comment','comment',new.id,left(new.body,80),(select slug from public.threads where id=new.thread_id));
 end if;
 if u is not null then perform app.check_badges(u);end if;return new;end $$;
drop trigger task_rewards on public.tasks;create trigger task_rewards after insert or update of status,assignee_id on public.tasks for each row execute function app.content_rewards();
create or replace function public.colearn_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid();p public.projects;j public.join_requests;c public.chapters;rp public.reading_progress;v public.votes;t public.profiles; x jsonb;sid bigint;tid bigint;cid bigint;bid bigint;other uuid;n integer;points integer=0;prev integer;cnt integer;reply jsonb;val integer;link text;
begin
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 if action='touch' then
 select * into t from public.profiles where id=u for update;
 if t.last_active is null or t.last_active::date<current_date then update public.profiles set streak_days=case when t.last_active::date=current_date-1 then t.streak_days+1 else 1 end,last_active=now() where id=u;perform app.award(u,'daily_login',5,current_date::text);if (select streak_days%7=0 from public.profiles where id=u) then perform app.award(u,'streak_week_bonus',5,current_date::text);end if;end if;
 perform app.check_badges(u);return '{}';
 elsif action='skills' then
 delete from public.user_skills where user_id=u;
 for x in select value from jsonb_array_elements(payload->'skills') loop
 link=case when jsonb_typeof(x)='string' then x#>>'{}' else x->>'name' end;
 if length(trim(link))=0 or length(link)>100 then raise exception 'Invalid skill';end if;
 select id into sid from public.skills where lower(name)=lower(link);
 if sid is null then insert into public.skills(name,slug) values(link,lower(regexp_replace(link,'[^a-zA-Z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,6)) returning id into sid;end if;
 insert into public.user_skills(user_id,skill_id,level) values(u,sid,coalesce(x->>'level','beginner')) on conflict(user_id,skill_id) do update set level=excluded.level;
 end loop;return '{}';
 elsif action='onboarding' then
 if not exists(select 1 from public.profiles where id=u and length(trim(full_name))>=2) or not exists(select 1 from public.user_skills where user_id=u) then raise exception 'Complete your name and skills first';end if;
 update public.profiles set onboarding_completed=true where id=u;perform app.award(u,'profile_complete',50,'onboarding');perform app.check_badges(u);return '{}';
 elsif action='connection' then
 select id into other from public.profiles where username=payload->>'username' and is_active;
 if other is null or other=u then raise exception 'Invalid connection';end if;
 perform pg_advisory_xact_lock(hashtextextended(least(u,other)::text||greatest(u,other)::text,0));
 if payload->>'action'='cancel' then delete from public.connections where least(from_user_id,to_user_id)=least(u,other) and greatest(from_user_id,to_user_id)=greatest(u,other);return '{"connection_status":"none"}';
 elsif payload->>'action'='accept' then update public.connections set status='accepted' where from_user_id=other and to_user_id=u and status='pending';if not found then raise exception 'No incoming request';end if;perform app.notify(other,u,'connection_accepted');return '{"connection_status":"accepted"}';
 else insert into public.connections(from_user_id,to_user_id) values(u,other) on conflict do nothing;perform app.notify(other,u,'connection_request');return '{"connection_status":"pending_sent"}';end if;
 elsif action='progress' then
 select * into c from public.chapters where id=(payload->>'chapter_id')::bigint;
 select id into bid from public.books where slug=payload->>'slug';
 if c.id is null or c.book_id is distinct from bid then raise exception 'Chapter does not belong to book';end if;
 insert into public.reading_progress(user_id,book_id) values(u,bid) on conflict do nothing;
 select * into rp from public.reading_progress where user_id=u and book_id=bid for update;
 if coalesce((payload->>'completed')::boolean,false) and not(c.id=any(rp.completed_chapters)) then rp.completed_chapters=array_append(rp.completed_chapters,c.id);points=app.award(u,'chapter_complete',10,'chapter:'||c.id);end if;
 select count(*) into cnt from public.chapters where book_id=bid;
 rp.progress_percent=least(100,round(100.0*cardinality(rp.completed_chapters)/greatest(cnt,1)));rp.completed=rp.progress_percent=100;
 if rp.completed and not rp.book_completion_awarded then points=points+app.award(u,'book_complete',100,'book:'||bid);end if;
 update public.reading_progress set chapter_id=c.id,completed_chapters=rp.completed_chapters,progress_percent=rp.progress_percent,completed=rp.completed,book_completion_awarded=rp.completed or book_completion_awarded,last_read_at=now() where id=rp.id;
 perform app.check_badges(u);select * into t from public.profiles where id=u;
 return jsonb_build_object('progress',rp.progress_percent,'chapter_completed',c.id=any(rp.completed_chapters),'book_completed',rp.completed,'xp_awarded',points,'xp',t.xp,'level',t.level,'badges_earned','[]'::jsonb);
 elsif action='bookmark' then
 select * into c from public.chapters where id=(payload->>'id')::bigint;
 if c.id is null then raise exception 'Chapter not found';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text||'bookmark'||c.id,0));
 delete from public.bookmarks where user_id=u and chapter_id=c.id;
 if found then return '{"status":"deleted"}';end if;
 insert into public.bookmarks(user_id,book_id,chapter_id) values(u,c.book_id,c.id);return '{"status":"created"}';
 elsif action in ('join','invite','respond','member_role','remove_member') then
 if action='respond' then select * into j from public.join_requests where id=(payload->>'id')::bigint;select * into p from public.projects where id=j.project_id for update;
 else select * into p from public.projects where slug=payload->>'slug' for update;end if;
 if p.id is null then raise exception 'Project not found';end if;
 if action='member_role' then
 if p.owner_id<>u then raise exception 'Owner required' using errcode='42501';end if;
 other=(payload->>'user_id')::uuid;if other=p.owner_id or payload->>'role' not in ('member','mentor') then raise exception 'Invalid role change';end if;
 update public.project_members set role=payload->>'role' where project_id=p.id and user_id=other;return '{}';
 elsif action='remove_member' then
 other=(payload->>'user_id')::uuid;if other=p.owner_id or (u<>p.owner_id and u<>other) then raise exception 'Cannot remove member' using errcode='42501';end if;
 delete from public.project_members where project_id=p.id and user_id=other;update public.tasks set assignee_id=null where project_id=p.id and assignee_id=other;return '{}';
 end if;
 if p.status in ('completed','archived') then raise exception 'Project is closed';end if;
 if action='invite' then
 if (select count(*) from public.project_members where project_id=p.id)>=p.max_members then raise exception 'Project is full';end if;
 if p.owner_id<>u then raise exception 'Owner required' using errcode='42501';end if;
 select id into other from public.profiles where username=payload->>'username' and is_active;
 if other is null or exists(select 1 from public.project_members where project_id=p.id and user_id=other) then raise exception 'Invalid invite';end if;
 insert into public.join_requests(project_id,user_id,status) values(p.id,other,'invited') on conflict(project_id,user_id) do update set status='invited' returning * into j;
 perform app.notify(other,u,'project_invite','project',p.id,p.title,p.slug);
 elsif action='join' then
 if not app.visible(p.id) and not exists(select 1 from public.join_requests where project_id=p.id and user_id=u and status='invited') then raise exception 'Project is private' using errcode='42501';end if;
 if exists(select 1 from public.project_members where project_id=p.id and user_id=u) then raise exception 'Already a member';end if;
 select * into j from public.join_requests where project_id=p.id and user_id=u;
 if j.status='invited' then update public.join_requests set status='approved' where id=j.id returning * into j;
 else if length(coalesce(payload->>'message',''))>1000 then raise exception 'Message must be at most 1000 characters';end if;insert into public.join_requests(project_id,user_id,message) values(p.id,u,coalesce(payload->>'message','')) on conflict(project_id,user_id) do update set status='pending',message=excluded.message returning * into j;perform app.notify(p.owner_id,u,'join_request','project',p.id,p.title,p.slug);end if;
 else
 if (j.status='pending' and p.owner_id<>u) or (j.status='invited' and j.user_id<>u) or j.status not in ('pending','invited') then raise exception 'Cannot answer request' using errcode='42501';end if;
 if payload->>'status' not in ('approved','rejected') then raise exception 'Invalid request status';end if;
 update public.join_requests set status=payload->>'status' where id=j.id returning * into j;
 end if;
 if j.status='approved' then
 if (select count(*) from public.project_members where project_id=p.id)>=p.max_members then raise exception 'Project is full';end if;
 insert into public.project_members(project_id,user_id) values(p.id,j.user_id) on conflict do nothing;perform app.award(j.user_id,'project_join',40,'project_join:'||p.id);perform app.check_badges(j.user_id);perform app.notify(j.user_id,u,'join_approved','project',p.id,p.title,p.slug);
 end if;return to_jsonb(j)||jsonb_build_object('user',(select to_jsonb(q) from public.profiles q where id=j.user_id),'project_slug',p.slug,'project_title',p.title);
 elsif action='vote' then
 val=(payload->>'value')::integer;if val not in (-1,0,1) then raise exception 'Invalid vote';end if;
 if payload->>'content_type'='thread' then tid=(payload->>'object_id')::bigint;elsif payload->>'content_type'='comment' then cid=(payload->>'object_id')::bigint;else raise exception 'Invalid vote target';end if;
 if exists(select 1 from public.threads where id=tid and author_id=u) or exists(select 1 from public.comments where id=cid and author_id=u) then raise exception 'You cannot vote on your own post';end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce('t'||tid,'c'||cid),0));
 select * into v from public.votes where user_id=u and (thread_id=tid or comment_id=cid);
 delete from public.votes where id=v.id;
 if val<>0 and val is distinct from v.value then insert into public.votes(user_id,thread_id,comment_id,value) values(u,tid,cid,val);else val=0;end if;
 select coalesce(sum(value),0) into n from public.votes where thread_id=tid or comment_id=cid;
 if cid is not null then select author_id into other from public.comments where id=cid;if n>=5 and not (select xp_awarded from public.comments where id=cid) then perform app.award(other,'helpful_comment',25,'comment:'||cid);update public.comments set xp_awarded=true where id=cid;end if;perform app.check_badges(other);end if;
 return jsonb_build_object('score',n,'user_vote',val);
 elsif action='view_thread' then
 tid=(payload->>'id')::bigint;insert into public.thread_views(thread_id,user_id) values(tid,u) on conflict do nothing;if found then update public.threads set views=views+1 where id=tid;end if;return '{}';
 elsif action='thread_tags' then
 tid=(payload->>'id')::bigint;if not exists(select 1 from public.threads where id=tid and author_id=u) then raise exception 'Author required' using errcode='42501';end if;
 delete from public.thread_tags where thread_id=tid;
 for link in select jsonb_array_elements_text(payload->'tags') loop
 select id into sid from public.tags where name=link or slug=link;
 if sid is null then insert into public.tags(name,slug) values(link,lower(regexp_replace(link,'[^a-zA-Z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,6)) returning id into sid;end if;
 insert into public.thread_tags values(tid,sid) on conflict do nothing;end loop;return '{}';
 elsif action='report' then
 link=payload->>'content_type';if link='thread' then tid=(payload->>'object_id')::bigint;elsif link='comment' then cid=(payload->>'object_id')::bigint;elsif link='user' then other=(payload->>'object_id')::uuid;else raise exception 'Invalid report type';end if;
 insert into public.reports(reporter_id,target_type,thread_id,comment_id,target_user_id,reason) values(u,link,tid,cid,other,coalesce(nullif(payload->>'reason',''),'Inappropriate content')) on conflict do nothing;get diagnostics n=row_count;return jsonb_build_object('already_reported',n=0);
 elsif action='accept_policies' then insert into app.policy_acceptances(user_id) values(u) on conflict do nothing;return '{}';
 end if;raise exception 'Unknown action';end $$;
