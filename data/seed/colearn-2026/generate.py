"""Deterministic, schema-derived CSV export. Run from the repository root.

Input: the private read-only audit at .dist/data-before.json. No credentials,
real account details or private content are exported into this directory.
"""
import csv
import hashlib
import json
import math
import random
import re
import unicodedata
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from curated import COUNTRIES, TRACKS, PROJECTS, DISCUSSIONS

ROOT = Path(__file__).resolve().parent
BEFORE = json.loads(Path('.dist/data-before.json').read_text(encoding='utf8'))
OLD = BEFORE['tables']
END = datetime(2026, 9, 19, 10, 30, tzinfo=timezone.utc)
START = END - timedelta(days=120)
R = random.Random(691926)
NS = uuid.UUID('2c922c75-d7e3-43cb-b25b-497a44fc98f3')
DATA = defaultdict(list)
IDS = {t: max([r.get('id', 0) for r in rows if isinstance(r.get('id'), int)] or [0]) + 100 for t, rows in OLD.items()}
FACTS = []
PEOPLE = []

def stamp(d):
    return d.isoformat()

def slug(s):
    return re.sub('[^a-z0-9]+', '-', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()).strip('-')

def add(table, **row):
    columns = {c['column_name'] for c in BEFORE['catalog']['columns'] if c['table_name'] == table}
    assert set(row) <= columns, (table, set(row) - columns)
    if 'id' in columns and 'id' not in row:
        IDS[table] += 1
        row['id'] = IDS[table]
    DATA[table].append(row)
    return row

def fact(user, when, criteria=None, amount=0, reason=None, source=None):
    FACTS.append((when, user, criteria, amount, reason, str(source) if source is not None else None))

def notify(user, actor, verb, target_type, target_id, target_label, target_slug, when):
    if user == actor:
        return
    add('notifications', user_id=user, actor_id=actor, verb=verb, target_type=target_type,
        target_id=str(target_id), target_label=target_label, target_slug=target_slug,
        is_read=when < END - timedelta(days=3) or R.random() < .35, created_at=stamp(when))

skillmap = {s['name'].casefold(): s['id'] for s in OLD['skills']}
for course, skills, goal, interest, role in TRACKS:
    for skill in skills:
        if skill.casefold() not in skillmap:
            row = add('skills', slug=slug(skill), name=skill, category=course, created_at=stamp(START), updated_at=stamp(START))
            skillmap[skill.casefold()] = row['id']

