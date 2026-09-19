-- Extend the existing library; unverified legacy content stays available to staff for review.
create extension if not exists vector with schema extensions;
alter table public.books
 add column status text not null default 'DRAFT' check(status in ('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','ARCHIVED')),
 add column language text not null default 'English',
 add column source_url text not null default '',
 add column license_name text not null default '',
 add column license_url text not null default '',
 add column attribution text not null default '',
 add column changes_made text not null default '',
 add column license_evidence_url text not null default '',
 add column license_evidence_notes text not null default '',
 add column commercial_use_allowed boolean not null default false,
 add column redistribution_confirmed boolean not null default false,
 add column in_app_permission_confirmed boolean not null default false,
 add column file_path text,
 add column file_name text,
 add column file_type text check(file_type in ('pdf','epub')),
 add column file_size bigint,
 add column file_checksum text,
 add column content_revision integer not null default 1,
 add column ai_status text not null default 'NOT_PROCESSED' check(ai_status in ('NOT_PROCESSED','PROCESSING','READY','FAILED')),
 add column active_generation uuid;
update public.books set status='PENDING_REVIEW';
alter table public.chapters
 add column description text not null default '',
 add column page_start integer check(page_start>0),
 add column page_end integer,
 add column est_minutes integer not null default 0 check(est_minutes>=0),
 add column status text not null default 'PUBLISHED' check(status in ('DRAFT','PUBLISHED')),
 add constraint chapter_page_range check((page_start is null and page_end is null) or (page_start is not null and page_end>=page_start));
