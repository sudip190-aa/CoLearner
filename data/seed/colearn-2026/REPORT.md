# Completed CoLearn data refresh

Applied to Supabase project `ghjdpcvnzclfvyosfhoz` on 19 September 2026. This was a
data-only change. No frontend, routes, architecture, application schema,
functions, indexes or RLS policies changed.

Inspected **28 public tables**; changed data in **21**. Imported **20,433 rows**
from **20 CSV files** and removed **167 exact old seed records**. Provisioned
**215 additional Supabase Auth identities** required by the profile foreign key;
these are separate from the public-table row total.

## Actual database counts

| Table | Before | Old seed removed | Added | Final |
| --- | ---: | ---: | ---: | ---: |
| badges | 15 | 0 | 0 | 15 |
| bookmarks | 0 | 0 | 0 | 0 |
| books | 10 | 0 | 0 | 10 |
| chapters | 50 | 0 | 0 | 50 |
| comments | 37 | 27 | 162 | 172 |
| connections | 1 | 0 | 422 | 423 |
| contact_messages | 1 | 0 | 0 | 1 |
| direct_messages | 0 | 0 | 0 | 0 |
| join_requests | 1 | 0 | 23 | 24 |
| milestones | 18 | 12 | 160 | 166 |
| notes | 0 | 0 | 0 | 0 |
| notifications | 71 | 0 | 2,089 | 2,160 |
| profiles | 32 | 0 | 215 | 247 |
| project_members | 24 | 15 | 300 | 309 |
| project_updates | 18 | 12 | 113 | 119 |
| projects | 9 | 6 | 80 | 83 |
| reading_progress | 41 | 0 | 247 | 288 |
| reports | 26 | 26 | 0 | 0 |
| skills | 30 | 0 | 16 | 46 |
| tags | 31 | 0 | 51 | 82 |
| tasks | 36 | 24 | 436 | 448 |
| thread_tags | 36 | 27 | 128 | 137 |
| thread_views | 3 | 0 | 3,709 | 3,712 |
| threads | 13 | 9 | 63 | 67 |
| user_badges | 58 | 0 | 793 | 851 |
| user_skills | 84 | 0 | 647 | 731 |
| votes | 12 | 9 | 686 | 689 |
| xp_events | 40 | 0 | 10,093 | 10,133 |

## New data

- **215 fictional students across 43 countries**, with varied names, course/year
  context, learning goals, availability and 647 skill links. Bios disclose the
  fictional status. Auth metadata marks the dataset and these accounts cannot log in.
- **80 projects**: 16 planning (`idea`), 35 active, 22 completed and seven paused
  (`archived`). Teams range from one to six members. Concrete tasks, milestones,
  requested roles and contributions support existing matching and progress displays.
- **63 discussions and 162 comments**. Reply counts vary: eight unanswered
  threads, 15 with one reply, seven with two, 15 with three, 16 with four, one with
  eight and one with sixteen. Includes nested follow-ups, disagreement and practical questions.
- **686 votes and 3,709 unique user/day thread visits** support the displayed
  engagement. No self-votes.
- **422 connections** form a sparse graph around skills and country. Existing
  supported statuses are used; declined connections are absent rows in this application.
- **10,093 XP events and 793 badge awards** explain every new profile total and
  level. XP ranges from 80 to 2,535: 39 students below 300, 73 from 300–899, 100
  from 900–1,999 and three at 2,000 or more.
- **2,089 notifications** reference actual fictional profiles, projects, threads
  and badges. No new notification is sent to an original account.
- **247 reading-progress records** belong only to new fictional students. No
  books or chapters were edited.

## Removed and intentionally preserved

Removal used exact fingerprints from the existing Django seed source: six
projects, their 15 memberships, 24 tasks, 12 milestones and 12 updates; nine
discussions, 27 placeholder comments, nine seed votes and 27 tag links; and 26
repeated seed reports. No accounts were deleted and no tables were truncated.

All **32 original profiles** and their Auth accounts remain. Eighteen profiles
had no reliable seed provenance. Fourteen matched the old seed, but imported Auth
login history is insufficient to prove an identity disposable; one had a real
legacy login and one is staff. Real interactions also depend on seeded identities.
Identity preservation was deliberately conservative.

