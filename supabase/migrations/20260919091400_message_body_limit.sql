-- Bound the full payload, including whitespace, for direct API callers too.
alter table public.direct_messages drop constraint direct_messages_body_check;
alter table public.direct_messages add constraint direct_messages_body_check
  check(char_length(body) between 1 and 4000 and char_length(btrim(body)) > 0);
revoke all on function app.message_rate_limit() from public,anon,authenticated;
