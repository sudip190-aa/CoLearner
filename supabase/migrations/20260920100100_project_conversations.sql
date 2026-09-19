-- A project is its conversation. Existing membership is the sole access rule.
create table public.project_messages (
 id bigint generated always as identity primary key,
 project_id bigint not null references public.projects on delete cascade,
 sender_id uuid not null references public.profiles on delete cascade,
 client_id uuid not null default gen_random_uuid(),
 body text not null check(length(btrim(body)) between 1 and 4000),
 reply_to_id bigint references public.project_messages on delete set null,
 created_at timestamptz not null default clock_timestamp(),
 unique(sender_id,client_id)
);
create index project_messages_history on public.project_messages(project_id,id desc);
create index project_messages_sender on public.project_messages(sender_id,created_at);
create index project_messages_reply on public.project_messages(reply_to_id);
create table public.project_message_reads (
 project_id bigint not null references public.projects on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 last_read_id bigint not null default 0,
 primary key(project_id,user_id)
);
create index project_message_reads_user on public.project_message_reads(user_id);
alter table public.project_messages enable row level security;
alter table public.project_message_reads enable row level security;
revoke all on public.project_messages,public.project_message_reads from public,anon,authenticated;
grant select on public.project_messages,public.project_message_reads to authenticated;
grant insert(project_id,sender_id,client_id,body,reply_to_id) on public.project_messages to authenticated;
grant usage on sequence public.project_messages_id_seq to authenticated;
grant all on public.project_messages,public.project_message_reads to service_role;
create policy project_chat_read on public.project_messages for select to authenticated using(app.member(project_id));
create policy project_chat_send on public.project_messages for insert to authenticated with check(sender_id=auth.uid() and app.member(project_id));
create policy project_read_own on public.project_message_reads for select to authenticated using(user_id=auth.uid() and app.member(project_id));
create function app.project_message_validate() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('project-message:'||new.sender_id,0));
 if new.reply_to_id is not null and not exists(select 1 from public.project_messages where id=new.reply_to_id and project_id=new.project_id) then raise exception 'Reply must belong to this project' using errcode='42501';end if;
 if (select count(*) from public.project_messages where sender_id=new.sender_id and created_at>now()-interval '1 minute')>=30 then raise exception 'Please wait a minute before sending more messages';end if;
 return new;
end $$;
create trigger project_message_validate before insert on public.project_messages for each row execute function app.project_message_validate();
create function app.project_message_notify() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug,target_anchor,event_key)
 select m.user_id,new.sender_id,'project_message','project',p.id,left(new.body,100),p.slug,'message-'||new.id,'project-message:'||new.id
 from public.project_members m join public.projects p on p.id=m.project_id where m.project_id=new.project_id and m.user_id<>new.sender_id on conflict do nothing;
 return new;
end $$;
create trigger project_message_notify after insert on public.project_messages for each row execute function app.project_message_notify();
create function public.colearn_read_project(project bigint,through_id bigint) returns void language plpgsql security definer set search_path='' as $$
begin
 if not app.member(project) then raise exception 'Project membership required' using errcode='42501';end if;
 if not exists(select 1 from public.project_messages where project_id=project and id=through_id) then return;end if;
 insert into public.project_message_reads(project_id,user_id,last_read_id) values(project,auth.uid(),through_id)
 on conflict(project_id,user_id) do update set last_read_id=greatest(project_message_reads.last_read_id,excluded.last_read_id);
 update public.notifications n set is_read=true where user_id=auth.uid() and verb='project_message' and target_id=project
 and exists(select 1 from public.project_messages m where m.project_id=project and m.id<=through_id and n.event_key='project-message:'||m.id);
end $$;
create function public.colearn_project_inbox() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(q order by q.last_message_at desc nulls last,q.title),'[]') from (
 select p.id,p.slug,p.title,
 (select count(*) from public.project_messages m where m.project_id=p.id and m.sender_id<>auth.uid() and m.id>coalesce(r.last_read_id,0)) as unread_count,
 (select max(created_at) from public.project_messages m where m.project_id=p.id) as last_message_at
 from public.projects p join public.project_members pm on pm.project_id=p.id and pm.user_id=auth.uid()
 left join public.project_message_reads r on r.project_id=p.id and r.user_id=auth.uid()
 ) q;
$$;
revoke all on function public.colearn_read_project(bigint,bigint),public.colearn_project_inbox() from public,anon;
grant execute on function public.colearn_read_project(bigint,bigint),public.colearn_project_inbox() to authenticated;
alter publication supabase_realtime add table public.project_messages,public.project_message_reads;

