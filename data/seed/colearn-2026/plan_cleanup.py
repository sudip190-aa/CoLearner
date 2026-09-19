"""Conservative source-fingerprint cleanup; reads the private pre-import audit."""
import json
import re
from collections import defaultdict
from pathlib import Path

before = json.loads(Path('.dist/data-before.json').read_text(encoding='utf8'))
source = json.loads(Path('.dist/seed-provenance.json').read_text(encoding='utf8'))
tables = before['tables']
auth = {a['id']:a for a in before['auth']}
seed = {a['id'] for a in before['auth'] if a['seed'] and a['unchanged_seed'] and not a['last_sign_in_at']}
# The Django login audit proves demo-user was used. Staff identities are always protected.
protected = {a['id'] for a in before['auth'] if a['id'] not in seed or a['seed'] == 'demo-user' or a['is_staff']}
remove = defaultdict(list)
project_ids = set()
for p in tables['projects']:
    if p['owner_id'] in protected or p['summary'] != 'Demo project for ' + p['title'] + '.' or p['description'] != 'A realistic demo project representing ' + p['title'] + '.':
        continue
    children = {t:[r for r in tables[t] if r['project_id'] == p['id']] for t in ['project_members','tasks','milestones','project_updates','join_requests']}
    if children['join_requests'] or any(m['user_id'] in protected for m in children['project_members']):
        continue
    if any(not re.fullmatch(r'Task \d+ for ' + re.escape(p['title']), r['title']) for r in children['tasks']):
        continue
    if any(r['description'] != 'Demo milestone.' for r in children['milestones']):
        continue
    if any(not re.fullmatch(r'Update \d+ for ' + re.escape(p['title']) + r'\.', r['body']) for r in children['project_updates']):
        continue
    project_ids.add(p['id'])
    remove['projects'].append(p)
    for t, rows in children.items():
        remove[t].extend(rows)

thread_ids = set()
for t in tables['threads']:
    match = next((s for s in source['THREAD_SEEDS'] if s[1] == t['slug'] and s[0] == t['title'] and s[4] == t['body']), None)
    if not match or t['author_id'] in protected:
        continue
    comments = [c for c in tables['comments'] if c['thread_id'] == t['id']]
    views = [v for v in tables['thread_views'] if v['thread_id'] == t['id']]
    votes = [v for v in tables['votes'] if v['thread_id'] == t['id'] or v['comment_id'] in {c['id'] for c in comments}]
    if views or any(c['author_id'] in protected or not re.fullmatch(r'Comment \d+ on ' + re.escape(t['title']) + r'\.', c['body']) for c in comments) or any(v['user_id'] in protected for v in votes):
        continue
    thread_ids.add(t['id'])
    remove['threads'].append(t)
    remove['comments'].extend(comments)
    remove['votes'].extend(votes)
    remove['thread_tags'].extend(r for r in tables['thread_tags'] if r['thread_id'] == t['id'])

remove['reports'] = [r for r in tables['reports'] if r['reason'] == 'Needs a quick profile refresh.' and auth.get(r['reporter_id'], {}).get('seed') == 'admin-user' and r['status'] == 'open']
# All identities remain: Supabase's imported last_sign_in_at cannot prove absence
# of historical use, and the old graph is tied to signed-in accounts. Remove exact
# disposable content only; do not infer that an entire account is disposable.
removed_ids = {t:{r.get('id') for r in rows} for t,rows in remove.items()}
for n in tables['notifications']:
    if n['user_id'] in protected:
        continue
    if (n['target_type'] == 'project' and n['target_id'] in {str(i) for i in project_ids}) or (n['target_type'] == 'thread' and n['target_id'] in {str(i) for i in thread_ids}):
        remove['notifications'].append(n)
plan = {'counts':{t:len(rows) for t,rows in remove.items() if rows}, 'rows':dict(remove),
        'protected_profile_count':len(tables['profiles']),
        'reason':'Exact old seed content only. All existing identities and ambiguous or real interactions retained.'}
Path('.dist/data-cleanup.json').write_text(json.dumps(plan,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in plan.items() if k!='rows'},indent=2))
