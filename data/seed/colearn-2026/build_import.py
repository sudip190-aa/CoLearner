"""Compile the actual CSVs into a guarded, atomic cloud import, not a schema migration.

The generated SQL includes the private baseline, so it is written only to .dist.
It refuses any concurrent baseline change, keeps FK/check constraints enabled,
and restores historical content without firing fresh activity reward triggers.
"""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
B = json.loads(Path('.dist/data-before.json').read_text(encoding='utf8'))
C = json.loads(Path('.dist/data-cleanup.json').read_text(encoding='utf8'))
M = json.loads((ROOT/'manifest.json').read_text(encoding='utf8'))
D = {}
for name, digest in M['sha256'].items():
    path = ROOT/name
    assert hashlib.sha256(path.read_bytes()).hexdigest()==digest, name
    table = path.stem
    types = {c['column_name']:c['data_type'] for c in B['catalog']['columns'] if c['table_name']==table}
    with path.open(encoding='utf8',newline='') as f:
        reader=csv.DictReader(f)
        assert set(reader.fieldnames)<=set(types), name
        rows=[]
        for row in reader:
            for k,v in row.items():
                typ=types[k]
                row[k] = None if v=='\\N' else (v=='true') if typ=='boolean' else int(v) if typ in ['bigint','integer','smallint'] else json.loads(v) if typ=='jsonb' else ([int(x) for x in v[1:-1].split(',') if x] if typ=='ARRAY' else v)
            rows.append(row)
        D[table]=rows
    assert len(rows)==M['counts'][table]

def literal(value):
    return "'"+str(value).replace("'","''")+"'"

def recordset(table,rows):
    kind='baseline' if rows is B['tables'][table] else 'dataset'
    return f"jsonb_populate_recordset(null::public.\"{table}\", (SELECT coalesce(jsonb_agg(item),'[]'::jsonb) FROM colearn_seed_import_20260919.payload b CROSS JOIN LATERAL jsonb_array_elements(b.records) item WHERE b.kind='{kind}' AND b.table_name='{table}'))"

# The cloud query endpoint has a request-size limit. A private, short-lived
# staging schema holds small uploads; the final guarded transaction drops it.
stage_files=[]
for kind,tables in [('baseline',B['tables']),('dataset',D)]:
    for table,rows in tables.items():
        batches=[]
        batch=[]
        size=0
        for row in rows:
            row_size=len(json.dumps(row,ensure_ascii=False).encode('utf8'))
            if size+row_size>150000 and batch:
                batches.append(batch)
                batch=[]
                size=0
            batch.append(row)
            size+=row_size
        if batch:
            batches.append(batch)
        for i,batch in enumerate(batches):
            path=Path(f'.dist/data-stage-{kind}-{table}-{i}.sql')
            statement=f"INSERT INTO colearn_seed_import_20260919.payload(kind,table_name,batch,records) VALUES ('{kind}','{table}',{i},{literal(json.dumps(batch,ensure_ascii=False,separators=(',',':')))}::jsonb) ON CONFLICT(kind,table_name,batch) DO UPDATE SET records=excluded.records;"
            path.write_text(statement,encoding='utf8')
            stage_files.append(str(path).replace('\\','/'))
Path('.dist/data-stage-files.json').write_text(json.dumps(stage_files),encoding='utf8')
Path('.dist/data-stage-init.sql').write_text("""BEGIN;
CREATE SCHEMA IF NOT EXISTS colearn_seed_import_20260919;
REVOKE ALL ON SCHEMA colearn_seed_import_20260919 FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS colearn_seed_import_20260919.payload(kind text NOT NULL,table_name text NOT NULL,batch integer NOT NULL,records jsonb NOT NULL,PRIMARY KEY(kind,table_name,batch));
REVOKE ALL ON colearn_seed_import_20260919.payload FROM PUBLIC, anon, authenticated;
ALTER TABLE colearn_seed_import_20260919.payload ENABLE ROW LEVEL SECURITY;
COMMIT;
""",encoding='utf8')

