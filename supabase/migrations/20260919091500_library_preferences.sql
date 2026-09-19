-- Private reading lists and student learning preferences. Existing books stay intact.
create table public.saved_books (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id bigint not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index saved_books_book on public.saved_books(book_id);

create table public.library_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  goal text not null default 'explore' check (goal in ('explore','fundamentals','projects','exams','career')),
  topics text[] not null default '{}' check (cardinality(topics) <= 12 and array_position(topics,null) is null),
  level text not null default 'all' check (level in ('all','beginner','intermediate','advanced')),
  session_minutes integer not null default 30 check (session_minutes in (15,30,60)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger touch before update on public.library_preferences for each row execute function app.touch();

alter table public.saved_books enable row level security;
alter table public.library_preferences enable row level security;
revoke all on public.saved_books, public.library_preferences from public, anon, authenticated;
grant select, insert, delete on public.saved_books to authenticated;
grant select, insert, update on public.library_preferences to authenticated;
grant all on public.saved_books, public.library_preferences to service_role;
create policy saved_books_own on public.saved_books to authenticated
  using (auth.uid()=user_id and app.active())
  with check (auth.uid()=user_id and app.active());
create policy library_preferences_own on public.library_preferences to authenticated
  using (auth.uid()=user_id and app.active())
  with check (auth.uid()=user_id and app.active());
