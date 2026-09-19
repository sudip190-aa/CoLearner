create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
-- The provisioning script writes the same random secret to Vault and Edge secrets.
-- Neither this migration nor the browser contains a privileged key.
create function app.wake_book_worker() returns void language plpgsql security definer set search_path='' as $$ declare worker_secret text;begin
 if not exists(select 1 from public.book_jobs where status='queued' or (status='processing' and lease_until<now())) then return;end if;
 select decrypted_secret into worker_secret from vault.decrypted_secrets where name='book_worker_secret' limit 1;
 if worker_secret is null then return;end if;
 perform net.http_post(url:='https://ghjdpcvnzclfvyosfhoz.supabase.co/functions/v1/book-worker',headers:=jsonb_build_object('Content-Type','application/json','x-book-worker-secret',worker_secret),body:='{}'::jsonb,timeout_milliseconds:=90000);
 end $$;
revoke all on function app.wake_book_worker() from public,anon,authenticated;
select cron.schedule('colearn-book-processing','10 seconds','select app.wake_book_worker()');

-- All content changes invalidate the licensed edition and AI index, including chapter edits.
create or replace function app.chapter_revision() returns trigger language plpgsql security definer set search_path='' as $$ begin
 update public.books set content_revision=content_revision+1,ai_status='NOT_PROCESSED',active_generation=null,
 status=case when status='APPROVED' then 'PENDING_REVIEW' else status end
 where id=coalesce(new.book_id,old.book_id);return coalesce(new,old);end $$;
-- Historical progress must not leak unpublished titles via the public portfolio RPC.
alter function public.colearn_portfolio(text) rename to colearn_portfolio_before_books;
revoke all on function public.colearn_portfolio_before_books(text) from public,anon,authenticated;
create function public.colearn_portfolio(username text) returns jsonb language plpgsql stable security definer set search_path='' as $$ declare result jsonb;begin
 result=public.colearn_portfolio_before_books(username);
 return jsonb_set(result,'{books}',coalesce((select jsonb_agg(v) from jsonb_array_elements(result->'books') v where exists(select 1 from public.books b where b.id=(v->>'id')::bigint and b.status='APPROVED')),'[]'));
 end $$;
revoke all on function public.colearn_portfolio(text) from public;
grant execute on function public.colearn_portfolio(text) to anon,authenticated;
