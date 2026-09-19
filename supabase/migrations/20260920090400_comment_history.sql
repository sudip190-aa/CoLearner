-- Bounded comment/reply pages, including a targeted page for notification links.
create function public.colearn_comment_page(discussion bigint,before_id bigint default null,parent bigint default null,focus bigint default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare chosen bigint[]; root bigint; output jsonb;
begin
 if not app.active() then raise exception 'Authentication required' using errcode='42501';end if;
 if focus is not null then select coalesce(parent_id,id) into root from public.comments where id=focus and thread_id=discussion;end if;
 select array_agg(id) into chosen from (
  select id from public.comments where thread_id=discussion and parent_id is not distinct from parent and (before_id is null or id<before_id)
  order by id desc limit 20
 ) page;
 if root is not null and parent is null and not root=any(coalesce(chosen,'{}')) then chosen=array_append(coalesce(chosen,'{}'),root);end if;
 with selected as (
  select c.* from public.comments c where c.id=any(chosen)
  union
  select r.* from unnest(chosen) roots(id) cross join lateral (
   select c.* from public.comments c where c.thread_id=discussion and c.parent_id=roots.id order by c.id desc limit 20
  ) r where parent is null
  union select c.* from public.comments c where c.id=focus and c.thread_id=discussion
 ), detailed as (
  select c.*,jsonb_build_object('id',p.id,'username',p.username,'full_name',p.full_name,'avatar',p.avatar) as author,
   coalesce((select sum(v.value) from public.votes v where v.comment_id=c.id),0) as vote_score,
   coalesce((select v.value from public.votes v where v.comment_id=c.id and v.user_id=auth.uid()),0) as user_vote,
   coalesce((select jsonb_agg(jsonb_build_object('user',jsonb_build_object('username',mp.username))) from public.comment_mentions m join public.profiles mp on mp.id=m.user_id where m.comment_id=c.id),'[]') as mentions,
   (select count(*) from public.comments child where child.parent_id=c.id) as reply_count
  from selected c join public.profiles p on p.id=c.author_id
 ) select jsonb_build_object('results',coalesce((select jsonb_agg(to_jsonb(d) order by d.id desc) from detailed d),'[]'),
   'next_cursor',case when cardinality(chosen)>=20 then (select min(id) from unnest(chosen) id where id is distinct from root or cardinality(chosen)=20) end,
   'count',(select count(*) from public.comments where thread_id=discussion)) into output;
 return output;
end $$;
revoke all on function public.colearn_comment_page(bigint,bigint,bigint,bigint) from public,anon;
grant execute on function public.colearn_comment_page(bigint,bigint,bigint,bigint) to authenticated;
