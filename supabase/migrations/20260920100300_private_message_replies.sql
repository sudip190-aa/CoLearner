alter table public.direct_messages add column reply_to_id uuid references public.direct_messages on delete set null;
create index direct_messages_reply on public.direct_messages(reply_to_id);
grant insert(reply_to_id) on public.direct_messages to authenticated;
create function app.validate_private_reply() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.reply_to_id is not null and not exists(select 1 from public.direct_messages original where original.id=new.reply_to_id and least(original.sender_id,original.recipient_id)=least(new.sender_id,new.recipient_id) and greatest(original.sender_id,original.recipient_id)=greatest(new.sender_id,new.recipient_id)) then
  raise exception 'Replies must reference a message in this conversation' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function app.validate_private_reply() from public,anon,authenticated;
create trigger validate_private_reply before insert on public.direct_messages for each row execute function app.validate_private_reply();
