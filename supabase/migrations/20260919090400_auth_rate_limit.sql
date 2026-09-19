create table app.auth_attempts(key_hash text not null,created_at timestamptz not null default now());
create index auth_attempt_rate on app.auth_attempts(key_hash,created_at);
create function public.colearn_auth_attempt(key_hash text) returns void language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtextextended(key_hash,0));delete from app.auth_attempts where created_at<now()-interval '1 day';
 if (select count(*) from app.auth_attempts a where a.key_hash=colearn_auth_attempt.key_hash and created_at>now()-interval '15 minutes')>=10 then raise exception 'Too many login attempts. Try again later.';end if;
 insert into app.auth_attempts(key_hash) values(key_hash);end $$;
revoke all on function public.colearn_auth_attempt(text) from public,anon,authenticated;
grant execute on function public.colearn_auth_attempt(text) to service_role;
