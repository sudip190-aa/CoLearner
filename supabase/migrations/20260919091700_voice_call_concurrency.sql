-- Serialize lease refresh and call allocation; protect connection revocation races.
create or replace function public.colearn_start_call(peer uuid, device_id uuid) returns public.voice_calls
language plpgsql security definer set search_path='' as $$
declare c public.voice_calls; me uuid := auth.uid();
begin
  if device_id is null or not coalesce(app.can_message(peer),false) then
    raise exception 'Only accepted connections can call.' using errcode='42501';
  end if;
  -- Lock both users in a stable order, covering cross-calls and different peers/tabs.
  perform pg_advisory_xact_lock(hashtextextended('voice:'||least(me,peer)::text,0));
  perform pg_advisory_xact_lock(hashtextextended('voice:'||greatest(me,peer)::text,0));
  -- Hold the accepted relationship until insertion commits; revocation then ends this call.
  perform 1 from public.connections where status='accepted'
    and least(from_user_id,to_user_id)=least(me,peer)
    and greatest(from_user_id,to_user_id)=greatest(me,peer) for share;
  if not found or not app.can_message(peer) then
    raise exception 'Only accepted connections can call.' using errcode='42501';
  end if;
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

create or replace function public.colearn_call_action(call_id uuid, operation text, device_id uuid) returns public.voice_calls
language plpgsql security definer set search_path='' as $$
declare c public.voice_calls; me uuid := auth.uid(); owner_device uuid;
begin
  -- Match start-call's lock order before taking a row lock. A delayed heartbeat
  -- must not revive a lease while another transaction allocates a replacement.
  select * into c from public.voice_calls where id=call_id;
  if not found or me is null or me not in(c.caller_id,c.receiver_id) then
    raise exception 'Call not accessible.' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('voice:'||least(c.caller_id,c.receiver_id)::text,0));
  perform pg_advisory_xact_lock(hashtextextended('voice:'||greatest(c.caller_id,c.receiver_id)::text,0));
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
