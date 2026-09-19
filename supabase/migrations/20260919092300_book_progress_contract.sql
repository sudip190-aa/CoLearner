-- Keep the established RPC response fields, with the authoritative completed chapter IDs.
create or replace function public.colearn_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.chapters;rp public.reading_progress;r jsonb;bid bigint;cnt integer;points integer=0;p public.profiles;
begin
 if action in ('progress','bookmark') then
 select * into c from public.chapters where id=coalesce(payload->>'chapter_id',payload->>'id')::bigint;
 if not app.active() or not app.book_visible(c.book_id) or c.status<>'PUBLISHED' then raise exception 'Book unavailable' using errcode='42501';end if;
 end if;
 if action<>'progress' then return public.colearn_action_before_books(action,payload);end if;
 select id into bid from public.books where slug=payload->>'slug';
 if c.book_id is distinct from bid then raise exception 'Chapter does not belong to book';end if;
 insert into public.reading_progress(user_id,book_id) values(auth.uid(),bid) on conflict do nothing;
 select * into rp from public.reading_progress where user_id=auth.uid() and book_id=bid for update;
 if coalesce((payload->>'completed')::boolean,false) and not(c.id=any(rp.completed_chapters)) then
 rp.completed_chapters=array_append(rp.completed_chapters,c.id);points=app.award(auth.uid(),'chapter_complete',10,'chapter:'||c.id);end if;
 select coalesce(array_agg(id),'{}') into rp.completed_chapters from public.chapters where book_id=bid and status='PUBLISHED' and id=any(rp.completed_chapters);
 select count(*) into cnt from public.chapters where book_id=bid and status='PUBLISHED';
 rp.progress_percent=least(100,round(100.0*cardinality(rp.completed_chapters)/greatest(cnt,1)));rp.completed=rp.progress_percent=100;
 if rp.completed and not rp.book_completion_awarded then points=points+app.award(auth.uid(),'book_complete',100,'book:'||bid);end if;
 update public.reading_progress set chapter_id=c.id,completed_chapters=rp.completed_chapters,progress_percent=rp.progress_percent,completed=rp.completed,
 book_completion_awarded=rp.completed or book_completion_awarded,last_read_at=now(),completed_at=case when rp.completed then coalesce(completed_at,now()) end where id=rp.id;
 insert into public.chapter_progress(user_id,book_id,chapter_id,completed_at) values(auth.uid(),c.book_id,c.id,case when c.id=any(rp.completed_chapters) then now() end)
 on conflict(user_id,chapter_id) do update set last_accessed_at=now(),completed_at=coalesce(chapter_progress.completed_at,excluded.completed_at);
 perform app.check_badges(auth.uid());select * into p from public.profiles where id=auth.uid();
 return jsonb_build_object('progress',rp.progress_percent,'completed_chapter_ids',rp.completed_chapters,'chapter_completed',c.id=any(rp.completed_chapters),'book_completed',rp.completed,'xp_awarded',points,'xp',p.xp,'level',p.level,'badges_earned','[]'::jsonb);
end $$;
