create or replace function public.colearn_read_project(project bigint,through_id bigint) returns void language plpgsql security definer set search_path='' as $$
begin
 if not app.member(project) then raise exception 'Project membership required' using errcode='42501';end if;
 if not exists(select 1 from public.project_messages where project_id=project and id=through_id) then return;end if;
 insert into public.project_message_reads(project_id,user_id,last_read_id) values(project,auth.uid(),through_id)
 on conflict(project_id,user_id) do update set last_read_id=greatest(project_message_reads.last_read_id,excluded.last_read_id);
 update public.notifications n set is_read=true where user_id=auth.uid() and verb='project_message' and target_id=project::text
 and exists(select 1 from public.project_messages m where m.project_id=project and m.id<=through_id and n.event_key='project-message:'||m.id);
end $$;

alter table public.project_voice_signals add constraint project_voice_signal_kind check(payload ? 'type');
