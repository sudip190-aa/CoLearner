-- Resetting/changing a password must invalidate the old Django password forever.
create function app.password_changed() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.encrypted_password is distinct from old.encrypted_password then delete from app.legacy_auth where user_id=new.id;end if;
 return new;end $$;
create trigger invalidate_legacy_password after update of encrypted_password on auth.users for each row execute function app.password_changed();
create function public.colearn_claim_legacy(user_uuid uuid,expected_hash text) returns boolean language plpgsql security definer set search_path='' as $$ begin
 delete from app.legacy_auth where user_id=user_uuid and password_hash=expected_hash;return found;end $$;
revoke all on function public.colearn_claim_legacy(uuid,text) from public,anon,authenticated;
grant execute on function public.colearn_claim_legacy(uuid,text) to service_role;
revoke all on function app.password_changed() from public;
