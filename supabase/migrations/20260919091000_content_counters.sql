-- Expose aggregate card statistics without exposing another user's progress or private tasks.
create function public.colearn_book_stats() returns table(book_id bigint,readers_count bigint) language sql stable security definer set search_path='' as $$
 select b.id,count(r.id) from public.books b left join public.reading_progress r on r.book_id=b.id where app.active() group by b.id $$;
create function public.colearn_project_stats() returns table(project_id bigint,total bigint,done bigint,percent integer) language sql stable security definer set search_path='' as $$
 select p.id,count(t.id),count(t.id) filter(where t.status='done'),case when count(t.id)=0 then 0 else round(100.0*count(t.id) filter(where t.status='done')/count(t.id))::integer end
 from public.projects p left join public.tasks t on t.project_id=p.id where app.visible(p.id) group by p.id $$;
revoke all on function public.colearn_book_stats(),public.colearn_project_stats() from public,anon;
grant execute on function public.colearn_book_stats(),public.colearn_project_stats() to authenticated;
