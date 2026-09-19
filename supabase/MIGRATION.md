# Django → Supabase migration

Linked project: **COlearn**, `ghjdpcvnzclfvyosfhoz`. Django is retained for rollback; React uses Supabase directly.

## Source and destination

`SUPABASE_MIGRATION_ANALYSIS.md` contains the source audit. Resource strings retained in `CoLearner/src/services/api.js` are internal dispatch keys, not Django HTTP requests. `services/supabase/adapter.js` implements their Supabase equivalents.

| Source Django models | Supabase tables |
| --- | --- |
| CustomUser | `auth.users` credentials + `profiles` UUID identity and `legacy_id` |
| Skill, UserSkill, Connection | `skills`, `user_skills`, `connections` |
| Book, Chapter, ReadingProgress, Bookmark, Note | `books`, `chapters`, `reading_progress`, `bookmarks`, `notes` |
| Project, ProjectMember, JoinRequest | `projects`, `project_members`, `join_requests` |
| Task, Milestone, ProjectUpdate | `tasks`, `milestones`, `project_updates` |
| Thread, Tag, M2M, Comment, Vote, ThreadView | `threads`, `tags`, `thread_tags`, `comments`, `votes`, `thread_views` |
| Report, ContactMessage | `reports`, `contact_messages` |
| Badge, UserBadge, XPEvent | `badges`, `user_badges`, `xp_events` |
| Notification | `notifications` |

Generic Django references become explicit foreign keys for votes/reports. Notification targets use text identifiers for UUID users and bigint content IDs. Required relationships cascade; optional actors, assignees, and report targets use SET NULL. Membership, skills, tags, badges, and votes have uniqueness constraints. Identity sequences are reset after importing historical IDs.

## Functionality

| Feature | Replacement |
| --- | --- |
| Signup/login/logout/recovery/password changes | Supabase Auth, PKCE callback, Auth session listener |
| Google/GitHub sign-in | Supabase OAuth and `/auth/callback` |
| Profiles/directory | RLS reads, column-limited self updates, atomic skills RPC |
| Library/chapters/notes | Supabase CRUD; authenticated reads and staff publishing |
| Completion/bookmarks | Transactional RPC derives progress and rewards |
| Projects/tasks/milestones/updates | RLS CRUD; owner/member permissions and server reward triggers |
| Requests/invitations/team roles | Row-locked RPC checks owner, capacity, and state |
| Threads/comments/tags/votes/reports | RLS CRUD and transactional community RPCs |
| XP/streaks/badges | Private SQL functions and unique reward ledger |
| Leaderboard/public portfolio | Restricted RPCs; private projects and email excluded from portfolios |
| Notifications/dashboard/search | RLS reads, batched related queries |
| Admin users | Edge Function verifies bearer token, active staff, and protected-account rules |
| Admin content/reports/stats | Staff RLS policies and checked RPCs |
| Contact form | Validated, rate-limited public Edge Function; staff-only stored messages |

No AI, payment, or other private third-party integration was present. Django email/reset logic is replaced by Supabase Auth.

## Security and Storage

Every public application table has RLS enabled. Clients cannot change XP, verified flags, staff/superuser flags, badges, membership, or other users' private learning data. Display `role` does not grant administrative access. Inactive accounts lose data access even with an unexpired JWT. UI route guards supplement database/Edge enforcement.

- `avatars`: public, 2 MB, only the owner's UUID folder writable.
- `book-covers`: public, 5 MB, staff uploads.
- `project-covers`: private, 5 MB, owner uploads; signed URLs require project visibility.
- JPEG, PNG, WebP only. Existing local media is uploaded to Storage.

The private `app` schema is not exposed through PostgREST. Functions have fixed search paths and restricted execution grants. Policy acceptance and legacy password hashes stay private. `.env.oauth`, frontend local environment files, and sensitive `.dist/` staging exports are ignored by Git.

## Imported data

Preserved 31 accounts, 10 books/50 chapters, 9 projects/24 memberships, 36 tasks, 18 milestones, 13 threads/37 comments, and related learning progress, badges, reports, notifications, and contact records. Exact counts are verified across 26 imported tables; 15 badge definitions are seeded separately. Historical project status values `in_progress`/`review` normalize to `active`, matching the current UI/model choices. Account staff flags, XP, and project ownership are verified against the SQLite source.

Already-executed initial import workflow:

```powershell
python supabase/scripts/export_legacy.py backend/db.sqlite3 .dist/legacy-data.json
supabase db query --linked "select table_name,column_name,data_type from information_schema.columns where table_schema='public' order by table_name,ordinal_position" --output json | Out-File -Encoding utf8 .dist/supabase-columns.json
node supabase/scripts/migrate-data.mjs
supabase db query --linked --file .dist/import-legacy.sql
node supabase/scripts/verify-import.mjs
```

The SQLite source is read-only. CLI service credentials stay in memory. The database import holds an advisory lock, suspends only application triggers inside its transaction, and records `app.import_runs`; repeating an imported snapshot is refused. Auth account creation and media upload precede the transaction and are restartable. No dual-write is implemented.

