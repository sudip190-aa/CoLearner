"""Validate the generated data independently before touching the linked database."""
import json
import math
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

B = json.loads(Path('.dist/data-before.json').read_text(encoding='utf8'))
D = json.loads(Path('.dist/data-generated.json').read_text(encoding='utf8'))
END = datetime.fromisoformat(json.loads((Path(__file__).parent/'manifest.json').read_text())['as_of'])
all_rows = {t:B['tables'][t]+D.get(t,[]) for t in B['tables']}
checks = []
def check(value, label):
    assert value, label
    checks.append(label)

for table, rows in D.items():
    for row in rows:
        for col in B['catalog']['columns']:
            if col['table_name'] == table and col['is_nullable'] == 'NO' and col['column_name'] in row:
                check(row[col['column_name']] is not None, f'{table}.{col["column_name"]} required')
        for k in ['created_at','updated_at','earned_at','joined_at','last_read_at']:
            if row.get(k):
                check(datetime.fromisoformat(row[k]) <= END, f'{table}.{k} not future')
        if row.get('updated_at') and row.get('created_at'):
            check(row['updated_at'] >= row['created_at'], f'{table} timestamp order')
    if rows and 'id' in rows[0]:
        check(len({r['id'] for r in all_rows[table]}) == len(all_rows[table]), f'{table} unique IDs')

for c in B['catalog']['constraints']:
    if c['type'] != 'f' or c['table'] not in D:
        continue
    m = re.match(r'FOREIGN KEY \((\w+)\) REFERENCES (?:public\.)?(\w+)\((\w+)\)', c['definition'])
    if not m:
        continue # auth.users is provisioned through Auth Admin separately.
    column, target, key = m.groups()
    valid = {r[key] for r in all_rows[target]}
    check(all(r.get(column) is None or r[column] in valid for r in D[c['table']]), c['name'])

profiles = {p['id']:p for p in D['profiles']}
xp = Counter()
xpkeys = set()
daily = Counter()
for e in D['xp_events']:
    xp[e['user_id']] += e['amount']
    key = (e['user_id'],e['reason'],e['source'])
    check(key not in xpkeys, 'unique XP source')
    xpkeys.add(key)
    check(e['created_at'] >= profiles[e['user_id']]['created_at'], 'XP after signup')
    daily[(e['user_id'],e['reason'],e['created_at'][:10])] += 1
caps = {'project_create':3,'project_join':5,'task_complete':10,'milestone_complete':3,'thread_create':5}
check(all(count <= caps.get(reason,9999) for (_,reason,_),count in daily.items()), 'live XP daily caps')
check(all(p['xp']==xp[p['id']] and p['level']==math.floor(math.sqrt(p['xp']/50))+1 for p in profiles.values()), 'ledger equals profile XP and level')
check(all('Fictional demo profile.' in p['bio'] and not p['is_staff'] and not p['is_superuser'] for p in profiles.values()), 'fictional disclosure and no privileges')
check(len({p['username'].lower() for p in all_rows['profiles']}) == len(all_rows['profiles']), 'case-insensitive username uniqueness')
teams = defaultdict(set)
for m in D['project_members']:
    teams[m['project_id']].add(m['user_id'])
check(all(p['owner_id'] in teams[p['id']] and len(teams[p['id']]) <= p['max_members'] for p in D['projects']), 'owners, membership and capacity')
check(all(t['assignee_id'] in teams[t['project_id']] for t in D['tasks']), 'task assignees are members')
comments = {c['id']:c for c in D['comments']}
check(all(not c['parent_id'] or (comments[c['parent_id']]['thread_id']==c['thread_id'] and not comments[c['parent_id']]['parent_id']) for c in comments.values()), 'comment parent scope and depth')
check(all(v['user_id'] != (comments[v['comment_id']]['author_id'] if v['comment_id'] else next(t['author_id'] for t in D['threads'] if t['id']==v['thread_id'])) for v in D['votes']), 'no self voting')
views = Counter(v['thread_id'] for v in D['thread_views'])
check(all(t['views']==views[t['id']] for t in D['threads']), 'view counters backed by unique visits')
check(len({(v['thread_id'],v['user_id'],v['viewed_on']) for v in D['thread_views']})==len(D['thread_views']), 'view uniqueness')
check(len({tuple(sorted([c['from_user_id'],c['to_user_id']])) for c in D['connections']})==len(D['connections']), 'unordered connection uniqueness')
check(all(n['user_id'] in profiles and (n['actor_id'] is None or n['actor_id'] in profiles) for n in D['notifications']), 'notifications confined to fictional accounts')
check('books' not in D and 'chapters' not in D, 'library untouched')
for p in D['reading_progress']:
    chapters={c['id'] for c in B['tables']['chapters'] if c['book_id']==p['book_id']}
    check(set(p['completed_chapters']) <= chapters and p['chapter_id'] in chapters, 'progress references correct book chapters')
    check(p['completed']==(set(p['completed_chapters'])==chapters), 'reading completion consistency')
summary = {'checks':len(checks), 'groups':sorted(set(checks)), 'status':'passed'}
Path('.dist/data-local-validation.json').write_text(json.dumps(summary,indent=2))
print(f'Passed {len(checks)} data assertions across {len(set(checks))} check groups.')
