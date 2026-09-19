create function public.colearn_project_feed(filters jsonb default '{}') returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare output jsonb;
begin
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 with visible as (
  select p.*,coalesce(m.total,0) as member_count,greatest(0,p.max_members-coalesce(m.total,0)) as spots_left,
   coalesce(m.members,'[]') as members,
   jsonb_build_object('id',owner.id,'username',owner.username,'full_name',owner.full_name,'avatar',owner.avatar) as owner,
   jsonb_build_object('is_owner',p.owner_id=auth.uid(),'is_member',exists(select 1 from public.project_members where project_id=p.id and user_id=auth.uid()),'role',(select role from public.project_members where project_id=p.id and user_id=auth.uid()),'join_request',(select to_jsonb(r) from public.join_requests r where r.project_id=p.id and r.user_id=auth.uid())) as viewer
  from public.projects p join public.profiles owner on owner.id=p.owner_id
  left join lateral(select count(*) as total,jsonb_agg(jsonb_build_object('id',u.id,'username',u.username,'full_name',u.full_name,'avatar',u.avatar,'role',pm.role)) as members from public.project_members pm join public.profiles u on u.id=pm.user_id where pm.project_id=p.id) m on true
 ), filtered as (
  select * from visible p where
   (coalesce(filters->>'category','')='' or p.category=filters->>'category')
   and (coalesce(filters->>'status','')='' or p.status=filters->>'status')
   and (coalesce(filters->>'search','')='' or p.title ilike '%'||(filters->>'search')||'%' or p.summary ilike '%'||(filters->>'search')||'%' or p.description ilike '%'||(filters->>'search')||'%')
   and (coalesce(filters->>'mine','false')<>'true' or (p.viewer->>'is_member')::boolean or p.owner_id=auth.uid())
   and (coalesce(filters->>'looking','false')<>'true' or (p.spots_left>0 and p.status in('idea','active')))
   and (not(filters ? 'tech') or p.tech_stack @> filters->'tech')
 ), selected as (
  select p.* from filtered p order by
   case when filters->>'ordering'='fewest' then spots_left end asc nulls last,
   case when filters->>'ordering'='updated' then updated_at end desc nulls last,created_at desc,id desc
  limit least(100,greatest(1,coalesce((filters->>'page_size')::int,50)))
  offset (greatest(1,coalesce((filters->>'page')::int,1))-1)*least(100,greatest(1,coalesce((filters->>'page_size')::int,50)))
 ) select jsonb_build_object('count',(select count(*) from filtered),'results',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('task_progress',jsonb_build_object('total',coalesce(c.total,0),'done',coalesce(c.done,0),'percent',coalesce(c.percent,0)))) from selected s left join public.colearn_project_stats() c on c.project_id=s.id),'[]'),
 'facets',jsonb_build_object('categories',coalesce((select jsonb_agg(category order by category) from(select distinct category from visible where category<>'') f),'[]'),'tech',coalesce((select jsonb_agg(tech order by tech) from(select distinct jsonb_array_elements_text(tech_stack) tech from visible) f),'[]'))) into output;
 return output;
end $$;
revoke all on function public.colearn_project_feed(jsonb) from public,anon;
grant execute on function public.colearn_project_feed(jsonb) to authenticated;
