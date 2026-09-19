# CoLearn

React + Supabase learning and collaboration platform: curated books, peer projects, community discussions, and public portfolios.

## Run locally

```powershell
cd CoLearner
npm ci
# If .env.local is absent, copy .env.example and set the public Supabase key.
npm run dev -- --host 127.0.0.1 --port 5176
```

Open http://127.0.0.1:5176. Django is not used by the frontend. The linked Supabase project is `ghjdpcvnzclfvyosfhoz` (COlearn). Only its URL and public anon/publishable key belong in `CoLearner/.env.local`; RLS enforces authorization.

## Layout

- `CoLearner/`: React/Vite; Supabase transport in `src/services/supabase/`.
- `supabase/migrations/`: schema, relationships, indexes, RLS, business functions, and Storage policies.
- `supabase/functions/`: protected account administration/password migration and rate-limited contact submissions.
- `supabase/scripts/`: data migration, configuration, and verification.
- `backend/`: retained Django source/database for rollback and comparison. Do not use both backends as writable sources.

## Backend deployment

```powershell
supabase link --project-ref ghjdpcvnzclfvyosfhoz
supabase db push --linked --yes --skip-vault
supabase functions deploy account contact --use-api --no-verify-jwt
```

These cloud commands do not require Docker. Edge Functions validate authentication internally; service keys remain private. Email/password uses Supabase Auth. Google/GitHub credentials are read from the ignored `.env.oauth` file by `supabase/scripts/configure-oauth.ps1`.

See [the migration runbook](supabase/MIGRATION.md) for data migration, authentication configuration, test results, and Django retirement.

See [the educational library runbook](supabase/BOOK_LEARNING.md) for the public book catalog, licensed source collection, admin publishing, document uploads, saved reading positions, background indexing and book assistant setup.

See [social features and UX](supabase/SOCIAL_UX.md) for messaging images, notifications, mentions, project invitations, public showcases and account isolation. The [implementation report](supabase/SOCIAL_UX_REPORT.md) records verification, configuration limits and every changed file.

Recorded [voice messages](supabase/VOICE_MESSAGES.md) are available through the microphone beside the chat composer, with preview, private delivery and playback controls.

## Checks

```powershell
npm --prefix CoLearner run lint
npm --prefix CoLearner run build
node supabase/scripts/verify-live.mjs
```

Live checks require an authenticated Supabase CLI. They create isolated temporary accounts/content and remove them afterward. Do not reimport the source snapshot into a live database; the importer refuses repeated imports.
