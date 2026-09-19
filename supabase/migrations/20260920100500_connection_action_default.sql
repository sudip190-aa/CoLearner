-- Older clients omit action for a new connection; retain that API contract.
alter function public.colearn_action(text,jsonb) rename to colearn_action_with_navigation;
revoke all on function public.colearn_action_with_navigation(text,jsonb) from public,anon,authenticated;
create function public.colearn_action(action text,payload jsonb default '{}') returns jsonb
language sql security definer set search_path='' as $$
 select public.colearn_action_with_navigation(action,
  case when action='connection' and not payload ? 'action' then payload||'{"action":"connect"}'::jsonb else payload end);
$$;
revoke all on function public.colearn_action(text,jsonb) from public,anon;
grant execute on function public.colearn_action(text,jsonb) to authenticated;