Existing PBKDF2-SHA256 passwords migrate on first successful login via a rate-limited Edge Function. It consumes the legacy hash and sets the Supabase password. A password change/reset deletes the old hash, preventing an old Django password from regaining access. Accounts with unusable passwords require recovery. Existing Django sessions do not carry over.

## Auth configuration

Email/password authentication is enabled and email confirmation is disabled at the user's request. Signup immediately creates a session and opens onboarding; no confirmation email is required. Local callback URLs are stored in `config.toml`; recovery redirects to `/auth/callback?next=/reset-password`. Production hosting must add its actual origin and exact callback URLs.

Google and GitHub are enabled in the linked Supabase project, with credentials configured in its dashboard. Both frontend buttons were verified in Chromium against the live providers. Google's initial `redirect_uri_mismatch` was resolved by adding the Supabase callback in Google Cloud, then both provider handoffs passed. No secrets were copied into the frontend or repository.

`configure-oauth.ps1` is an optional credential-rotation helper. It reads `GOOGLE_CLIENT_SECRET` and `GITHUB_CLIENT_SECRET` from ignored `.env.oauth`; it is not needed to use the existing dashboard configuration. Do not push provider configuration without supplying matching secrets. Review `supabase config diff` before any config push so dashboard-managed settings are preserved:

```powershell
./supabase/scripts/configure-oauth.ps1 -CredentialsPath .env.oauth
```

Both provider apps use `https://ghjdpcvnzclfvyosfhoz.supabase.co/auth/v1/callback`. The React buttons and callback/onboarding flows are implemented. Completing provider consent and verifying the returned OAuth session still requires a real Google/GitHub sign-in by the account owner; reaching the provider login page does not verify the client secret exchange.

The user chose to retain Supabase's default test sender. Signup does not require email delivery. Password-reset delivery to public users still requires custom SMTP because the test sender restricts recipients to project team members. See [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp). Branded templates are supplied in `templates/` but remain commented out in the configuration because this free-tier default sender rejects template changes. Default email links use PKCE; the callback also supports token-hash links for future custom templates and cross-device verification.

## Verification

- Frontend ESLint and production Vite build.
- `verify-live.mjs`: 16 live integration groups covering Auth, escalation prevention, RLS, private projects, membership, CRUD, learning progress, idempotent rewards, community/moderation, uploads, public portfolios, contact, admin user CRUD, legacy passwords, reset invalidation, and deactivation. Temporary records are removed in `finally`.
- `verify-browser.mjs`: actual login form, frontend data contracts, project/task/milestone CRUD, 15 routes including all admin pages, mobile screenshot, and console/network checks. Requires Vite on 5176 and Chromium CDP on 9223. The verified run produced no browser exceptions, failed network responses, or Django requests.
- `verify-import.mjs`: exact imported counts, legacy account privileges/XP, and project ownership. Run after test cleanup and before intentional new writes.
- `verify-oauth.mjs`: real Google/GitHub buttons, provider client IDs and callback URLs, OAuth state, provider error detection, cancelled-login recovery, signup policy gating, and browser exceptions. Stops before entering provider credentials. Report: ignored `.dist/oauth-verification.json`.
- `verify-auth-links.mjs`: actual signup form with immediate sign-in and onboarding; forgot-password form and real email-service error handling; recovery tokens, password-reset form, old-password rejection, new-password login, and protected-route redirect; signup confirmation tokens and replay rejection. Requests one recovery email for a disposable example.com fixture (the provider rejects that reserved recipient), never an existing user's email. Generated tokens test link handling independently of email delivery. Temporary accounts are removed.

### Auth follow-up status (2026-09-19)

- Completed: Google/GitHub provider handoffs; callback error handling; immediate signup; confirmation UI with resend cooldown; forgot-password feedback; reset and confirmation token verification; lint and production build.
- Pending: interactive Google/GitHub consent and successful return with a real provider account.
- Pending: custom SMTP and real inbox delivery. A read-only cloud config comparison confirmed custom SMTP is disabled. Email confirmation remains disabled to avoid blocking signup. Enable it only after verifying SMTP delivery to a non-team address. The user previously chose to retain the test sender.

Reports/screenshots are stored in ignored `.dist/`. Live tests need the authenticated Supabase CLI and create temporary cloud data.

## Django retirement and rollback

The entire `backend/` runtime is unnecessary for normal React operation: `manage.py`, Django settings/URLs, models/views/serializers, admin templates, Python environments/dependencies, migrations/tests, SQLite, and local media serving. Keep them until OAuth/email-delivery checks finish; archive the source database and media before deletion. No Django files were prematurely deleted.

SQLite is a point-in-time snapshot. Reverting the React code restores the old API connection but does not copy new Supabase writes back; export/reconcile those writes before rollback. Retire the temporary password bridge after all legacy accounts have migrated or reset.
