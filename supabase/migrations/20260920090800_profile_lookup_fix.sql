-- The book-visibility migration renamed this helper. Its old function-qualified
-- parameter reference no longer resolves after a fresh PostgreSQL compilation.
-- Use the positional argument so the lookup is independent of the function name.
-- Keep the public wrapper and its approved-book filtering unchanged.
create or replace function public.colearn_portfolio_before_books(username text) returns jsonb language plpgsql stable security definer set search_path='' as $$ declare p public.profiles;begin
 select * into p from public.profiles where lower(profiles.username)=lower($1) and is_active;
 if p.id is null then raise exception 'Profile not found';end if;
 return jsonb_build_object('profile',to_jsonb(p),
 'skills',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('level',us.level,'is_verified',us.is_verified)) from public.user_skills us join public.skills s on s.id=us.skill_id where us.user_id=p.id),'[]'),
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'slug',pr.slug,'title',pr.title,'summary',pr.summary,'category',pr.category,'status',pr.status,'tech_stack',pr.tech_stack,'role',m.role)) from public.projects pr join public.project_members m on m.project_id=pr.id where m.user_id=p.id and pr.is_public),'[]'),
 'badges',coalesce((select jsonb_agg(to_jsonb(b)||jsonb_build_object('earned_at',ub.earned_at)) from public.user_badges ub join public.badges b on b.id=ub.badge_id where ub.user_id=p.id),'[]'),
 'books',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'slug',b.slug,'title',b.title,'author',b.author,'category',b.category,'cover',b.cover,'completed_at',r.updated_at)) from public.reading_progress r join public.books b on b.id=r.book_id where r.user_id=p.id and r.completed),'[]'),
 'heatmap',coalesce((select jsonb_agg(x) from (select d::date week_start,(select count(*) from public.xp_events e where e.user_id=p.id and e.created_at>=d and e.created_at<d+interval '7 days') activity from generate_series(date_trunc('week',now())-interval '77 days',date_trunc('week',now()),interval '7 days') d) x),'[]'),
 'stats',jsonb_build_object('xp',p.xp,'level',p.level,'streak_days',p.streak_days,'projects_count',(select count(*) from public.project_members m join public.projects pr on pr.id=m.project_id where m.user_id=p.id and pr.is_public),'books_completed',(select count(*) from public.reading_progress where user_id=p.id and completed),'badges_count',(select count(*) from public.user_badges where user_id=p.id)));
 end $$;

revoke all on function public.colearn_portfolio_before_books(text) from public, anon, authenticated;
