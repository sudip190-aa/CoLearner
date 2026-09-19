create table public.thread_mentions (
 thread_id bigint not null references public.threads on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 primary key(thread_id,user_id)
);
alter table public.thread_mentions enable row level security;
grant select on public.thread_mentions to authenticated;
grant all on public.thread_mentions to service_role;
create policy thread_mentions_read on public.thread_mentions for select to authenticated using(app.active());
create function app.thread_mentions() returns trigger language plpgsql security definer set search_path='' as $$
declare person uuid;
begin
 for person in
  select distinct p.id from regexp_matches(new.body,'(^|[^A-Za-z0-9_@])@([A-Za-z0-9_][A-Za-z0-9_.-]{2,149})','g') as match
  join public.profiles p on lower(p.username)=lower(match[2]) and p.is_active
  join public.connections c on c.status='accepted' and least(c.from_user_id,c.to_user_id)=least(new.author_id,p.id) and greatest(c.from_user_id,c.to_user_id)=greatest(new.author_id,p.id)
  where p.id<>new.author_id
 loop
  insert into public.thread_mentions(thread_id,user_id) values(new.id,person) on conflict do nothing;
  if found then
   insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug,event_key)
   values(person,new.author_id,'mentioned_you','thread',new.id,new.title,new.slug,'thread-mention:'||new.id) on conflict do nothing;
  end if;
 end loop; return new;
end $$;
create trigger thread_mentions after insert or update of body on public.threads for each row execute function app.thread_mentions();
revoke all on function app.thread_mentions() from public,anon,authenticated;

create function public.colearn_read_mentions(discussion bigint,comment_ids bigint[] default '{}',post_seen boolean default false) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 update public.notifications n set is_read=true where n.user_id=auth.uid() and not n.is_read and n.verb='mentioned_you'
  and n.target_type='thread' and n.target_id=discussion::text
  and ((post_seen and n.target_anchor='') or exists(select 1 from public.comments c where c.thread_id=discussion
    and c.id=any(comment_ids) and n.target_anchor='comment-'||c.id));
end $$;
revoke all on function public.colearn_read_mentions(bigint,bigint[],boolean) from public,anon;
grant execute on function public.colearn_read_mentions(bigint,bigint[],boolean) to authenticated;
