# CoLearn fictional community refresh — 19 September 2026

This is a **data-only** dataset for the existing Supabase project
`ghjdpcvnzclfvyosfhoz`. It does not add tables, alter policies, change routes, or
redesign the application. All new students, project teams and conversations are
fictional. Profile bios disclose this, usernames end in `.demo`, and Auth metadata
marks the dataset. Fictional accounts use the reserved `.example` domain and have
login disabled. No real student profiles, personal emails, photographs, social
accounts or credentials were collected.

## Existing application audit

The audit covered all 28 public tables, their live columns, foreign keys, check and
unique constraints, indexes, RLS policies, triggers, reward functions and the React
query/normalization layer. The public database is the schema source of truth.

| Existing surface | Data and important display contracts |
| --- | --- |
| People and recommendations | `profiles`, `skills`, `user_skills`, `user_badges`, `badges`, `connections`; skill filters use actual skill links, availability uses the existing enum-like strings, locations are searchable text. Recommendations derive shared skills; no fabricated match scores. |
| Public profiles and portfolio | The same profile relations, public projects/members, completed reading progress and `colearn_portfolio`; the activity heatmap uses dated XP events. Optional avatars and social links use existing empty-value fallbacks. |
| Projects, detail and workspace | `projects`, `project_members`, `tasks`, `milestones`, `project_updates`, `join_requests`; stacks and requested roles are JSON arrays. Project status is `idea`, `active`, `completed` or `archived`. Task assignees must be members. |
| Community and thread detail | `threads`, `tags`, `thread_tags`, `comments`, `votes`, `thread_views`; categories remain frontend/backend/product/career/community. Replies have one parent level. Counts come from real related records. |
| Leaderboard and badges | `profiles`, `xp_events`, `user_badges`, `badges`, `colearn_leaderboard`; all-time XP comes from the profile, week/month XP from the ledger. Level is `floor(sqrt(xp / 50)) + 1`. |
| Dashboard | The signed-in person's projects, assigned tasks, reading progress, connections, notifications and XP. No fictional activity is assigned to an existing real user to make their dashboard appear busy. |
| Notifications | `notifications` and actor profiles; the dataset uses the exact verbs and target slugs recognized by `src/lib/notifications.js`. All new recipients and actors belong to this fictional cohort. |
| Library and reader | `books`, `chapters`, `reading_progress`, `bookmarks`, `notes`; all existing book/chapter rows remain unchanged. Only new fictional users receive new progress records. |
| Search | Existing profile/project/thread/book search queries and text fields. |
| Messages | `direct_messages`, accepted connections and profiles; no private conversations are fabricated. |
| Administration/contact | Existing profiles, projects, reports, books and `contact_messages`; staff identities, real contact messages and uncertain content remain protected. |

The adapter paginates Supabase reads in batches, so collections larger than the
default API row limit still reach the existing client-side filters and sorting.

## Deliberate schema-compatible choices

- No university field exists. No university affiliations were invented or added.
  Course/year, goals and interests use existing profile text/JSON fields.
- Planning maps to `idea`, in progress to `active`, and paused to `archived` with
  an explicit pause explanation. Difficulty is described in project text because
  there is no dedicated difficulty column.
- Team roles remain `owner`, `member`, `mentor`. Specific contributions are
  explained through existing skills, project descriptions and assigned tasks.
- Declined connections are absent rows in this application. Only supported
  `accepted` and `pending` records are generated; no new status is invented.
- Existing books were imported recently. New reading history starts after their
  stored creation timestamps. Library titles, chapters, content and metadata are
  preserved exactly.
- XP is replayed from signup, onboarding, dated logins, membership, tasks,
  milestones, threads, helpful votes, reading and earned badges. Daily limits and
  unique reward sources are checked. Historical badges are awarded when their
  criteria become true, including levels reached through badge XP.
- Some old accounts have XP totals from the original Django seed rather than a
  complete ledger. Those existing totals are preserved, not silently rewritten.

## Provenance and safe removal

The old Django `seed_demo.py` supplies exact fingerprints: project summaries and
descriptions, named thread bodies, numbered placeholder comments/tasks/updates,
and the repeated seeded report reason. Names alone are not a deletion criterion.
The private audit also checked imported Auth metadata and legacy login history.

All 32 existing identities are retained. One seed identity had a real legacy
login; another is staff. An incoming connection, a project join request and a real
discussion reply link existing users to seed content. Their dependencies remain.
Uncertain records stay untouched. Exact disposable seed content is removed only
when its complete dependency set is safe. No table is truncated.

The private before snapshot, cleanup row list and generated SQL stay under the
ignored `.dist/` directory. They are not included in this delivery because they
contain existing application data. The public CSVs contain only new fictional
data and new shared skill/tag definitions.

## Files and import mechanics

`manifest.json` lists every CSV, row count and SHA-256 digest. CSV headers match
actual database columns. UTF-8 preserves names with accents. JSON values use JSON
text; `completed_chapters` uses PostgreSQL array syntax. `\N` means SQL NULL; an
empty string means an actual empty text value. Use `NULL '\N'` when loading with
PostgreSQL COPY. Profiles require corresponding Supabase Auth IDs first.

The scripts run from the repository root:

1. `generate.py` produces deterministic CSVs from the audited schema and original
   content in `curated.py`.
2. `validate.py` verifies required fields, keys, relationships, chronology, reward
   limits, profile totals, authorship and fictional-account isolation.
3. `plan_cleanup.py` classifies exact old seed rows and preserves ambiguous data.
4. `build_import.py` reads and type-decodes the **actual CSV files**, verifies
   their manifest hashes, and builds `.dist/data-import.sql`.
5. `import.mjs` provisions marked, banned Auth identities through Auth Admin and
   uploads small batches to a private operational staging schema, then applies
   the guarded SQL using the linked cloud CLI. The staging table/schema is dropped
   inside the successful transaction; it is not an application schema addition.
   Service credentials stay
   in memory and are never written to CSVs or frontend files.

The data import uses one transaction. It checks every existing baseline row,
rejects concurrent changes, keeps foreign-key/check/unique constraints active,
and temporarily disables only user triggers while restoring historical activity.
This avoids awarding fresh rewards on top of the supplied historical ledger.
User triggers are restored before commit; an error rolls back the entire data
transaction. Identity sequences are advanced so future normal inserts remain safe.
Auth provisioning is separate; a failed transaction leaves only marked, banned
bootstrap identities, which the importer can recognize for a retry. The completed
import must not be run again: its baseline guard intentionally rejects a replay.

No Docker or local database reset is required. Do not use these files as a blind
reset seed for an unrelated project. Numeric IDs and the guard are tied to the
audited linked project; regenerate against a fresh reviewed audit for a new run.

## Public reference sources

Country/region terminology was checked against the [United Nations M49
classification](https://unstats.un.org/unsd/methodology/m49/). Names and project
ideas are original fictional content, not extracted from public student profiles.
Official [NUS](https://nus.edu.sg/about) and [University of Cape Town](https://uct.ac.za/)
sites were reviewed while checking educational context. Since the application
does not store university affiliations, none were imported. These sources do not
endorse or supply the fictional profiles.

See `REPORT.md` for actual imported/removal counts and verification results.