HOBBIES = ['weekend walks', 'short films', 'board games', 'cooking', 'street photography', 'badminton', 'student radio', 'sketching', 'cycling', 'community gardens', 'music', 'language exchange']
for ci, line in enumerate(COUNTRIES.splitlines()):
    country, cities, names = line.split('|')
    for ni, name in enumerate(names.split(';')):
        i = len(PEOPLE)
        track = (ci * 7 + ni * 4) % len(TRACKS)
        course, skills, goal, interest, contribution = TRACKS[track]
        year = R.choices([1, 2, 3, 4], [20, 32, 31, 17])[0]
        joined = START + timedelta(days=R.randrange(0, 26), hours=R.randrange(8, 21))
        uid = str(uuid.uuid5(NS, name + '|' + country))
        city = cities.split(';')[ni % len(cities.split(';'))]
        hobby = HOBBIES[(i * 5 + ni) % len(HOBBIES)]
        bios = [
            f'Year {year}, {course.lower()}. I want to get better at {goal}. Happy to help with a small {interest.lower()} project; still balancing it with classes. Outside coursework: {hobby}.',
            f'Studying {course.lower()} in {city} (year {year}). Currently practising {goal}. I like projects with a clear, small first version. Usually around for {hobby} on weekends.',
            f'{course}, year {year}. Looking for people to work through {goal} with. My next project should involve {interest.lower()}. Also into {hobby}.',
            f'Most of my work so far is coursework in {course.lower()}. This year ({year}) I am spending more time on {goal}. Can contribute as a {contribution.lower()}. {hobby.capitalize()} keeps me away from the laptop.',
            f'Learning by making small things. Year {year} of {course.lower()}, with an interest in {interest.lower()}. Next up: {goal}. I can usually find a few hours between classes and {hobby}.',
            f'Based in {city}; {course.lower()}, year {year}. I enjoy the research and debugging parts of group work. Working on {goal} at the moment. Looking for a manageable project, not another full-time commitment.',
            f'I am in year {year} of {course.lower()}. Interested in {interest.lower()} and {hobby}. Would like to practise {goal} with a team that is comfortable asking basic questions.',
        ]
        role = 'mentor' if year == 4 and i % 4 == 0 else ('builder' if i % 3 else 'learner')
        p = add('profiles', id=uid, legacy_id=None, username=slug(name).replace('-', '.') + '.demo',
                full_name=name, avatar='', bio=bios[i % len(bios)] + ' Fictional demo profile.',
                headline=[f'{course} · Year {year}', f'{contribution} in training', f'Learning {skills[0]} through small projects', f'{course} student · {interest}'][i % 4],
                role=role, location=f'{city}, {country}', github='', linkedin='', website='',
                availability='mentoring' if role == 'mentor' else R.choices(['open_to_collaboration', 'focused_learning', ''], [64, 28, 8])[0],
                interests=[interest, hobby, goal], xp=0, level=1, streak_days=0, last_active=None,
                is_verified=False, onboarding_completed=True, is_active=True, is_staff=False, is_superuser=False,
                created_at=stamp(joined), updated_at=stamp(END))
        PEOPLE.append({'profile': p, 'track': track, 'joined': joined, 'country': country, 'index': i})
        chosen = skills[:R.randint(2, len(skills))]
        if i % 4 == 0:
            chosen = list(dict.fromkeys(chosen + TRACKS[(track + 1) % 15][1][:1]))
        for k, skill in enumerate(chosen):
            add('user_skills', user_id=uid, skill_id=skillmap[skill.casefold()],
                level='beginner' if year == 1 or k > 1 else ('advanced' if year == 4 and k == 0 else 'intermediate'), is_verified=False)
        fact(uid, joined, amount=10, reason='signup', source='signup')
        fact(uid, joined + timedelta(hours=1), amount=50, reason='profile_complete', source='onboarding')
        intensity = R.choices([.08, .22, .48, .82], [24, 44, 25, 7])[0]
        login_days = {day for day in range((END - joined).days + 1) if R.random() < intensity}
        # A small active group has genuine consecutive login records, not a random streak field.
        if i % 27 == 0:
            login_days.update(range((END - joined).days - 32, (END - joined).days + 1))
        for day in sorted(login_days):
            when = (joined + timedelta(days=day)).replace(hour=7, minute=10 + i % 37)
            if joined <= when < END:
                fact(uid, when, 'login', 5, 'daily_login', when.date())

def candidates(track):
    return [p for p in PEOPLE if p['track'] == track]