Preserved **three old projects**, **four old threads**, **ten old comments**, the
original connection request, project join request, three visits, contact
submission and all uncertain records. This includes the real reply attached to
an old seeded discussion. All remaining original rows were compared field by
field against the private before snapshot.

The original **10 books and 50 chapters are unchanged**, as are all 15 badge
definitions, existing learning progress, original XP totals and original
notifications. Some legacy seeded XP totals exceed what their old ledger
explains. They remain because changing protected accounts was outside the safe
cleanup boundary. No new direct messages were fabricated.

## References and CSV delivery

Country/region terminology: [United Nations M49](https://unstats.un.org/unsd/methodology/m49/).
Educational context checked against [NUS](https://nus.edu.sg/about) and
[University of Cape Town](https://uct.ac.za/). The schema has no university field,
so no affiliations were invented or imported. No student profiles were scraped.
All new personal and conversational content is fictional.

CSV files are named after their actual database tables:

| CSV | Rows |
| --- | ---: |
| [profiles.csv](profiles.csv) | 215 |
| [skills.csv](skills.csv) | 16 |
| [user_skills.csv](user_skills.csv) | 647 |
| [projects.csv](projects.csv) | 80 |
| [project_members.csv](project_members.csv) | 300 |
| [tasks.csv](tasks.csv) | 436 |
| [milestones.csv](milestones.csv) | 160 |
| [project_updates.csv](project_updates.csv) | 113 |
| [join_requests.csv](join_requests.csv) | 23 |
| [threads.csv](threads.csv) | 63 |
| [tags.csv](tags.csv) | 51 |
| [thread_tags.csv](thread_tags.csv) | 128 |
| [comments.csv](comments.csv) | 162 |
| [votes.csv](votes.csv) | 686 |
| [thread_views.csv](thread_views.csv) | 3,709 |
| [connections.csv](connections.csv) | 422 |
| [reading_progress.csv](reading_progress.csv) | 247 |
| [xp_events.csv](xp_events.csv) | 10,093 |
| [user_badges.csv](user_badges.csv) | 793 |
| [notifications.csv](notifications.csv) | 2,089 |

Each file has actual column names, UTF-8 text, valid IDs and relationships, JSON
arrays where expected, PostgreSQL chapter-array syntax and explicit `\N` null
markers. [manifest.json](manifest.json) contains counts and checksums.
[README.md](README.md) documents the audit, page/table contracts, enum mapping,
Auth prerequisites and guarded cloud import.

## Verification and resolved issues

- Local validation passed **156,729 assertions across 250 groups**, including
  required fields, FK targets, uniqueness, chronology, task membership, comment
  parents, XP limits and ledger/level consistency.
- Live validation checked every imported CSV field and every retained original
  row. All actual counts matched the table above after browser-test cleanup.
- RLS probes ran as authenticated users and rolled back: own notifications
  readable, others hidden; connection visibility scoped; own profile/project
  updates allowed; other profile/project updates blocked.
- Confirmed all public tables still have RLS enabled, all user triggers are
  enabled, all constraints validated, and no staging schema or verification
  account remains.
- **13 browser checks passed** on the existing React application: Dashboard,
  all new People records, people filters/search, project search/status/technology
  filters, project detail, community search/unanswered/detail, all/week/month
  leaderboards, public profile/portfolio, notifications and Library. No captured
  console errors or HTTP error responses. Screenshots were inspected for populated
  cards, names, task counts, replies and profile activity.
- The cloud endpoint rejected the initial oversized SQL request with HTTP 413
  before any content change. Small batches uploaded to a private staging schema,
  followed by one guarded transaction, resolved it. That schema was dropped within
  the transaction.
- Two verification-harness issues were corrected: normalizing equivalent
  date/timestamp values, and wrapping browser evaluation in an async function.
  These were test tooling issues, not application failures.
- **Frontend data errors fixed: 0. Frontend files changed: 0.** No UI redesign or
  schema migration was needed. Temporary browser fixtures and their view-counter
  effects were removed and final counts were reverified.

Machine-readable evidence: [verification.json](verification.json) and
[browser-verification.json](browser-verification.json). Private snapshots,
staging SQL and screenshots remain in the ignored local `.dist/` directory; no
credentials or original private data are included in this dataset directory.
