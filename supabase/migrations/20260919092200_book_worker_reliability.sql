-- Small embedding batches stay within the hosted Edge CPU budget.
select cron.alter_job((select jobid from cron.job where jobname='colearn-book-processing'),schedule:='2 seconds');
create or replace function public.colearn_claim_book_job() returns public.book_jobs language plpgsql security definer set search_path='' as $$ declare j public.book_jobs;begin
 with failed as(update public.book_jobs set status='failed',error='Worker lease expired after three attempts. Retry after checking document size.',lease_until=null where status='processing' and lease_until<now() and attempts>=3 returning book_id)
 update public.books set ai_status='FAILED' where id in(select book_id from failed);
 select * into j from public.book_jobs where status='queued' or (status='processing' and lease_until<now() and attempts<3) order by created_at for update skip locked limit 1;
 if j.id is null then return null;end if;
 update public.book_jobs set status='processing',attempts=attempts+1,lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),updated_at=now() where id=j.id returning * into j;return j;end $$;

-- Stage summary output with its job. Publish the complete set in one transaction.
alter table public.book_jobs add column output jsonb not null default '{}';
create function public.colearn_stage_book_summary(job uuid,token uuid,chapter bigint,summary jsonb) returns void language plpgsql security definer set search_path='' as $$ declare j public.book_jobs;begin
 select * into j from public.book_jobs where id=job for update;
 if j.id is null or j.lease_token is distinct from token or j.status<>'processing' then raise exception 'Job lease lost';end if;
 if chapter is not null and not exists(select 1 from public.chapters where id=chapter and book_id=j.book_id) then raise exception 'Chapter mismatch';end if;
 update public.book_jobs set output=output||jsonb_build_object(coalesce(chapter::text,'book'),summary) where id=job;end $$;
alter function public.colearn_finish_book_job(uuid,uuid,text,integer,text) rename to colearn_finish_book_job_v1;
revoke all on function public.colearn_finish_book_job_v1(uuid,uuid,text,integer,text) from public,anon,authenticated,service_role;
create function public.colearn_finish_book_job(job uuid,token uuid,next_stage text default null,next_cursor integer default 0,failure text default null) returns void language plpgsql security definer set search_path='' as $$ declare j public.book_jobs;b public.books;s record;begin
 select * into j from public.book_jobs where id=job for update;
 if j.id is null or j.lease_token is distinct from token or j.status<>'processing' then raise exception 'Job lease lost';end if;
 select * into b from public.books where id=j.book_id for update;
 if failure is null and next_stage is null and j.kind='summary' and b.status='APPROVED' and b.content_revision=j.revision then
 delete from public.book_summaries where book_id=b.id;
 for s in select * from jsonb_each(j.output) loop
 insert into public.book_summaries(book_id,chapter_id,generation,content) values(b.id,case when s.key='book' then null else s.key::bigint end,b.active_generation,s.value);
 end loop;
 end if;
 perform public.colearn_finish_book_job_v1(job,token,next_stage,next_cursor,failure);end $$;
revoke all on function public.colearn_stage_book_summary(uuid,uuid,bigint,jsonb),public.colearn_finish_book_job(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.colearn_stage_book_summary(uuid,uuid,bigint,jsonb),public.colearn_finish_book_job(uuid,uuid,text,integer,text) to service_role;
