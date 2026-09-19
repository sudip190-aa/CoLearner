-- Private, connection-gated messaging. No staff bypass for private conversations.
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default clock_timestamp(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);
create index direct_messages_pair on public.direct_messages(least(sender_id,recipient_id),greatest(sender_id,recipient_id),created_at desc,id desc);
create index direct_messages_sender on public.direct_messages(sender_id,created_at desc);
create index direct_messages_unread on public.direct_messages(recipient_id,sender_id,created_at) where read_at is null;
create index direct_messages_recipient on public.direct_messages(recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
revoke all on public.direct_messages from public, anon, authenticated;
grant select on public.direct_messages to authenticated;
grant insert(id,sender_id,recipient_id,body) on public.direct_messages to authenticated;
grant all on public.direct_messages to service_role;

create function app.can_message(peer uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select app.active() and exists(select 1 from public.profiles where id=peer and is_active)
    and exists(select 1 from public.connections where status='accepted'
      and least(from_user_id,to_user_id)=least(auth.uid(),peer)
      and greatest(from_user_id,to_user_id)=greatest(auth.uid(),peer));
$$;
revoke all on function app.can_message(uuid) from public,anon;
grant execute on function app.can_message(uuid) to authenticated;
create policy messages_read on public.direct_messages for select to authenticated
  using(app.active() and auth.uid() in (sender_id,recipient_id));
create policy messages_send on public.direct_messages for insert to authenticated
  with check(sender_id=auth.uid() and app.can_message(recipient_id));

create function app.message_rate_limit() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('message:' || new.sender_id::text,0));
  if (select count(*) from public.direct_messages where sender_id=new.sender_id and created_at>clock_timestamp()-interval '1 minute')>=30 then
    raise exception 'You are sending messages too quickly. Please wait a minute.' using errcode='P0001';
  end if;
  return new;
end $$;
create trigger message_rate_limit before insert on public.direct_messages for each row execute function app.message_rate_limit();

create function public.colearn_message_contacts() returns table (
  id uuid, username text, full_name text, avatar text, headline text,
  last_message text, last_sender_id uuid, last_message_at timestamptz, unread_count bigint
) language sql stable security invoker set search_path='' as $$
  select p.id,p.username,p.full_name,p.avatar,p.headline,m.body,m.sender_id,m.created_at,
    (select count(*) from public.direct_messages d where d.sender_id=p.id and d.recipient_id=auth.uid() and d.read_at is null)
  from public.connections c
  join public.profiles p on p.id=case when c.from_user_id=auth.uid() then c.to_user_id else c.from_user_id end
  left join lateral (
    select d.body,d.sender_id,d.created_at from public.direct_messages d
    where least(d.sender_id,d.recipient_id)=least(auth.uid(),p.id)
      and greatest(d.sender_id,d.recipient_id)=greatest(auth.uid(),p.id)
    order by d.created_at desc,d.id desc limit 1
  ) m on true
  where c.status='accepted' and auth.uid() in(c.from_user_id,c.to_user_id) and p.is_active and app.active()
  order by m.created_at desc nulls last,p.full_name,p.id;
$$;
revoke all on function public.colearn_message_contacts() from public,anon;
grant execute on function public.colearn_message_contacts() to authenticated;

create function public.colearn_read_messages(peer uuid, through_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not app.can_message(peer) then raise exception 'An accepted connection is required.' using errcode='42501'; end if;
  update public.direct_messages set read_at=clock_timestamp()
  where recipient_id=auth.uid() and sender_id=peer and read_at is null
    and created_at<=least(through_at,clock_timestamp());
end $$;
revoke all on function public.colearn_read_messages(uuid,timestamptz) from public,anon;
grant execute on function public.colearn_read_messages(uuid,timestamptz) to authenticated;
alter publication supabase_realtime add table public.direct_messages;