-- Ephemeral voice membership and addressed signaling. Every database operation
-- checks current project membership; expired sessions cannot signal new calls.
create table public.project_voice_members (
 project_id bigint not null references public.projects on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 session_id uuid not null,
 device_id uuid not null,
 joined_at timestamptz not null default clock_timestamp(),
 last_seen_at timestamptz not null default clock_timestamp(),
 primary key(project_id,user_id)
);
create index project_voice_members_user on public.project_voice_members(user_id,last_seen_at);
create table public.project_voice_signals (
 id bigint generated always as identity primary key,
 project_id bigint not null references public.projects on delete cascade,
 sender_id uuid not null references public.profiles on delete cascade,
 recipient_id uuid not null references public.profiles on delete cascade,
 from_session uuid not null,
 to_session uuid not null,
 payload jsonb not null check(jsonb_typeof(payload)='object' and length(payload::text)<=65536 and payload->>'type' in('offer','answer','ice')),
 created_at timestamptz not null default clock_timestamp(),
 check(sender_id<>recipient_id)
);
create index project_voice_signals_receiver on public.project_voice_signals(recipient_id,to_session,id);
create index project_voice_signals_project on public.project_voice_signals(project_id,created_at);
create index project_voice_signals_sender on public.project_voice_signals(sender_id);
alter table public.project_voice_members enable row level security;
alter table public.project_voice_signals enable row level security;
revoke all on public.project_voice_members,public.project_voice_signals from public,anon,authenticated;
grant select on public.project_voice_members,public.project_voice_signals to authenticated;
grant insert(project_id,sender_id,recipient_id,from_session,to_session,payload) on public.project_voice_signals to authenticated;
grant usage on sequence public.project_voice_signals_id_seq to authenticated;
grant all on public.project_voice_members,public.project_voice_signals to service_role;
create function app.project_voice_live(p bigint,u uuid,s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.project_voice_members v join public.project_members m on m.project_id=v.project_id and m.user_id=v.user_id
 join public.profiles pr on pr.id=v.user_id where v.project_id=p and v.user_id=u and v.session_id=s and v.last_seen_at>now()-interval '45 seconds' and pr.is_active);
$$;
create policy project_voice_roster on public.project_voice_members for select to authenticated using(app.member(project_id));
create policy project_voice_receive on public.project_voice_signals for select to authenticated using(recipient_id=auth.uid() and app.member(project_id) and app.project_voice_live(project_id,recipient_id,to_session) and app.project_voice_live(project_id,sender_id,from_session));
create policy project_voice_send on public.project_voice_signals for insert to authenticated with check(sender_id=auth.uid() and app.member(project_id) and app.project_voice_live(project_id,sender_id,from_session) and app.project_voice_live(project_id,recipient_id,to_session));
create function public.colearn_project_voice(project bigint,operation text,device uuid,session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare current public.project_voice_members;
begin
 if not app.active() or device is null or session is null then raise exception 'Sign in to join a call' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('voice:'||auth.uid(),0));
 perform pg_advisory_xact_lock(hashtextextended('project-voice:'||project,0));
 if operation='leave' then
  delete from public.project_voice_members where project_id=project and user_id=auth.uid() and device_id=device and session_id=session;
  return '{}';
 end if;
 if not app.member(project) then raise exception 'Project membership required' using errcode='42501';end if;
 delete from public.project_voice_members where project_id=project and last_seen_at<=now()-interval '45 seconds';
 delete from public.project_voice_signals where project_id=project and created_at<now()-interval '2 minutes';
 select * into current from public.project_voice_members where project_id=project and user_id=auth.uid();
 if operation='join' then
  if exists(select 1 from public.voice_calls v where auth.uid() in(v.caller_id,v.receiver_id) and app.voice_live(v)) or exists(select 1 from public.project_voice_members where user_id=auth.uid() and last_seen_at>now()-interval '45 seconds' and (project_id<>project or device_id<>device)) then raise exception 'Leave your current call before joining another';end if;
  if current.user_id is null and (select count(*) from public.project_voice_members where project_id=project)>=8 then raise exception 'This call has reached its eight-person limit';end if;
  insert into public.project_voice_members(project_id,user_id,session_id,device_id) values(project,auth.uid(),session,device)
  on conflict(project_id,user_id) do update set session_id=excluded.session_id,device_id=excluded.device_id,last_seen_at=clock_timestamp(),joined_at=clock_timestamp() returning * into current;
 elsif operation='heartbeat' then
  if current.user_id is null or current.device_id<>device or current.session_id<>session then raise exception 'Call session ended' using errcode='42501';end if;
  update public.project_voice_members set last_seen_at=clock_timestamp() where project_id=project and user_id=auth.uid() returning * into current;
 else raise exception 'Unknown call action';end if;
 return to_jsonb(current);
end $$;
create function app.project_chat_remove_member() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from public.project_voice_members where project_id=old.project_id and user_id=old.user_id;
 delete from public.project_message_reads where project_id=old.project_id and user_id=old.user_id;
 delete from public.project_voice_signals where project_id=old.project_id and old.user_id in(sender_id,recipient_id);
 return null;
end $$;
create trigger project_chat_remove_member after delete on public.project_members for each row execute function app.project_chat_remove_member();
alter function public.colearn_start_call(uuid,uuid) rename to colearn_start_call_before_groups;
revoke all on function public.colearn_start_call_before_groups(uuid,uuid) from public,anon,authenticated;
create function public.colearn_start_call(peer uuid,device_id uuid) returns public.voice_calls language plpgsql security definer set search_path='' as $$
begin
 if not app.can_message(peer) then raise exception 'Only accepted connections can call' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('voice:'||least(auth.uid(),peer),0));
 perform pg_advisory_xact_lock(hashtextextended('voice:'||greatest(auth.uid(),peer),0));
 if exists(select 1 from public.project_voice_members where user_id in(auth.uid(),peer) and last_seen_at>now()-interval '45 seconds') then raise exception 'You or your connection are already in a project call';end if;
 return public.colearn_start_call_before_groups(peer,device_id);
end $$;
revoke all on function app.project_voice_live(bigint,uuid,uuid),public.colearn_project_voice(bigint,text,uuid,uuid),public.colearn_start_call(uuid,uuid) from public,anon;
grant execute on function app.project_voice_live(bigint,uuid,uuid),public.colearn_project_voice(bigint,text,uuid,uuid),public.colearn_start_call(uuid,uuid) to authenticated;
revoke all on function app.project_message_validate(),app.project_message_notify(),app.project_chat_remove_member() from public,anon,authenticated;
alter publication supabase_realtime add table public.project_voice_members,public.project_voice_signals;
