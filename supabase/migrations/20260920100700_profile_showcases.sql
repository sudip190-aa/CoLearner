-- Personal portfolio artifacts are deliberately independent of team projects.
create table public.profile_showcases (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references public.profiles on delete cascade,
 title text not null check(length(btrim(title)) between 1 and 120),
 description text not null default '' check(length(description)<=3000),
 image_path text unique,
 live_url text not null default '' check(length(live_url)<=2048 and (live_url='' or live_url ~ '^https?://[^[:space:]]+$')),
 repository_url text not null default '' check(length(repository_url)<=2048 and (repository_url='' or repository_url ~ '^https?://[^[:space:]]+$')),
 position integer not null default 0 check(position>=0),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp()
);
create index profile_showcases_order on public.profile_showcases(user_id,position,created_at desc,id);
create trigger touch before update on public.profile_showcases for each row execute function app.touch();
alter table public.profile_showcases enable row level security;
grant select on public.profile_showcases to anon,authenticated;
grant insert(id,user_id,title,description,image_path,live_url,repository_url,position),update(title,description,image_path,live_url,repository_url,position),delete on public.profile_showcases to authenticated;
grant all on public.profile_showcases to service_role;
create policy showcase_read on public.profile_showcases for select using(exists(select 1 from public.profiles p where p.id=user_id and p.is_active));
create policy showcase_create on public.profile_showcases for insert to authenticated with check(app.active() and user_id=auth.uid());
create policy showcase_edit on public.profile_showcases for update to authenticated using(app.active() and user_id=auth.uid()) with check(user_id=auth.uid());
create policy showcase_delete on public.profile_showcases for delete to authenticated using(app.active() and user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('showcase-images','showcase-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy showcase_image_upload on storage.objects for insert to authenticated with check(
 bucket_id='showcase-images' and app.active() and (storage.foldername(name))[1]=auth.uid()::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);
create policy showcase_image_read on storage.objects for select using(bucket_id='showcase-images' and (
 (app.active() and (storage.foldername(name))[1]=auth.uid()::text)
 or exists(select 1 from public.profile_showcases s where s.image_path=name)
));
create policy showcase_image_discard on storage.objects for delete to authenticated using(
 bucket_id='showcase-images' and app.active() and (storage.foldername(name))[1]=auth.uid()::text
 and not exists(select 1 from public.profile_showcases where image_path=name)
);
create function app.validate_showcase_image() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.image_path is not null and (
  new.image_path not like new.user_id::text||'/'||new.id::text||'/%'
  or not exists(select 1 from storage.objects where bucket_id='showcase-images' and name=new.image_path)
 ) then raise exception 'Upload an image for this showcase first' using errcode='42501';end if;
 return new;
end $$;
create trigger validate_showcase_image before insert or update of image_path on public.profile_showcases for each row execute function app.validate_showcase_image();
revoke all on function app.validate_showcase_image() from public,anon,authenticated;
