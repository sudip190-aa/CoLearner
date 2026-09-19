create function app.notify(u uuid,a uuid,v text,t text default null,i bigint default null,l text default '',s text default '') returns void language sql security definer set search_path='' as $$ insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug) select u,a,v,t,i,l,s where u is not null and u is distinct from a $$;
create function app.award(u uuid,r text,points integer,src text) returns integer language plpgsql security definer set search_path='' as $$ declare n integer; cap integer;begin
 perform 1 from public.profiles where id=u for update;
 cap=case r when 'project_create' then 3 when 'project_join' then 5 when 'task_complete' then 20 when 'milestone_complete' then 5 when 'thread_create' then 5 else null end;
 if cap is not null and (select count(*) from public.xp_events where user_id=u and reason=r and created_at>=current_date)>=cap then return 0;end if;
 insert into public.xp_events(user_id,amount,reason,source) values(u,points,r,src) on conflict do nothing;get diagnostics n=row_count;
 if n=0 then return 0;end if;
 update public.profiles set xp=xp+points,level=floor(sqrt((xp+points)/50.0))+1 where id=u;
 return points;end $$;
create function app.badge_progress(u uuid,k text) returns integer language plpgsql stable security definer set search_path='' as $$ begin return case
 when k='first_chapter' then (select count(*)::int from public.reading_progress where user_id=u and (completed or cardinality(completed_chapters)>0))
 when k in ('first_book','five_books') then (select count(*)::int from public.reading_progress where user_id=u and completed)
 when k='first_project' then (select count(*)::int from public.project_members where user_id=u)
 when k in ('first_task','ten_tasks') then (select count(*)::int from public.tasks where assignee_id=u and status='done')
 when k='first_milestone' then (select count(*)::int from public.milestones m join public.project_members p on p.project_id=m.project_id where p.user_id=u and m.status='done')
 when k='project_completed' then (select count(*)::int from public.projects p join public.project_members m on m.project_id=p.id where m.user_id=u and p.status='completed')
 when k='first_thread' then (select count(*)::int from public.threads where author_id=u)
 when k='ten_comments' then (select count(*)::int from public.comments where author_id=u)
 when k='helpful_5' then (select count(*)::int from public.votes v join public.comments c on c.id=v.comment_id where c.author_id=u and v.value=1)
 when k in ('streak_7','streak_30') then (select streak_days from public.profiles where id=u)
 when k in ('level_5','level_10') then (select level from public.profiles where id=u) else 0 end;end $$;
create function app.check_badges(u uuid) returns void language plpgsql security definer set search_path='' as $$ declare b record;n integer;begin
 for b in select * from public.badges loop if app.badge_progress(u,b.criteria_key)>=b.required then
 insert into public.user_badges(user_id,badge_id) values(u,b.id) on conflict do nothing;get diagnostics n=row_count;
 if n>0 then perform app.award(u,b.criteria_key,b.xp_reward,'badge');perform app.notify(u,null,'badge_'||b.criteria_key,'badge',b.id,b.name,b.slug);end if;
 end if;end loop;end $$;
create function app.create_profile() returns trigger language plpgsql security definer set search_path='' as $$ declare uname text;begin
 uname=coalesce(nullif(new.raw_user_meta_data->>'username',''),'user-'||substr(new.id::text,1,8));
 insert into public.profiles(id,username,full_name) values(new.id,uname,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''));
 if new.raw_user_meta_data->>'terms_accepted'='true' then insert into app.policy_acceptances(user_id) values(new.id);end if;
 perform app.award(new.id,'signup',10,'signup');return new;end $$;
create trigger auth_profile after insert on auth.users for each row execute function app.create_profile();
create function app.guard_content() returns trigger language plpgsql security definer set search_path='' as $$ declare parent public.comments;begin
 if tg_table_name='tasks' then
 if tg_op='INSERT' then new.xp_awarded=false;end if;
 if new.assignee_id is not null and not exists(select 1 from public.project_members where project_id=new.project_id and user_id=new.assignee_id) then raise exception 'Assignee must be a project member';end if;
 elsif tg_table_name='comments' and new.parent_id is not null then
 select * into parent from public.comments where id=new.parent_id;
 if parent.thread_id is distinct from new.thread_id then raise exception 'Reply belongs to another discussion';end if;
 new.parent_id=coalesce(parent.parent_id,parent.id);
 elsif tg_table_name='projects' and tg_op='UPDATE' then
 if new.max_members<(select count(*) from public.project_members where project_id=new.id) then raise exception 'Capacity is below current team size';end if;
 elsif tg_table_name='profiles' and auth.role()='authenticated' and new.role='admin' and not app.staff() then raise exception 'Only staff can assign the admin role';
 end if;return new;end $$;