uidlist=','.join(literal(p['id']) for p in D['profiles'])
sql=['BEGIN;', "SET LOCAL lock_timeout='15s';", "SET LOCAL statement_timeout='180s';"]
sql += [f'LOCK TABLE public."{t}" IN SHARE ROW EXCLUSIVE MODE;' for t in sorted(B['tables'])]
# Compare every existing row and reject unexpected new rows, except the known new
# Auth bootstrap profiles and their own automatically generated reward records.
for table,rows in B['tables'].items():
    exclude = f' WHERE id NOT IN ({uidlist})' if table=='profiles' else f' WHERE user_id NOT IN ({uidlist})' if table in ['xp_events','notifications'] else ''
    sql.append(f"DO $guard$ BEGIN IF EXISTS ((SELECT to_jsonb(x) FROM public.\"{table}\" x{exclude} EXCEPT SELECT to_jsonb(x) FROM {recordset(table,rows)} x) UNION ALL (SELECT to_jsonb(x) FROM {recordset(table,rows)} x EXCEPT SELECT to_jsonb(x) FROM public.\"{table}\" x{exclude})) THEN RAISE EXCEPTION 'Baseline changed in {table}; aborting without deleting anything'; END IF; END $guard$;")

affected=sorted(set(D)|{t for t,rows in C['rows'].items() if rows})
sql += [f'ALTER TABLE public."{t}" DISABLE TRIGGER USER;' for t in affected]
delete_order=['reports','notifications','votes','thread_views','thread_tags','comments','threads','join_requests','project_updates','tasks','milestones','project_members','projects']
for table in delete_order:
    rows=C['rows'].get(table,[])
    if not rows:
        continue
    if table=='thread_tags':
        pairs=','.join(f"({r['thread_id']},{r['tag_id']})" for r in rows)
        sql.append(f'DELETE FROM public.thread_tags WHERE (thread_id,tag_id) IN ({pairs});')
    else:
        ids=','.join(str(r['id']) for r in rows)
        sql.append(f'DELETE FROM public."{table}" WHERE id IN ({ids});')

sql += [f'DELETE FROM public.xp_events WHERE user_id IN ({uidlist});', f'DELETE FROM public.notifications WHERE user_id IN ({uidlist});']
order=['skills','profiles','user_skills','tags','projects','project_members','tasks','milestones','project_updates','join_requests','threads','thread_tags','comments','votes','thread_views','connections','reading_progress','xp_events','user_badges','notifications']
for table in order:
    rows=D.get(table,[])
    if not rows:
        continue
    columns=list(rows[0])
    names=','.join('"'+c+'"' for c in columns)
    if table=='profiles':
        assign=','.join(f'"{c}"=s."{c}"' for c in columns if c!='id')
        sql.append(f'UPDATE public.profiles p SET {assign} FROM {recordset(table,rows)} s WHERE p.id=s.id;')
    else:
        sql.append(f'INSERT INTO public."{table}" ({names}) SELECT {names} FROM {recordset(table,rows)};')
    # Compare to exactly the CSV values within the same transaction.
    keys=['thread_id','tag_id'] if table=='thread_tags' else ['thread_id','user_id','viewed_on'] if table=='thread_views' else ['id']
    match=' AND '.join(f't."{k}"=s."{k}"' for k in keys)
    comparison=' OR '.join(f't."{c}" IS DISTINCT FROM s."{c}"' for c in columns)
    sql.append(f"DO $check$ BEGIN IF EXISTS (SELECT 1 FROM {recordset(table,rows)} s LEFT JOIN public.\"{table}\" t ON {match} WHERE t.\"{keys[0]}\" IS NULL OR {comparison}) THEN RAISE EXCEPTION 'CSV verification failed for {table}'; END IF; END $check$;")
    if 'id' in columns and table!='profiles':
        sql.append(f"SELECT setval(pg_get_serial_sequence('public.{table}','id'), greatest((SELECT coalesce(max(id),1) FROM public.\"{table}\"), (SELECT last_value FROM public.{table}_id_seq)), true);")

sql.append(f"DO $check$ BEGIN IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id IN ({uidlist}) AND (p.xp <> (SELECT coalesce(sum(amount),0) FROM public.xp_events e WHERE e.user_id=p.id) OR p.level <> floor(sqrt(p.xp/50.0))+1)) THEN RAISE EXCEPTION 'XP ledger mismatch'; END IF; END $check$;")
sql += [f'ALTER TABLE public."{t}" ENABLE TRIGGER USER;' for t in affected]
sql += ['DROP TABLE colearn_seed_import_20260919.payload;', 'DROP SCHEMA colearn_seed_import_20260919;', 'COMMIT;']
Path('.dist/data-import.sql').write_text('\n'.join(sql)+'\n',encoding='utf8')
print('Prepared guarded import from',len(D),'CSV files;',sum(len(rows) for rows in D.values()),'rows.')
print('SQL bytes:',Path('.dist/data-import.sql').stat().st_size)
