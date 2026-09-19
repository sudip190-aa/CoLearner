DO $check$ BEGIN
IF EXISTS(SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgenabled<>'O') THEN RAISE EXCEPTION 'A user trigger remains disabled'; END IF;
IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'RLS not enabled'; END IF;
IF EXISTS(SELECT 1 FROM pg_constraint WHERE connamespace='public'::regnamespace AND NOT convalidated) THEN RAISE EXCEPTION 'Unvalidated constraint'; END IF;
IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='colearn_seed_import_20260919') THEN RAISE EXCEPTION 'Staging schema was not removed'; END IF;
IF EXISTS(SELECT 1 FROM auth.users WHERE raw_app_meta_data->>'verification_fixture'='true') THEN RAISE EXCEPTION 'Verification account left behind'; END IF;
END $check$;
SELECT 'All user triggers enabled, all public tables RLS-protected, constraints validated, staging removed, fixtures removed' AS result;
