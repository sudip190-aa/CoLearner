create function public.colearn_thread_feed(filters jsonb default '{}') returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare output jsonb;
begin
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 with filtered as (
  select t.*,coalesce(v.score,0) as vote_score,coalesce(v.own_vote,0) as user_vote,c.total as comment_count,
   jsonb_build_object('id',p.id,'username',p.username,'full_name',p.full_name,'avatar',p.avatar) as author,
   coalesce((select jsonb_agg(g.slug) from public.thread_tags tt join public.tags g on g.id=tt.tag_id where tt.thread_id=t.id),'[]') as tags
  from public.threads t join public.profiles p on p.id=t.author_id
  cross join lateral(select count(*) as total from public.comments where thread_id=t.id) c
  cross join lateral(select sum(value) as score,max(value) filter(where user_id=auth.uid()) as own_vote from public.votes where thread_id=t.id) v
  where (coalesce(filters->>'category','')='' or t.category=filters->>'category')
   and (coalesce(filters->>'search','')='' or t.title ilike '%'||(filters->>'search')||'%' or t.body ilike '%'||(filters->>'search')||'%')
   and (coalesce(filters->>'mine','false')<>'true' or t.author_id=auth.uid())
   and (coalesce(filters->>'answered','false')<>'true' or c.total>0)
   and (coalesce(filters->>'ordering','')<>'unanswered' or c.total=0)
   and (coalesce(filters->>'tag','')='' or exists(select 1 from public.thread_tags tt join public.tags g on g.id=tt.tag_id where tt.thread_id=t.id and g.slug=filters->>'tag'))
 ), limited as (
  select * from filtered order by is_pinned desc,
   case when filters->>'ordering'='top' then vote_score end desc nulls last,created_at desc,id desc
  limit least(50,greatest(1,coalesce((filters->>'page_size')::int,12)))
  offset (greatest(1,coalesce((filters->>'page')::int,1))-1)*least(50,greatest(1,coalesce((filters->>'page_size')::int,12)))
 ) select jsonb_build_object('count',(select count(*) from filtered),'results',coalesce((select jsonb_agg(to_jsonb(l)||jsonb_build_object('body',left(l.body,320))) from limited l),'[]')) into output;
 return output;
end $$;
revoke all on function public.colearn_thread_feed(jsonb) from public,anon;
grant execute on function public.colearn_thread_feed(jsonb) to authenticated;