project_teams = {}
for i, line in enumerate(PROJECTS.splitlines()):
    title, category, track, problem, boundary, concrete = line.split('|')
    track = int(track)
    pool = candidates(track)
    owner = pool[(i // 3) % len(pool)]
    size = R.choices([1, 2, 3, 4, 5, 6], [15, 22, 25, 20, 12, 6])[0]
    team = [owner]
    for j in range(size - 1):
        compatible = [p for p in PEOPLE if p not in team and p['track'] in {track, (track + 1) % 15, 0, 1, 2, 4}]
        team.append(R.choice(compatible))
    status = R.choices(['idea', 'active', 'completed', 'archived'], [18, 49, 23, 10])[0]
    created = END - timedelta(days=R.randint(18, 84), hours=R.randint(1, 20))
    finished = min(created + timedelta(days=R.randint(12, 30)), END - timedelta(days=1))
    scope = ['Beginner: a small working flow before adding extra features.', 'Intermediate: a tested prototype with a few cooperating parts.', 'Advanced: concurrency, offline behaviour, or data quality needs careful testing.'][i % 3]
    state_note = {'idea':'We are still checking the scope before building.', 'active':'The first flow is being built and tested around coursework.', 'completed':'The scoped prototype is complete; the handover notes explain its limits.', 'archived':'Paused while the team is on placements. The current work is saved for a later handover.'}[status]
    stack = list(dict.fromkeys(TRACKS[track][1][:3] + (['React', 'PostgreSQL'] if track in [0, 1, 6, 9] else [])))
    project = add('projects', slug=slug(title), owner_id=owner['profile']['id'], title=title, summary=problem,
        description=f'{problem}\n\nScope\n{boundary}\n\n{scope}\n\n{state_note}\n\nTeam contributions\n' + '\n'.join(f"{p['profile']['full_name']}: {TRACKS[p['track']][4].lower()}" for p in team) + '\n\nFictional student project for the CoLearn demo.',
        category=category, tech_stack=stack, looking_for_roles=[] if status in ['completed', 'archived'] else [TRACKS[(track + 1) % 15][4]],
        cover='', status=status, max_members=min(8, size + R.randint(1, 3)), is_public=True,
        created_at=stamp(created), updated_at=stamp(finished if status in ['completed', 'archived'] else END - timedelta(days=i % 7 + 1)))
    pid = project['id']
    project_teams[pid] = team
    for j, p in enumerate(team):
        uid = p['profile']['id']
        when = created + timedelta(hours=j * 4)
        add('project_members', project_id=pid, user_id=uid, role='owner' if j == 0 else ('mentor' if p['profile']['role'] == 'mentor' else 'member'), joined_at=stamp(when))
        fact(uid, when, 'first_project', 75 if j == 0 else 40, 'project_create' if j == 0 else 'project_join', f'project:{pid}' if j == 0 else f'project_join:{pid}')
        if status == 'completed':
            fact(uid, finished, 'project_completed')
    task_content = [
        (concrete, boundary),
        (f'Write the first-use checklist for {title}', 'Keep the checklist to one flow and note what data is required before starting.'),
        ('Sketch the empty and error states', f'Show what happens before there is any data, and when the main action fails. {problem}'),
        ('Review the first prototype with a teammate', 'Record confusing steps and choose the two changes that matter most for the next pass.'),
        ('Document the setup and known limits', f'Check a clean setup and include this boundary: {boundary}'),
        ('Check keyboard navigation and small screens', 'Use the primary flow without a mouse, then repeat it at a narrow viewport.'),
        ('Add regression checks for the main flow', f'Cover the behaviour behind this task: {concrete.lower()}.'),
        ('Prepare the project handover notes', 'Include a working example, remaining issues, and who last worked on each part.'),
    ]
    task_count = R.randint(3, 8)
    for j, (task_title, detail) in enumerate(task_content[:task_count]):
        assignee = team[j % len(team)]['profile']['id']
        ts = 'done' if status == 'completed' else ('todo' if status == 'idea' else R.choices(['todo', 'in_progress', 'review', 'done'], [28, 27, 15, 30])[0])
        tc = created + timedelta(days=2, hours=j)
        done = min(tc + timedelta(days=3 + j), finished)
        row = add('tasks', project_id=pid, assignee_id=assignee, title=task_title, description=detail, status=ts,
            priority=R.choices(['low', 'medium', 'high', 'urgent'], [20, 55, 23, 2])[0],
            due_date=(done if ts == 'done' else END + timedelta(days=3 + j + i % 9)).date().isoformat(), order=j,
            xp_awarded=ts == 'done', created_at=stamp(tc), updated_at=stamp(done if ts == 'done' else tc))
        notify(assignee, owner['profile']['id'], 'task_assigned', 'project', pid, title, project['slug'], tc)
        if ts == 'done':
            fact(assignee, done, 'first_task', 15, 'task_complete', f"task:{row['id']}")
            fact(assignee, done, 'ten_tasks')
    for j, label in enumerate(['Agree the smallest useful version', 'Test and hand over the prototype']):
        ms = 'done' if status == 'completed' or (j == 0 and status != 'idea') else ('in_progress' if status == 'active' else 'planned')
        when = finished if j else created + timedelta(days=5)
        m = add('milestones', project_id=pid, title=label, description=boundary if j == 0 else f'Check the main use case: {problem}',
            due_date=(when if ms == 'done' else END + timedelta(days=10 + j * 7)).date().isoformat(), status=ms,
            created_at=stamp(created + timedelta(days=1)), updated_at=stamp(when if ms == 'done' else created + timedelta(days=1)))
        if ms == 'done':
            fact(owner['profile']['id'], when, amount=60, reason='milestone_complete', source=f"milestone:{m['id']}")
            for p in team:
                fact(p['profile']['id'], when, 'first_milestone')
    add('project_updates', project_id=pid, author_id=owner['profile']['id'], body=f'{state_note} Current focus: {concrete.lower()}. {boundary}', created_at=stamp(finished))
    if status == 'active' and size > 1:
        update_time = END - timedelta(days=i % 6 + 1)
        add('project_updates', project_id=pid, author_id=team[1]['profile']['id'], body=f'I have put the notes for {title} in the handover checklist. The next review will focus on the first-use flow and the error states.', created_at=stamp(update_time))
        for p in team:
            notify(p['profile']['id'], team[1]['profile']['id'], 'project_update', 'project', pid, title, project['slug'], update_time)
    if status in ['idea', 'active'] and i % 2 == 0:
        applicant = R.choice([p for p in candidates((track + 1) % 15) if p not in team])
        when = END - timedelta(days=i % 5 + 1)
        request_status = 'invited' if i % 6 == 0 else 'pending'
        add('join_requests', project_id=pid, user_id=applicant['profile']['id'], status=request_status,
            message=f"I can help as a {TRACKS[applicant['track']][4].lower()}. I would like to start with a small review of the first flow.", created_at=stamp(when), updated_at=stamp(when))
        notify(applicant['profile']['id'] if request_status == 'invited' else owner['profile']['id'], owner['profile']['id'] if request_status == 'invited' else applicant['profile']['id'],
            'project_invite' if request_status == 'invited' else 'project_join_request', 'project', pid, title, project['slug'], when)

tagmap = {t['slug']: t['id'] for t in OLD['tags']}
# Replies for one longer thread are a concrete review conversation, not repeated filler.
LONG_REPLIES = [
 'We tried a five-line brief. Problem, who it helps, one flow, what is out of scope, and how we will test it.',
 'The out-of-scope line saved us. Otherwise someone adds a payment system in week two.',
 'Do you write it before talking to users or after?',
 'A rough version before, then change it after the first conversation. It is a hypothesis at that point.',
 'I would keep the success measure separate from the feature list. Finishing the features does not prove they help.',
 'Ours said "students can find an available room". We changed it to finding one in under a minute using the list view.',
 'How many people did you test with?',
 'Only four for the first pass, so we treated it as usability feedback, not evidence about the whole campus.',
 'We also wrote down the devices they used. Two problems only happened on phones.',
 'Agree on testing early, but a stopwatch can make people rush. Ask them to think aloud in a separate pass.',
 'Good point. We will do the first pass without timing it.',
 'Our brief includes who can make a scope decision when teammates disagree. That avoided a few stalled meetings.',
 'We use one person for each decision, but anyone can leave a concern in the notes.',
 'A sketch helped us more than another paragraph. It made the different assumptions visible.',
 'I have cut our brief from three pages to half a page and added the sketch. Much easier to discuss now.',
 'Leave a dated copy when the scope changes. It makes the final reflection easier to write.',
]
thread_specs = DISCUSSIONS.splitlines()
thread_specs.append('How do you hand over a student project before placements?|community|projects,documentation,college|Two of us start placements next month. The prototype works on our laptops but the next team will need to maintain it. What should we leave them?|' + '~'.join([
    'A setup guide that someone outside the team has actually followed.',
    'Include a small sample dataset, with no real account details in it.',
    'We recorded the main flow and the known failures in a short screen recording.',
    'Who owns the deployment account? Sort that out before everyone leaves.',
    'Thanks, that is the bit we had missed. It is still under my personal account.',
    'Move ownership through the service settings. Do not put a shared password in the README.',
    'Leave a list of decisions too, especially the things you deliberately did not build.',
    'We have booked a handover session where the new team does the setup and we only take notes.',
]))
thread_specs.append('What goes into a brief for a two-week student prototype?|product|projects,planning,research|Our team keeps adding features before agreeing on the problem. What belongs in a brief we will actually read?|' + '~'.join(LONG_REPLIES))
for i, line in enumerate(thread_specs):
    title, category, tags, body, replies = line.split('|')
    category = 'community' if category == 'research' else category
    track = {'frontend':0, 'backend':1, 'product':2, 'career':4, 'community':i % 15}[category]
    author = candidates(track)[(i * 3) % len(candidates(track))]
    created = END - timedelta(days=R.randint(1, 62), hours=R.randint(1, 10))
    reply_texts = replies.split('~')
    count = len(reply_texts) if i >= len(thread_specs) - 2 else [0, 1, 3, 4, 4, 2, 3, 1][i % 8]
    thread = add('threads', slug=slug(title), author_id=author['profile']['id'], title=title, body=body, category=category,
        is_pinned=False, views=0, created_at=stamp(created), updated_at=stamp(created))
    tid = thread['id']
    fact(author['profile']['id'], created, 'first_thread', 20, 'thread_create', f'thread:{tid}')
    for tag in tags.split(','):
        if slug(tag) not in tagmap:
            t = add('tags', slug=slug(tag), name=tag, color='#2E78E5', created_at=stamp(START))
            tagmap[slug(tag)] = t['id']
        add('thread_tags', thread_id=tid, tag_id=tagmap[slug(tag)])
    commenters = R.sample([p for p in PEOPLE if p != author], min(count, len(PEOPLE) - 1))
    roots = []
    for j, text in enumerate(reply_texts[:count]):
        when = min(created + timedelta(hours=2 + j * 7), END - timedelta(hours=2))
        person = author if i == len(thread_specs) - 1 and j in [2, 6, 10, 14] else commenters[j]
        parent = roots[-1] if j > 0 and j % 3 == 1 else None
        c = add('comments', thread_id=tid, author_id=person['profile']['id'], parent_id=parent['id'] if parent else None,
            body=text, xp_awarded=False, created_at=stamp(when), updated_at=stamp(when))
        if not parent:
            roots.append(c)
        fact(person['profile']['id'], when, 'ten_comments')
        notify(parent['author_id'] if parent else author['profile']['id'], person['profile']['id'],
            'replied_to_comment' if parent else 'commented_on_thread', 'thread', tid, title, thread['slug'], when)
        n = R.choices([0, 1, 2, 4, 6, 9], [30, 26, 20, 13, 8, 3])[0]
        voters = R.sample([p for p in PEOPLE if p['profile']['id'] != person['profile']['id']], n)
        for vi, voter in enumerate(voters):
            vt = min(when + timedelta(minutes=30 + vi * 40), END - timedelta(minutes=30))
            add('votes', user_id=voter['profile']['id'], thread_id=None, comment_id=c['id'], value=1, created_at=stamp(vt))
            fact(person['profile']['id'], vt, 'helpful_5')
            if vi == 4:
                fact(person['profile']['id'], vt, amount=25, reason='helpful_comment', source=f"comment:{c['id']}")
                c['xp_awarded'] = True
    # Each displayed view corresponds to a unique user/day record.
    view_count = 530 if i == len(thread_specs) - 1 else R.choice([5, 9, 16, 24, 40, 58, 85, 155])
    seen = set()
    while len(seen) < view_count:
        p = R.choice(PEOPLE)
        day = (created + timedelta(days=R.randrange(max(1, (END - created).days)))).date().isoformat()
        key = (p['profile']['id'], day)
        if key not in seen:
            seen.add(key)
            add('thread_views', thread_id=tid, user_id=key[0], viewed_on=day)
    thread['views'] = len(seen)
    for voter in R.sample([p for p in PEOPLE if p != author], min(R.choice([0, 1, 2, 4, 8, 12, 21]), len(seen))):
        add('votes', user_id=voter['profile']['id'], thread_id=tid, comment_id=None, value=1, created_at=stamp(min(created + timedelta(days=1), END - timedelta(minutes=20))))

# Keep the graph sparse. Same-track peers and project teammates are more likely to connect.
pairs = set()
for person in PEOPLE:
    uid = person['profile']['id']
    if person['index'] % 7 == 0:
        continue
    peers = [p for p in PEOPLE if p != person and (p['track'] == person['track'] or p['country'] == person['country'])]
    for other in R.sample(peers, R.randint(1, min(4, len(peers)))):
        oid = other['profile']['id']
        key = tuple(sorted([uid, oid]))
        if key in pairs:
            continue
        pairs.add(key)
        when = END - timedelta(days=R.randint(1, 65))
        status = R.choices(['accepted', 'pending'], [83, 17])[0]
        add('connections', from_user_id=uid, to_user_id=oid, status=status, created_at=stamp(when), updated_at=stamp(when + timedelta(hours=3) if status == 'accepted' else when))
        notify(oid, uid, 'connection_request', 'user', uid, person['profile']['full_name'], person['profile']['username'], when)
        if status == 'accepted':
            notify(uid, oid, 'connection_accepted', 'user', oid, other['profile']['full_name'], other['profile']['username'], when + timedelta(hours=3))

# Library records are immutable. Only fictional users' progress is added.
for person in PEOPLE:
    if person['index'] % 4 == 0:
        continue
    uid = person['profile']['id']
    count = R.choices([1, 2, 3], [65, 28, 7])[0]
    for bi, book in enumerate(R.sample(OLD['books'], count)):
        chapters = sorted([c for c in OLD['chapters'] if c['book_id'] == book['id']], key=lambda c:c.get('order', c['id']))
        complete_count = R.choices([0, 1, 2, 3, 4, 5], [9, 23, 24, 18, 13, 13])[0]
        complete_count = min(complete_count, len(chapters))
        when = END - timedelta(hours=9 - bi * 2, minutes=person['index'] % 50)
        book_created = datetime.fromisoformat(book['created_at'])
        when = max(when, book_created + timedelta(minutes=30))
        completed_ids = []
        for j, chapter in enumerate(chapters[:complete_count]):
            ct = when + timedelta(minutes=j * 12)
            completed_ids.append(chapter['id'])
            fact(uid, ct, 'first_chapter' if j == 0 else None, 10, 'chapter_complete', f"chapter:{chapter['id']}")
        finished = complete_count == len(chapters)
        last = when + timedelta(minutes=max(0, complete_count - 1) * 12)
        add('reading_progress', user_id=uid, book_id=book['id'], chapter_id=chapters[min(complete_count, len(chapters)-1)]['id'],
            progress_percent=round(100 * complete_count / len(chapters)), completed=finished, completed_chapters=completed_ids,
            book_completion_awarded=finished, last_read_at=stamp(last), created_at=stamp(when), updated_at=stamp(last))
        if finished:
            fact(uid, last, 'first_book', 100, 'book_complete', f"book:{book['id']}")
            fact(uid, last, 'five_books')

# Replay facts in time order so badge XP is supported by evidence at its award time.
profiles = {p['id']:p for p in DATA['profiles']}
counters = defaultdict(Counter)
earned = defaultdict(set)
last_login = {}
event_keys = set()
def xp(uid, amount, reason, source, when):
    key = (uid, reason, source)
    assert key not in event_keys, key
    event_keys.add(key)
    add('xp_events', user_id=uid, amount=amount, reason=reason, source=source, created_at=stamp(when))
    profiles[uid]['xp'] += amount
    profiles[uid]['level'] = math.floor(math.sqrt(profiles[uid]['xp'] / 50)) + 1

for when, uid, criterion, amount, reason, source in sorted(FACTS, key=lambda f:f[0]):
    p = profiles[uid]
    if amount:
        xp(uid, amount, reason, source, when)
    if criterion == 'login':
        previous = last_login.get(uid)
        p['streak_days'] = p['streak_days'] + 1 if previous == when.date() - timedelta(days=1) else 1
        last_login[uid] = when.date()
        p['last_active'] = when.date().isoformat()
        if p['streak_days'] % 7 == 0:
            xp(uid, 5, 'streak_week_bonus', str(when.date()), when)
    elif criterion:
        counters[uid][criterion] += 1
    changed = True
    while changed:
        changed = False
        for b in OLD['badges']:
            k = b['criteria_key']
            value = p['streak_days'] if k.startswith('streak_') else p['level'] if k.startswith('level_') else counters[uid][k]
            if b['id'] not in earned[uid] and value >= b['required']:
                earned[uid].add(b['id'])
                add('user_badges', user_id=uid, badge_id=b['id'], earned_at=stamp(when))
                xp(uid, b['xp_reward'], k, 'badge', when)
                notify(uid, None, 'badge_earned', 'badge', b['id'], b['name'], '', when)
                changed = True

for p in DATA['profiles']:
    if p['last_active'] and datetime.fromisoformat(p['last_active']).date() < END.date() - timedelta(days=1):
        p['streak_days'] = 0

for table, rows in DATA.items():
    columns = [c['column_name'] for c in BEFORE['catalog']['columns'] if c['table_name'] == table and c['column_name'] in rows[0]]
    with (ROOT / f'{table}.csv').open('w', encoding='utf8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            encoded = {}
            for k in columns:
                value = row[k]
                if value is None:
                    encoded[k] = '\\N'
                elif isinstance(value, bool):
                    encoded[k] = str(value).lower()
                elif k == 'completed_chapters':
                    encoded[k] = '{' + ','.join(map(str, value)) + '}'
                elif isinstance(value, (list, dict)):
                    encoded[k] = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
                else:
                    encoded[k] = value
            writer.writerow(encoded)

manifest = {'dataset':'colearn-2026', 'as_of':stamp(END), 'fictional':True,
            'countries':43, 'counts':{t:len(r) for t,r in DATA.items()},
            'csv_null':'\\N', 'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.glob('*.csv'))}}
(ROOT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf8')
Path('.dist/data-generated.json').write_text(json.dumps(DATA, ensure_ascii=False), encoding='utf8')
print(json.dumps(manifest['counts'], indent=2))
print('XP range',min(p['xp'] for p in DATA['profiles']),max(p['xp'] for p in DATA['profiles']))
