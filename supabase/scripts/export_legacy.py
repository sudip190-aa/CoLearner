"""Read-only SQLite snapshot. Output contains personal data: keep it outside Git."""
import json
import sqlite3
import sys
from pathlib import Path

source = Path(sys.argv[1] if len(sys.argv) > 1 else 'backend/db.sqlite3').resolve()
destination = Path(sys.argv[2] if len(sys.argv) > 2 else '.dist/legacy-data.json')
db = sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)
db.row_factory = sqlite3.Row
tables = [r[0] for r in db.execute("select name from sqlite_master where type='table'")]
snapshot = {}
for table in tables:
    if not table.startswith(('users_', 'books_', 'projects_', 'community_', 'gamification_', 'notifications_', 'core_', 'django_content_type')):
        continue
    columns = {r[1]: r[2].lower() for r in db.execute(f'pragma table_info("{table}")')}
    records = []
    for record in db.execute(f'select * from "{table}"'):
        item = dict(record)
        for key, value in item.items():
            if value is None:
                continue
            if columns[key] == 'bool':
                item[key] = bool(value)
            elif key in ('interests', 'tags', 'tech_stack', 'looking_for_roles', 'completed_chapters'):
                item[key] = json.loads(value)
        records.append(item)
    snapshot[table] = records
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(snapshot), encoding='utf-8')
print(f'Exported {len(snapshot)} source tables to ignored migration staging directory.')
