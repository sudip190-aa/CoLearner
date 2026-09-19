-- Relay credentials are issued only for an authorized call/project and bounded per user.
create table app.voice_ice_limits (
 user_id uuid primary key references public.profiles on delete cascade,
 window_start timestamptz not null,
 requests integer not null
);
revoke all on app.voice_ice_limits from public,anon,authenticated;
create function public.colearn_voice_ice_access(call_id uuid default null, project_id bigint default null)
returns void language plpgsql security definer set search_path='' as $$
declare used integer;
begin
 if not app.active() then raise exception 'Sign in to use calling' using errcode='42501';end if;
 if (call_id is null)=(project_id is null) then raise exception 'Choose one call context' using errcode='22023';end if;
 if project_id is not null and not app.member(project_id) then
  raise exception 'Project membership required' using errcode='42501';
 end if;
 if call_id is not null and not exists(
  select 1 from public.voice_calls c where c.id=call_id and auth.uid() in(c.caller_id,c.receiver_id)
  and app.voice_live(c) and app.can_message(case when c.caller_id=auth.uid() then c.receiver_id else c.caller_id end)
 ) then raise exception 'This call is no longer available' using errcode='42501';end if;
 insert into app.voice_ice_limits(user_id,window_start,requests) values(auth.uid(),clock_timestamp(),1)
 on conflict(user_id) do update set
 requests=case when voice_ice_limits.window_start<now()-interval '10 minutes' then 1 else voice_ice_limits.requests+1 end,
 window_start=case when voice_ice_limits.window_start<now()-interval '10 minutes' then clock_timestamp() else voice_ice_limits.window_start end
 returning requests into used;
 if used>30 then raise exception 'Please wait before starting another call' using errcode='P0001';end if;
end $$;
revoke all on function public.colearn_voice_ice_access(uuid,bigint) from public,anon;
grant execute on function public.colearn_voice_ice_access(uuid,bigint) to authenticated;

alter table public.project_voice_signals drop constraint project_voice_signals_payload_check;
alter table public.project_voice_signals add constraint project_voice_signals_payload_check check(
 jsonb_typeof(payload)='object' and length(payload::text)<=65536
 and payload->>'type' in('offer','answer','ice','restart')
);