create trigger task_guard before insert or update on public.tasks for each row execute function app.guard_content();
create trigger comment_guard before insert or update on public.comments for each row execute function app.guard_content();
create trigger project_guard before update on public.projects for each row execute function app.guard_content();
create trigger profile_guard before update on public.profiles for each row execute function app.guard_content();
create function app.content_rewards() returns trigger language plpgsql security definer set search_path='' as $$ declare u uuid;n integer; owner uuid;begin
 if tg_table_name='projects' then
 if tg_op='INSERT' then insert into public.project_members(project_id,user_id,role) values(new.id,new.owner_id,'owner');perform app.award(new.owner_id,'project_create',75,'project:'||new.id);end if;u=new.owner_id;
 elsif tg_table_name='tasks' then
 if new.status='done' and not new.xp_awarded then u=coalesce(new.assignee_id,auth.uid());perform app.award(u,'task_complete',15,'task:'||new.id);update public.tasks set xp_awarded=true where id=new.id;end if;
 elsif tg_table_name='milestones' then
 select owner_id into u from public.projects where id=new.project_id;
 if new.status='done' then perform app.award(u,'milestone_complete',60,'milestone:'||new.id);end if;
 elsif tg_table_name='threads' then u=new.author_id;perform app.award(u,'thread_create',20,'thread:'||new.id);
 elsif tg_table_name='comments' then
 u=new.author_id;select author_id into owner from public.threads where id=new.thread_id;perform app.notify(owner,u,'comment','comment',new.id,left(new.body,80),(select slug from public.threads where id=new.thread_id));
 end if;
 if u is not null then perform app.check_badges(u);end if;return new;end $$;
create trigger project_rewards after insert or update of status on public.projects for each row execute function app.content_rewards();
create trigger task_rewards after insert or update of status on public.tasks for each row execute function app.content_rewards();
create trigger milestone_rewards after insert or update of status on public.milestones for each row execute function app.content_rewards();
create trigger thread_rewards after insert on public.threads for each row execute function app.content_rewards();
create trigger comment_rewards after insert on public.comments for each row execute function app.content_rewards();
-- Atomic mutations. All protected values are derived on the server, never trusted from the browser.
create function public.colearn_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
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
 update public.profiles set onboarding_completed=true where id=u;perform app.award(u,'profile_complete',50,'profile');perform app.check_badges(u);return '{}';
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
 if rp.completed then points=points+app.award(u,'book_complete',100,'book:'||bid);end if;
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
 if p.owner_id<>u then raise exception 'Owner required' using errcode='42501';end if;
 select id into other from public.profiles where username=payload->>'username' and is_active;
 if other is null or exists(select 1 from public.project_members where project_id=p.id and user_id=other) then raise exception 'Invalid invite';end if;
 insert into public.join_requests(project_id,user_id,status) values(p.id,other,'invited') on conflict(project_id,user_id) do update set status='invited' returning * into j;
 perform app.notify(other,u,'project_invite','project',p.id,p.title,p.slug);
 elsif action='join' then
 if not app.visible(p.id) then raise exception 'Project is private' using errcode='42501';end if;
 if exists(select 1 from public.project_members where project_id=p.id and user_id=u) then raise exception 'Already a member';end if;
 select * into j from public.join_requests where project_id=p.id and user_id=u;
 if j.status='invited' then update public.join_requests set status='approved' where id=j.id returning * into j;
 else insert into public.join_requests(project_id,user_id,message) values(p.id,u,coalesce(payload->>'message','')) on conflict(project_id,user_id) do update set status='pending',message=excluded.message returning * into j;perform app.notify(p.owner_id,u,'join_request','project',p.id,p.title,p.slug);end if;
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
 perform pg_advisory_xact_lock(hashtextextended(u::text||coalesce('t'||tid,'c'||cid),0));
 select * into v from public.votes where user_id=u and (thread_id=tid or comment_id=cid);
 delete from public.votes where id=v.id;
 if val<>0 and val is distinct from v.value then insert into public.votes(user_id,thread_id,comment_id,value) values(u,tid,cid,val);else val=0;end if;
 select coalesce(sum(value),0) into n from public.votes where thread_id=tid or comment_id=cid;
 if cid is not null then select author_id into other from public.comments where id=cid;if n>=5 then perform app.award(other,'helpful_comment',25,'comment:'||cid);end if;perform app.check_badges(other);end if;
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
revoke all on function public.colearn_action(text,jsonb) from public,anon;
grant execute on function public.colearn_action(text,jsonb) to authenticated;
revoke all on all functions in schema app from public;
