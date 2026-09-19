-- The join RPC holds the project's advisory lock. Notify once when an empty
-- room becomes active, with a cooldown to prevent repeated join/leave spam.
create function app.project_call_notify() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.project_voice_members where project_id=new.project_id
   and user_id<>new.user_id and last_seen_at>now()-interval '45 seconds') then return new; end if;
 if exists(select 1 from public.notifications where verb='project_call'
   and target_id=new.project_id::text and created_at>now()-interval '5 minutes') then return new; end if;
 insert into public.notifications(user_id,actor_id,verb,target_type,target_id,target_label,target_slug,event_key)
 select m.user_id,new.user_id,'project_call','project',p.id::text,p.title,p.slug,'project-call:'||new.session_id
 from public.project_members m join public.projects p on p.id=m.project_id
 where m.project_id=new.project_id and m.user_id<>new.user_id on conflict do nothing;
 return new;
end $$;
revoke all on function app.project_call_notify() from public,anon,authenticated;
create trigger project_call_notify after insert on public.project_voice_members
for each row execute function app.project_call_notify();