alter table public.reading_progress add column completed_at timestamptz;
create index books_catalog on public.books(status,category,language);
create table public.chapter_progress (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles on delete cascade,
 book_id bigint not null references public.books on delete cascade,
 chapter_id bigint not null references public.chapters on delete cascade,
 position_percent numeric not null default 0 check(position_percent between 0 and 100),
 last_page integer check(last_page>0), started_at timestamptz not null default now(),
 last_accessed_at timestamptz not null default now(),completed_at timestamptz,
 unique(user_id,chapter_id)
);
create index chapter_progress_book on public.chapter_progress(user_id,book_id);
create table public.book_audit (
 id bigint generated always as identity primary key,book_id bigint references public.books on delete set null,
 actor_id uuid references public.profiles on delete set null,action text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create table public.book_jobs (
 id uuid primary key default gen_random_uuid(),book_id bigint not null references public.books on delete cascade,
 kind text not null check(kind in ('index','summary')),status text not null default 'queued' check(status in ('queued','processing','completed','failed')),
 revision integer not null,stage text not null default 'extract',cursor integer not null default 0,
 attempts integer not null default 0,error text,lease_until timestamptz,lease_token uuid,
 requested_by uuid references public.profiles on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index book_one_live_job on public.book_jobs(book_id) where status in ('queued','processing');
create index book_jobs_queue on public.book_jobs(status,created_at);
create table public.book_pages (
 id bigint generated always as identity primary key,book_id bigint not null references public.books on delete cascade,
 generation uuid not null references public.book_jobs on delete cascade,page_number integer not null check(page_number>0),
 text text not null,unique(generation,page_number)
);
create table public.book_chunks (
 id bigint generated always as identity primary key,book_id bigint not null references public.books on delete cascade,
 chapter_id bigint references public.chapters on delete cascade,generation uuid not null references public.book_jobs on delete cascade,
 ordinal integer not null,content text not null,page_start integer,page_end integer,
 embedding extensions.vector(384),search_vector tsvector generated always as (to_tsvector('english',content)) stored,
 unique(generation,ordinal),check(page_start is null or (page_start>0 and page_end>=page_start))
);
create index book_chunks_scope on public.book_chunks(book_id,generation,chapter_id);
create index book_chunks_search on public.book_chunks using gin(search_vector);
create table public.book_summaries (
 id bigint generated always as identity primary key,book_id bigint not null references public.books on delete cascade,
 chapter_id bigint references public.chapters on delete cascade,generation uuid not null,
 content jsonb not null,created_at timestamptz not null default now(),unique nulls not distinct(book_id,chapter_id)
);
create table public.book_conversations (
 id uuid primary key default gen_random_uuid(),book_id bigint not null references public.books on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,title text not null default 'New conversation',created_at timestamptz not null default now()
);
create table public.book_messages (
 id bigint generated always as identity primary key,conversation_id uuid not null references public.book_conversations on delete cascade,
 role text not null check(role in ('user','assistant')),content text not null,citations jsonb not null default '[]',created_at timestamptz not null default now()
);
create index book_conversations_owner on public.book_conversations(user_id,book_id,created_at);
create index book_messages_thread on public.book_messages(conversation_id,id);
create table public.book_ai_usage (
 id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles on delete set null,
 book_id bigint references public.books on delete set null,kind text not null,provider text not null,
 status text not null default 'reserved',input_tokens integer not null default 0,output_tokens integer not null default 0,
 estimated_cost numeric not null default 0 check(estimated_cost>=0),created_at timestamptz not null default now()
);
create index book_usage_budget on public.book_ai_usage(created_at,user_id);

create function app.book_visible(b bigint) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.books where id=b and (app.staff() or (status='APPROVED' and (auth.uid() is null or app.active())))) $$;
grant execute on function app.book_visible(bigint) to anon,authenticated;
drop policy books_read on public.books;
drop policy chapters_read on public.chapters;
create policy books_read on public.books for select to anon,authenticated using(app.book_visible(id));
create policy chapters_read on public.chapters for select to anon,authenticated using(app.book_visible(book_id) and (status='PUBLISHED' or app.staff()));
grant select on public.books,public.chapters,public.reading_progress to anon;
create or replace function public.colearn_book_stats() returns table(book_id bigint,readers_count bigint) language sql stable security definer set search_path='' as $$
 select b.id,count(r.id) from public.books b left join public.reading_progress r on r.book_id=b.id where app.book_visible(b.id) group by b.id $$;
grant execute on function public.colearn_book_stats() to anon;
do $$ declare t text;begin foreach t in array array['chapter_progress','book_audit','book_jobs','book_pages','book_chunks','book_summaries','book_conversations','book_messages','book_ai_usage'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
end loop;end $$;
grant select on public.chapter_progress,public.book_audit,public.book_jobs,public.book_conversations,public.book_messages,public.book_ai_usage to authenticated;
grant select on public.book_summaries to anon,authenticated;
grant delete on public.book_conversations to authenticated;
create policy chapter_progress_own on public.chapter_progress for select to authenticated using(user_id=auth.uid() and app.active());
create policy book_audit_staff on public.book_audit for select to authenticated using(app.staff());
create policy book_jobs_staff on public.book_jobs for select to authenticated using(app.staff());
create policy summaries_read on public.book_summaries for select using(app.book_visible(book_id) and generation=(select active_generation from public.books where id=book_id));
create policy conversation_own on public.book_conversations for select to authenticated using(user_id=auth.uid() and app.active() and app.book_visible(book_id));
create policy conversation_delete on public.book_conversations for delete to authenticated using(user_id=auth.uid() and app.active());
create policy messages_own on public.book_messages for select to authenticated using(exists(select 1 from public.book_conversations where id=conversation_id and user_id=auth.uid()));
create policy usage_own on public.book_ai_usage for select to authenticated using((user_id=auth.uid() and app.active()) or app.staff());

create function app.validate_book() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.status='APPROVED' and (new.source_url !~ '^https://' or new.license_url !~ '^https://' or new.license_evidence_url !~ '^https://' or length(trim(new.license_name))=0 or length(trim(new.attribution))=0 or length(trim(new.changes_made))=0 or length(trim(new.license_evidence_notes))=0 or not(new.redistribution_confirmed or new.in_app_permission_confirmed)) then
 raise exception 'Approval requires source, license, attribution, changes, evidence and explicit permission for this exact content';end if;
 if tg_op='UPDATE' and (new.file_checksum is distinct from old.file_checksum or new.source_url is distinct from old.source_url or new.license_name is distinct from old.license_name or new.license_url is distinct from old.license_url) then
 new.status='PENDING_REVIEW';new.redistribution_confirmed=false;new.in_app_permission_confirmed=false;
 new.content_revision=old.content_revision+1;new.ai_status='NOT_PROCESSED';new.active_generation=null;
 end if;return new;end $$;
create trigger book_license_check before insert or update on public.books for each row execute function app.validate_book();
create function app.audit_book() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.book_audit(book_id,actor_id,action,details) values(case when tg_op='DELETE' then null else new.id end,auth.uid(),tg_op,jsonb_build_object('title',coalesce(new.title,old.title),'book_id',coalesce(new.id,old.id),'status',case when tg_op='DELETE' then old.status else new.status end));return coalesce(new,old);end $$;
create trigger book_audit_change after insert or update of status or delete on public.books for each row execute function app.audit_book();
create function app.chapter_revision() returns trigger language plpgsql security definer set search_path='' as $$ begin
 update public.books set content_revision=content_revision+1,ai_status='NOT_PROCESSED',active_generation=null where id=coalesce(new.book_id,old.book_id);
 return coalesce(new,old);end $$;
create trigger chapter_revision after insert or update or delete on public.chapters for each row execute function app.chapter_revision();

-- Guard the existing security-definer progress/bookmark path before delegating other actions.
alter function public.colearn_action(text,jsonb) rename to colearn_action_before_books;
revoke execute on function public.colearn_action_before_books(text,jsonb) from public,anon,authenticated;
create function public.colearn_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$ declare c public.chapters;r jsonb;begin
 if action in ('progress','bookmark') then
 select * into c from public.chapters where id=coalesce(payload->>'chapter_id',payload->>'id')::bigint;
 if not app.active() or not app.book_visible(c.book_id) or c.status<>'PUBLISHED' then raise exception 'Book unavailable' using errcode='42501';end if;
 end if;
 r=public.colearn_action_before_books(action,payload);
 if action='progress' then
 insert into public.chapter_progress(user_id,book_id,chapter_id,completed_at) values(auth.uid(),c.book_id,c.id,case when coalesce((payload->>'completed')::boolean,false) then now() end)
 on conflict(user_id,chapter_id) do update set last_accessed_at=now(),completed_at=coalesce(chapter_progress.completed_at,excluded.completed_at);
 update public.reading_progress set completed_at=case when completed then coalesce(completed_at,now()) end where user_id=auth.uid() and book_id=c.book_id;
 end if;return r;end $$;
revoke all on function public.colearn_action(text,jsonb) from public,anon;
grant execute on function public.colearn_action(text,jsonb) to authenticated;
create function public.colearn_reading_position(chapter bigint,read_position numeric default 0,page integer default null) returns void language plpgsql security definer set search_path='' as $$ declare c public.chapters;b public.books;begin
 select * into c from public.chapters where id=chapter;select * into b from public.books where id=c.book_id;
 if not app.active() or not app.book_visible(c.book_id) or c.status<>'PUBLISHED' then raise exception 'Book unavailable' using errcode='42501';end if;
 if read_position is null or read_position<0 or read_position>100 or (page is not null and (page<1 or page>b.total_pages)) then raise exception 'Invalid reading read_position';end if;
 insert into public.chapter_progress(user_id,book_id,chapter_id,position_percent,last_page) values(auth.uid(),c.book_id,c.id,read_position,page)
 on conflict(user_id,chapter_id) do update set position_percent=excluded.position_percent,last_page=excluded.last_page,last_accessed_at=now();
 update public.reading_progress set chapter_id=c.id,last_read_at=now() where user_id=auth.uid() and book_id=c.book_id;
 end $$;
revoke all on function public.colearn_reading_position(bigint,numeric,integer) from public,anon;
grant execute on function public.colearn_reading_position(bigint,numeric,integer) to authenticated;
drop policy notes_insert on public.notes;
create policy notes_insert on public.notes for insert to authenticated with check(user_id=auth.uid() and app.active() and exists(select 1 from public.chapters c where c.id=chapter_id and app.book_visible(c.book_id)));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('book-documents','book-documents',false,20971520,array['application/pdf','application/epub+zip']) on conflict(id) do nothing;
-- No client Storage policies: the Edge Function validates uploads and grants short lived links.
