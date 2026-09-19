"""Generate rollback-only checks under the actual authenticated SQL role."""
import json
from pathlib import Path

d=json.loads(Path('.dist/data-generated.json').read_text(encoding='utf8'))
owner=d['projects'][0]['owner_id']
pid=d['projects'][0]['id']
members={m['user_id'] for m in d['project_members'] if m['project_id']==pid}
other=next(p['id'] for p in d['profiles'] if p['id'] not in members)
sql=f"""BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','{owner}',true);
SELECT set_config('request.jwt.claims','{{"sub":"{owner}","role":"authenticated"}}',true);
DO $check$ DECLARE n integer; BEGIN
 IF (SELECT count(*) FROM public.profiles WHERE username LIKE '%.demo') < 215 THEN RAISE EXCEPTION 'Profile visibility failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id <> '{owner}') THEN RAISE EXCEPTION 'Notification privacy failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id = '{owner}') THEN RAISE EXCEPTION 'Own notifications missing'; END IF;
 IF EXISTS(SELECT 1 FROM public.connections WHERE from_user_id <> '{owner}' AND to_user_id <> '{owner}') THEN RAISE EXCEPTION 'Connection privacy failed'; END IF;
 UPDATE public.profiles SET bio='unauthorized RLS probe' WHERE id='{other}';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Cross-profile write allowed'; END IF;
 UPDATE public.profiles SET availability='focused_learning' WHERE id='{owner}';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Own profile update denied'; END IF;
 UPDATE public.projects SET summary=summary WHERE id={pid};
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Owner project update denied'; END IF;
END $check$;
ROLLBACK;
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','{other}',true);
SELECT set_config('request.jwt.claims','{{"sub":"{other}","role":"authenticated"}}',true);
DO $check$ DECLARE n integer; BEGIN
 UPDATE public.projects SET summary='unauthorized RLS probe' WHERE id={pid};
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Non-owner project write allowed'; END IF;
END $check$;
ROLLBACK;
SELECT 'RLS passed; all probe writes rolled back' AS result;
"""
Path('.dist/data-rls-check.sql').write_text(sql,encoding='utf8')
print('Prepared rollback-only authenticated RLS checks.')
