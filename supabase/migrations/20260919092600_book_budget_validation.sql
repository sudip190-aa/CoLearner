-- Invalid server configuration must fail closed instead of disabling budget enforcement.
create or replace function public.colearn_reserve_book_usage(viewer uuid,book bigint,usage_kind text,provider_name text,reserve numeric,budget numeric) returns uuid language plpgsql security definer set search_path='' as $$ declare uid uuid;begin
 perform pg_advisory_xact_lock(hashtextextended('colearn-book-ai-budget',0));
 if reserve is null or budget is null or reserve<0 or budget<0 or reserve>1 or reserve='NaN'::numeric or budget='NaN'::numeric or budget='Infinity'::numeric then raise exception 'Invalid assistant budget configuration';end if;
 if not exists(select 1 from public.books where id=book and status='APPROVED') then raise exception 'Book unavailable';end if;
 if viewer is not null and (select count(*) from public.book_ai_usage where user_id=viewer and created_at>now()-interval '1 minute')>=10 then raise exception 'Too many questions. Try again in a minute.';end if;
 if coalesce((select sum(estimated_cost) from public.book_ai_usage where created_at>=date_trunc('month',now())),0)+reserve>budget then raise exception 'The monthly assistant budget has been reached.';end if;
 if (select count(*) from public.book_ai_usage where created_at>now()-interval '1 day')>=5000 then raise exception 'Daily assistant limit reached';end if;
 insert into public.book_ai_usage(user_id,book_id,kind,provider,estimated_cost) values(viewer,book,usage_kind,provider_name,reserve) returning id into uid;return uid;end $$;
