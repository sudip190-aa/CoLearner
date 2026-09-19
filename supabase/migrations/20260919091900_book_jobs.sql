create function public.colearn_queue_book(book bigint,job_kind text default 'index') returns uuid language plpgsql security definer set search_path='' as $$ declare b public.books;j uuid;begin
 if not app.staff() then raise exception 'Staff required' using errcode='42501';end if;
 select * into b from public.books where id=book for update;
 if b.status is distinct from 'APPROVED' then raise exception 'Only approved books can be processed';end if;
 if job_kind not in ('index','summary') then raise exception 'Invalid job';end if;
 if job_kind='summary' and b.active_generation is null then raise exception 'Process the book before generating a summary';end if;
 insert into public.book_jobs(book_id,kind,revision,requested_by) values(book,job_kind,b.content_revision,auth.uid()) returning id into j;
 update public.books set ai_status='PROCESSING' where id=book;
 insert into public.book_audit(book_id,actor_id,action,details) values(book,auth.uid(),'QUEUE',jsonb_build_object('kind',job_kind,'job',j));return j;
 end $$;
create function public.colearn_delete_book_ai(book bigint) returns void language plpgsql security definer set search_path='' as $$ begin
 if not app.staff() then raise exception 'Staff required' using errcode='42501';end if;
 perform 1 from public.books where id=book for update;
 update public.books set active_generation=null,ai_status='NOT_PROCESSED',content_revision=content_revision+1 where id=book;
 delete from public.book_jobs where book_id=book;delete from public.book_summaries where book_id=book;
 insert into public.book_audit(book_id,actor_id,action) values(book,auth.uid(),'DELETE_AI');end $$;
revoke all on function public.colearn_queue_book(bigint,text),public.colearn_delete_book_ai(bigint) from public,anon;
grant execute on function public.colearn_queue_book(bigint,text),public.colearn_delete_book_ai(bigint) to authenticated;

create function public.colearn_claim_book_job() returns public.book_jobs language plpgsql security definer set search_path='' as $$ declare j public.book_jobs;begin
 update public.book_jobs set status='failed',error='Worker lease expired after three attempts',lease_until=null where status='processing' and lease_until<now() and attempts>=3;
 select * into j from public.book_jobs where status='queued' or (status='processing' and lease_until<now() and attempts<3) order by created_at for update skip locked limit 1;
 if j.id is null then return null;end if;
 update public.book_jobs set status='processing',attempts=attempts+1,lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),updated_at=now() where id=j.id returning * into j;return j;end $$;
create function public.colearn_finish_book_job(job uuid,token uuid,next_stage text default null,next_cursor integer default 0,failure text default null) returns void language plpgsql security definer set search_path='' as $$ declare j public.book_jobs;b public.books;begin
 select * into j from public.book_jobs where id=job for update;
 if j.id is null or j.lease_token is distinct from token or j.status<>'processing' then raise exception 'Job lease lost';end if;
 select * into b from public.books where id=j.book_id for update;
 if b.status<>'APPROVED' or b.content_revision<>j.revision then failure='Book changed or approval was withdrawn. Review and reprocess.';end if;
 if failure is not null then
 update public.book_jobs set status='failed',error=left(failure,500),lease_until=null,updated_at=now() where id=job;
 update public.books set ai_status='FAILED' where id=b.id;
 elsif next_stage is not null then
 update public.book_jobs set status='queued',stage=next_stage,cursor=next_cursor,attempts=0,lease_until=null,updated_at=now() where id=job;
 else
 if j.kind='index' then
 if not exists(select 1 from public.book_chunks where generation=job and embedding is not null) then raise exception 'No searchable text. Scanned PDFs need a text layer or administrator-written chapters.';end if;
 update public.books set active_generation=job,ai_status='READY' where id=b.id;
 delete from public.book_chunks where book_id=b.id and generation<>job;
 delete from public.book_pages where book_id=b.id and generation<>job;
 delete from public.book_summaries where book_id=b.id;
 else update public.books set ai_status='READY' where id=b.id;end if;
 update public.book_jobs set status='completed',error=null,lease_until=null,updated_at=now() where id=job;
 end if;end $$;
create function public.colearn_book_retrieve(book bigint,question text,query_embedding extensions.vector(384),chapter bigint default null,row_limit integer default 6) returns table(id bigint,content text,chapter_id bigint,page_start integer,page_end integer,score real) language sql stable security definer set search_path='' as $$
 select c.id,c.content,c.chapter_id,c.page_start,c.page_end,
 ((1-(c.embedding OPERATOR(extensions.<=>) query_embedding))*0.65 + least(ts_rank_cd(c.search_vector,websearch_to_tsquery('english',question))*2,0.3) + case when c.chapter_id=chapter then 0.12 else 0 end)::real score
 from public.book_chunks c join public.books b on b.id=c.book_id and b.active_generation=c.generation
 where c.book_id=book and b.status='APPROVED' and c.embedding is not null
 order by score desc,c.ordinal limit least(greatest(row_limit,1),8) $$;
create function public.colearn_reserve_book_usage(viewer uuid,book bigint,usage_kind text,provider_name text,reserve numeric,budget numeric) returns uuid language plpgsql security definer set search_path='' as $$ declare uid uuid;begin
 perform pg_advisory_xact_lock(hashtextextended('colearn-book-ai-budget',0));
 if reserve<0 or budget<0 or reserve>1 then raise exception 'Invalid budget';end if;
 if not exists(select 1 from public.books where id=book and status='APPROVED') then raise exception 'Book unavailable';end if;
 if viewer is not null and (select count(*) from public.book_ai_usage where user_id=viewer and created_at>now()-interval '1 minute')>=10 then raise exception 'Too many questions. Try again in a minute.';end if;
 if coalesce((select sum(estimated_cost) from public.book_ai_usage where created_at>=date_trunc('month',now())),0)+reserve>budget then raise exception 'The monthly assistant budget has been reached.';end if;
 if (select count(*) from public.book_ai_usage where created_at>now()-interval '1 day')>=5000 then raise exception 'Daily assistant limit reached';end if;
 insert into public.book_ai_usage(user_id,book_id,kind,provider,estimated_cost) values(viewer,book,usage_kind,provider_name,reserve) returning id into uid;return uid;end $$;
revoke all on function public.colearn_claim_book_job(),public.colearn_finish_book_job(uuid,uuid,text,integer,text),public.colearn_book_retrieve(bigint,text,extensions.vector,bigint,integer),public.colearn_reserve_book_usage(uuid,bigint,text,text,numeric,numeric) from public,anon,authenticated;
grant execute on function public.colearn_claim_book_job(),public.colearn_finish_book_job(uuid,uuid,text,integer,text),public.colearn_book_retrieve(bigint,text,extensions.vector,bigint,integer),public.colearn_reserve_book_usage(uuid,bigint,text,text,numeric,numeric) to service_role;
