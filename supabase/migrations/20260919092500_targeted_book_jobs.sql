-- A staff-authorized worker invocation can run a specific job for retry/verification.
create function public.colearn_claim_specific_book_job(target_job uuid) returns public.book_jobs language plpgsql security definer set search_path='' as $$ declare j public.book_jobs;begin
 select * into j from public.book_jobs where id=target_job and (status='queued' or (status='processing' and lease_until<now() and attempts<3)) for update skip locked;
 if j.id is null then return null;end if;
 update public.book_jobs set status='processing',attempts=attempts+1,lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),updated_at=now() where id=j.id returning * into j;return j;end $$;
revoke all on function public.colearn_claim_specific_book_job(uuid) from public,anon,authenticated;
grant execute on function public.colearn_claim_specific_book_job(uuid) to service_role;
-- Staff metadata edits are audited; sensitive reading history is never copied into this log.
drop trigger book_audit_change on public.books;
create trigger book_audit_change after insert or update of title,author,description,status,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,in_app_permission_confirmed or delete on public.books for each row execute function app.audit_book();
