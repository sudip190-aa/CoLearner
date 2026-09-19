-- Validate direct REST writes as well as form submissions.
alter table public.profiles add constraint profile_links_http check (
 (github='' or github ~* '^https?://[^[:space:]]+$') and
 (linkedin='' or linkedin ~* '^https?://[^[:space:]]+$') and
 (website='' or website ~* '^https?://[^[:space:]]+$'));
alter table public.profiles add constraint interests_strings check(jsonb_typeof(interests)='array' and not jsonb_path_exists(interests,'$[*] ? (@.type() != "string")'));
alter table public.books add constraint tags_strings check(jsonb_typeof(tags)='array' and not jsonb_path_exists(tags,'$[*] ? (@.type() != "string")'));
alter table public.projects add constraint tech_strings check(jsonb_typeof(tech_stack)='array' and not jsonb_path_exists(tech_stack,'$[*] ? (@.type() != "string")'));
alter table public.projects add constraint roles_strings check(jsonb_typeof(looking_for_roles)='array' and not jsonb_path_exists(looking_for_roles,'$[*] ? (@.type() != "string")'));
