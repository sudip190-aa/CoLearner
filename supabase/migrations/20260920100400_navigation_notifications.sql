-- Navigation counts come from their source records, never from a capped UI list.
create function public.colearn_navigation_counts() returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
  'messages', (select coalesce(sum(unread_count),0) from public.colearn_message_contacts())
    + (select coalesce(sum((value->>'unread_count')::bigint),0) from jsonb_array_elements(public.colearn_project_inbox())),
  'projects', (select count(*) from public.join_requests j join public.projects p on p.id=j.project_id
    where (j.status='pending' and p.owner_id=auth.uid()) or (j.status='invited' and j.user_id=auth.uid())),
  'community', (select count(*) from public.notifications where user_id=auth.uid() and verb='mentioned_you' and not is_read),
  'people', (select count(*) from public.connections where to_user_id=auth.uid() and status='pending')
 );
$$;
revoke all on function public.colearn_navigation_counts() from public,anon;
grant execute on function public.colearn_navigation_counts() to authenticated;

create or replace function public.colearn_read_messages(peer uuid, through_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not app.can_message(peer) then raise exception 'An accepted connection is required.' using errcode='42501'; end if;
 update public.direct_messages set read_at=clock_timestamp()
 where recipient_id=auth.uid() and sender_id=peer and read_at is null and created_at<=least(through_at,clock_timestamp());
 update public.notifications n set is_read=true where n.user_id=auth.uid() and not n.is_read and n.verb='direct_message'
 and exists(select 1 from public.direct_messages d where d.recipient_id=auth.uid() and d.sender_id=peer
  and d.read_at is not null and n.event_key='message:'||d.id);
end $$;

-- Resolving an action also resolves its old notification, without marking
-- invitations/requests from a different person or project as handled.
create function app.resolve_project_notification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.status in('invited','pending') and new.status not in('invited','pending') then
  update public.notifications n set is_read=true where not n.is_read and n.target_id=new.project_id::text
   and ((old.status='invited' and n.verb='project_invite' and n.user_id=new.user_id)
    or (old.status='pending' and n.verb in('project_join_request','join_request') and n.actor_id=new.user_id
      and n.user_id=(select owner_id from public.projects where id=new.project_id)));
 end if; return new;
end $$;
create trigger resolve_project_notification after update of status on public.join_requests
for each row execute function app.resolve_project_notification();

create function app.resolve_connection_notification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.status='pending' then
  update public.notifications set is_read=true where user_id=old.to_user_id and actor_id=old.from_user_id
   and verb='connection_request' and not is_read;
 end if; return null;
end $$;
create trigger resolve_connection_notification after update of status or delete on public.connections
for each row execute function app.resolve_connection_notification();
revoke all on function app.resolve_project_notification(),app.resolve_connection_notification() from public,anon,authenticated;
alter publication supabase_realtime add table public.connections;

-- Repeating an existing request is a read of the current state, not a new event.
alter function public.colearn_action(text,jsonb) rename to colearn_action_before_navigation;
revoke all on function public.colearn_action_before_navigation(text,jsonb) from public,anon,authenticated;
create function public.colearn_action(action text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid();other uuid;c public.connections;state text;operation text=payload->>'action';
begin
 if action<>'connection' then return public.colearn_action_before_navigation(action,payload);end if;
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 if operation is null or operation not in('connect','accept','cancel') then raise exception 'Invalid connection action';end if;
 select id into other from public.profiles where username=payload->>'username' and is_active;
 if other is null or other=u then raise exception 'Invalid connection';end if;
 perform pg_advisory_xact_lock(hashtextextended(least(u,other)::text||greatest(u,other)::text,0));
 select * into c from public.connections where least(from_user_id,to_user_id)=least(u,other) and greatest(from_user_id,to_user_id)=greatest(u,other);
 if operation='cancel' then
  if c.status='blocked' then raise exception 'Connection unavailable' using errcode='42501';end if;
  delete from public.connections where id=c.id;state='none';
 elsif operation='accept' then
  if c.status='accepted' then state='accepted';
  elsif c.status='pending' and c.to_user_id=u then
   update public.connections set status='accepted' where id=c.id;
   insert into public.notifications(user_id,actor_id,verb,event_key) values(other,u,'connection_accepted','connection-accepted:'||c.id) on conflict do nothing;
   state='accepted';
  else raise exception 'No incoming request' using errcode='42501';end if;
 elsif c.id is not null then
  if c.status='blocked' then raise exception 'Connection unavailable' using errcode='42501';end if;
  state=case when c.status='accepted' then 'accepted' when c.from_user_id=u then 'pending_sent' else 'pending_received' end;
 else
  if (select count(*) from public.notifications where actor_id=u and user_id=other and verb='connection_request' and created_at>now()-interval '1 hour')>=5 then
   raise exception 'Please wait before sending another request to this person';end if;
  insert into public.connections(from_user_id,to_user_id) values(u,other) returning * into c;
  insert into public.notifications(user_id,actor_id,verb,event_key) values(other,u,'connection_request','connection-request:'||c.id) on conflict do nothing;
  state='pending_sent';
 end if;
 return jsonb_build_object('connection_status',state);
end $$;
revoke all on function public.colearn_action(text,jsonb) from public,anon;
grant execute on function public.colearn_action(text,jsonb) to authenticated;
