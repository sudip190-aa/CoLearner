-- Only call coordination metadata is persisted. Audio, SDP and ICE are never stored.
create table public.voice_calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  caller_device uuid not null,
  receiver_device uuid,
  status text not null default 'ringing' check (status in ('ringing','accepted','ended','declined','unavailable','failed')),
  created_at timestamptz not null default clock_timestamp(),
  accepted_at timestamptz,
  ended_at timestamptz,
  caller_seen_at timestamptz not null default clock_timestamp(),
  receiver_seen_at timestamptz,
  check (caller_id <> receiver_id)
);
create index voice_calls_caller_active on public.voice_calls(caller_id,created_at desc) where status in ('ringing','accepted');
create index voice_calls_receiver_active on public.voice_calls(receiver_id,created_at desc) where status in ('ringing','accepted');
create index voice_calls_rate on public.voice_calls(caller_id,created_at desc);
alter table public.voice_calls enable row level security;
revoke all on public.voice_calls from public,anon,authenticated;
grant select on public.voice_calls to authenticated;
grant all on public.voice_calls to service_role;
create policy voice_calls_participants on public.voice_calls for select to authenticated
  using (app.active() and auth.uid() in (caller_id,receiver_id));

create function app.voice_live(c public.voice_calls) returns boolean
language sql stable set search_path='' as $$
  select c.status in ('ringing','accepted')
    and c.caller_seen_at > now()-interval '45 seconds'
    and case when c.status='ringing' then c.created_at > now()-interval '45 seconds'
      else c.receiver_seen_at > now()-interval '45 seconds' end;
$$;
revoke all on function app.voice_live(public.voice_calls) from public,anon;
grant execute on function app.voice_live(public.voice_calls) to authenticated;

create function public.colearn_start_call(peer uuid, device_id uuid) returns public.voice_calls
language plpgsql security definer set search_path='' as $$
declare c public.voice_calls; me uuid := auth.uid();
begin
  if device_id is null or not coalesce(app.can_message(peer),false) then
    raise exception 'Only accepted connections can call.' using errcode='42501';
  end if;
  -- Lock both users in a stable order, covering cross-calls and different peers/tabs.
  perform pg_advisory_xact_lock(hashtextextended('voice:'||least(me,peer)::text,0));
  perform pg_advisory_xact_lock(hashtextextended('voice:'||greatest(me,peer)::text,0));
  if exists(select 1 from public.voice_calls v where (me in(v.caller_id,v.receiver_id) or peer in(v.caller_id,v.receiver_id)) and app.voice_live(v)) then
    raise exception 'You or your connection are already in a call.' using errcode='P0001';
  end if;
  if (select count(*) from public.voice_calls where caller_id=me and created_at>now()-interval '1 minute')>=5 then
    raise exception 'Please wait a minute before calling again.' using errcode='P0001';
  end if;
  update public.voice_calls v set status='unavailable',ended_at=clock_timestamp()
    where (me in(v.caller_id,v.receiver_id) or peer in(v.caller_id,v.receiver_id)) and status in('ringing','accepted') and not app.voice_live(v);
  insert into public.voice_calls(caller_id,receiver_id,caller_device) values(me,peer,device_id) returning * into c;
  return c;
end $$;

create function public.colearn_call_action(call_id uuid, operation text, device_id uuid) returns public.voice_calls
language plpgsql security definer set search_path='' as $$
declare c public.voice_calls; me uuid := auth.uid(); owner_device uuid;
begin
  select * into c from public.voice_calls where id=call_id for update;
  if not found or not coalesce(app.active(),false) or me not in(c.caller_id,c.receiver_id) or device_id is null then
    raise exception 'Call not accessible.' using errcode='42501';
  end if;
  if c.status not in('ringing','accepted') then return c; end if;
  if not app.voice_live(c) or not app.can_message(case when me=c.caller_id then c.receiver_id else c.caller_id end) then
    update public.voice_calls set status='unavailable',ended_at=clock_timestamp() where id=c.id returning * into c;
    return c;
  end if;
  owner_device := case when me=c.caller_id then c.caller_device else c.receiver_device end;
  if operation='accept' and me=c.receiver_id and c.status='ringing' then
    update public.voice_calls set status='accepted',receiver_device=device_id,accepted_at=clock_timestamp(),receiver_seen_at=clock_timestamp() where id=c.id returning * into c;
    return c;
  end if;
  if operation='decline' and me=c.receiver_id and c.status='ringing' then
    update public.voice_calls set status='declined',ended_at=clock_timestamp() where id=c.id returning * into c;
    return c;
  end if;
  if owner_device is distinct from device_id then
    raise exception 'This call is active in another tab or device.' using errcode='42501';
  end if;
  if operation='heartbeat' then
    update public.voice_calls set caller_seen_at=case when me=caller_id then clock_timestamp() else caller_seen_at end,
      receiver_seen_at=case when me=receiver_id then clock_timestamp() else receiver_seen_at end where id=c.id returning * into c;
  elsif operation in('end','fail') then
    update public.voice_calls set status=case when operation='end' then 'ended' else 'failed' end,ended_at=clock_timestamp() where id=c.id returning * into c;
  else raise exception 'Invalid call action.' using errcode='22023';
  end if;
  return c;
end $$;
revoke all on function public.colearn_start_call(uuid,uuid), public.colearn_call_action(uuid,text,uuid) from public,anon;
grant execute on function public.colearn_start_call(uuid,uuid), public.colearn_call_action(uuid,text,uuid) to authenticated;

-- Directional channels bind sender identity to the authenticated topic, never payload.from.
-- Clients subscribe to PRIVATE channels only; public names cannot reach private subscribers.
create function app.voice_topic_allowed(topic text, sending boolean) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.voice_calls c
    where topic in ('voice:'||c.id::text||':'||c.caller_id::text,'voice:'||c.id::text||':'||c.receiver_id::text)
      and auth.uid() in(c.caller_id,c.receiver_id) and app.voice_live(c)
      and app.can_message(case when auth.uid()=c.caller_id then c.receiver_id else c.caller_id end)
      and (not sending or topic='voice:'||c.id::text||':'||auth.uid()::text));
$$;
revoke all on function app.voice_topic_allowed(text,boolean) from public,anon;
grant execute on function app.voice_topic_allowed(text,boolean) to authenticated;
create policy voice_signal_receive on realtime.messages for select to authenticated
  using (extension='broadcast' and app.voice_topic_allowed((select realtime.topic()),false));
create policy voice_signal_send on realtime.messages for insert to authenticated
  with check (extension='broadcast' and app.voice_topic_allowed((select realtime.topic()),true));

create function app.end_disconnected_calls() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='DELETE' or new.status<>'accepted' then
    update public.voice_calls set status='ended',ended_at=clock_timestamp()
      where status in('ringing','accepted') and least(caller_id,receiver_id)=least(old.from_user_id,old.to_user_id)
      and greatest(caller_id,receiver_id)=greatest(old.from_user_id,old.to_user_id);
  end if;
  return null;
end $$;
create trigger end_disconnected_calls after update of status or delete on public.connections for each row execute function app.end_disconnected_calls();
alter publication supabase_realtime add table public.voice_calls;
