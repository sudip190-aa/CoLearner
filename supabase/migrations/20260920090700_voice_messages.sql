-- Recorded voice notes use the existing private conversation and notification model.
alter table public.direct_messages add column audio_path text;
alter table public.direct_messages add column audio_duration_ms integer;
alter table public.direct_messages drop constraint message_content;
alter table public.direct_messages add constraint message_content check (
  char_length(body) <= 4000
  and (char_length(btrim(body)) > 0 or image_path is not null or audio_path is not null)
  and not (image_path is not null and audio_path is not null)
);
alter table public.direct_messages add constraint message_audio_metadata check (
  (audio_path is null and audio_duration_ms is null)
  or (audio_path is not null and audio_duration_ms is not null and audio_duration_ms between 1 and 120000)
);
grant insert(audio_path,audio_duration_ms) on public.direct_messages to authenticated;
create index direct_messages_audio_path on public.direct_messages(audio_path) where audio_path is not null;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chat-audio','chat-audio',false,5242880,array['audio/webm','audio/ogg','audio/mp4']);

create policy chat_audio_upload on storage.objects for insert to authenticated with check (
  bucket_id='chat-audio' and (storage.foldername(name))[1]=auth.uid()::text
  and app.can_message(((storage.foldername(name))[2])::uuid)
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webm|ogg|m4a)$'
);
create policy chat_audio_read on storage.objects for select to authenticated using (
  bucket_id='chat-audio' and app.active() and (
    (storage.foldername(name))[1]=auth.uid()::text or exists (
      select 1 from public.direct_messages m where m.audio_path=name and auth.uid() in(m.sender_id,m.recipient_id)
    )
  )
);
create policy chat_audio_discard on storage.objects for delete to authenticated using (
  bucket_id='chat-audio' and app.active() and (storage.foldername(name))[1]=auth.uid()::text
  and not exists(select 1 from public.direct_messages where audio_path=name)
);

create function app.validate_message_audio() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.audio_path is not null and (
    new.audio_path not in (
      new.sender_id::text||'/'||new.recipient_id::text||'/'||new.id::text||'.webm',
      new.sender_id::text||'/'||new.recipient_id::text||'/'||new.id::text||'.ogg',
      new.sender_id::text||'/'||new.recipient_id::text||'/'||new.id::text||'.m4a'
    ) or not exists(select 1 from storage.objects where bucket_id='chat-audio' and name=new.audio_path)
  ) then raise exception 'Upload this voice message first' using errcode='42501';end if;
  return new;
end $$;
create trigger validate_message_audio before insert on public.direct_messages for each row execute function app.validate_message_audio();

create or replace function app.message_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.notifications(user_id,actor_id,verb,target_type,target_label,target_slug,event_key)
  values(new.recipient_id,new.sender_id,'direct_message','message',
    case when new.audio_path is not null then 'Sent a voice message' when new.image_path is not null then 'Sent an image' else left(new.body,100) end,
    new.sender_id::text,'message:'||new.id)
  on conflict do nothing;return new;
end $$;

create or replace function public.colearn_message_contacts() returns table (
  id uuid, username text, full_name text, avatar text, headline text,
  last_message text, last_sender_id uuid, last_message_at timestamptz, unread_count bigint
) language sql stable security invoker set search_path='' as $$
  select p.id,p.username,p.full_name,p.avatar,p.headline,
    case when m.audio_path is not null then 'Voice message' when m.image_path is not null and btrim(m.body)='' then 'Image' else m.body end,
    m.sender_id,m.created_at,
    (select count(*) from public.direct_messages d where d.sender_id=p.id and d.recipient_id=auth.uid() and d.read_at is null)
  from public.connections c join public.profiles p on p.id=case when c.from_user_id=auth.uid() then c.to_user_id else c.from_user_id end
  left join lateral (
    select d.body,d.image_path,d.audio_path,d.sender_id,d.created_at from public.direct_messages d
    where least(d.sender_id,d.recipient_id)=least(auth.uid(),p.id) and greatest(d.sender_id,d.recipient_id)=greatest(auth.uid(),p.id)
    order by d.created_at desc,d.id desc limit 1
  ) m on true
  where c.status='accepted' and auth.uid() in(c.from_user_id,c.to_user_id) and p.is_active and app.active()
  order by m.created_at desc nulls last,p.full_name,p.id;
$$;
