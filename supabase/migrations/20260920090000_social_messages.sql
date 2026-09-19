-- Extend the existing private inbox and central notification stream.
alter table public.notifications add column target_anchor text not null default '';
alter table public.notifications add column event_key text;
create unique index notification_event_once on public.notifications(user_id,event_key) where event_key is not null;
alter publication supabase_realtime add table public.notifications;

alter table public.direct_messages add column image_path text;
alter table public.direct_messages drop constraint direct_messages_body_check;
alter table public.direct_messages add constraint message_content check (
  char_length(body)<=4000 and (char_length(btrim(body))>0 or image_path is not null)
);
grant insert(image_path) on public.direct_messages to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chat-images','chat-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy chat_image_upload on storage.objects for insert to authenticated with check(
  bucket_id='chat-images' and (storage.foldername(name))[1]=auth.uid()::text
  and app.can_message(((storage.foldername(name))[2])::uuid)
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);
create policy chat_image_read on storage.objects for select to authenticated using(
  bucket_id='chat-images' and app.active() and (
    (storage.foldername(name))[1]=auth.uid()::text or exists(
      select 1 from public.direct_messages m where m.image_path=name and auth.uid() in(m.sender_id,m.recipient_id)
    )
  )
);
create policy chat_image_discard on storage.objects for delete to authenticated using(
  bucket_id='chat-images' and app.active() and (storage.foldername(name))[1]=auth.uid()::text
  and not exists(select 1 from public.direct_messages where image_path=name)
);
create function app.validate_message_image() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.image_path is not null then
    if new.image_path not in(new.sender_id::text||'/'||new.recipient_id::text||'/'||new.id::text||'.jpg',new.sender_id::text||'/'||new.recipient_id::text||'/'||new.id::text||'.png',new.sender_id::text||'/'||new.recipient_id::text||'/'||new.id::text||'.webp')
      or not exists(select 1 from storage.objects where bucket_id='chat-images' and name=new.image_path) then
      raise exception 'Upload this message image first' using errcode='42501';
    end if;
  end if;return new;
end $$;
create trigger validate_message_image before insert on public.direct_messages for each row execute function app.validate_message_image();
create function app.message_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.notifications(user_id,actor_id,verb,target_type,target_label,target_slug,event_key)
  values(new.recipient_id,new.sender_id,'direct_message','message',case when new.image_path is not null then 'Sent an image' else left(new.body,100) end,new.sender_id::text,'message:'||new.id)
  on conflict do nothing;return new;
end $$;
create trigger message_notification after insert on public.direct_messages for each row execute function app.message_notification();

create or replace function public.colearn_message_contacts() returns table (
  id uuid, username text, full_name text, avatar text, headline text,
  last_message text, last_sender_id uuid, last_message_at timestamptz, unread_count bigint
) language sql stable security invoker set search_path='' as $$
 select p.id,p.username,p.full_name,p.avatar,p.headline,case when m.image_path is not null and btrim(m.body)='' then 'Image' else m.body end,m.sender_id,m.created_at,
 (select count(*) from public.direct_messages d where d.sender_id=p.id and d.recipient_id=auth.uid() and d.read_at is null)
 from public.connections c join public.profiles p on p.id=case when c.from_user_id=auth.uid() then c.to_user_id else c.from_user_id end
 left join lateral (select d.body,d.image_path,d.sender_id,d.created_at from public.direct_messages d where least(d.sender_id,d.recipient_id)=least(auth.uid(),p.id) and greatest(d.sender_id,d.recipient_id)=greatest(auth.uid(),p.id) order by d.created_at desc,d.id desc limit 1) m on true
 where c.status='accepted' and auth.uid() in(c.from_user_id,c.to_user_id) and p.is_active and app.active()
 order by m.created_at desc nulls last,p.full_name,p.id;
$$;

create function app.voice_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(user_id,actor_id,verb,target_type,target_slug,event_key)
 values(new.receiver_id,new.caller_id,'voice_call','message',new.caller_id::text,'voice:'||new.id) on conflict do nothing;
 return new;
end $$;
create trigger voice_notification after insert on public.voice_calls for each row execute function app.voice_notification();

-- This is a profile preference, never an authorization role.
alter table public.profiles add column notification_sound boolean not null default true;
grant update(notification_sound) on public.profiles to authenticated;
