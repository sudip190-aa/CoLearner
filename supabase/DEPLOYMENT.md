# CoLearn deployment

React runs against the linked COlearn Supabase project `ghjdpcvnzclfvyosfhoz`. Django is retained for reference and rollback; it is not a production runtime dependency.

## Frontend

Use Node 22 and set the hosting project's root directory to **CoLearner**. The checked-in `vercel.json` selects Vite, builds with `npm run build`, publishes `dist`, and rewrites client routes to `index.html`. This preserves direct visits to profiles, project conversations, OAuth callbacks and password-reset pages. The configuration follows [Vercel's Vite SPA guidance](https://vercel.com/docs/frameworks/frontend/vite).

On another static host, serve `CoLearner/dist`, use HTTPS and fall back to `index.html` for application routes. Keep static assets available at their actual paths. Allow microphone access from the app's own origin; the Vercel configuration includes this permission and basic response security headers.

| Public build variable    | Purpose                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Linked project's HTTPS URL                                                                   |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon/publishable key; RLS protects data                                      |
| `VITE_SITE_URL`          | Optional production HTTPS origin for canonical/share metadata; no path, query or credentials |

Set these in the hosting environment. `.env.local` is only for local development. Without `VITE_SITE_URL`, the build omits domain-specific metadata instead of advertising an assumed domain. Runtime authentication redirects use the actual browser origin.

```powershell
npm --prefix CoLearner ci
npm --prefix CoLearner run lint
npm --prefix CoLearner run build
```

## Supabase cloud changes

All 46 repository migrations, through `20260920111000`, are applied to the linked project. The migration dry run reports no pending changes and linked database lint reports no errors.

For subsequent reviewed changes, use the cloud workflow; Docker is unnecessary:

```powershell
supabase link --project-ref ghjdpcvnzclfvyosfhoz
supabase db push --linked --dry-run --skip-vault
supabase db push --linked --yes --skip-vault
supabase functions deploy account contact book-library book-worker voice-ice --use-api --no-verify-jwt
```

The functions validate authentication/authorization internally. `contact` intentionally accepts public, rate-limited submissions. The worker checks its private scheduling credential. CORS supports browser clients without credential cookies; it does not grant data access. RLS, validated bearer tokens and function authorization enforce access. Service-role keys stay in server environments and maintenance scripts.

Do not reimport legacy data or rerun the original importer against the live application. Do not blindly push `config.toml`: that can overwrite dashboard-managed OAuth/email settings. Keep existing provider secrets in Supabase.

## Public URL and authentication

The final production domain has not been supplied and no frontend hosting deployment is claimed. Once it is known, set Supabase Auth's Site URL to that HTTPS origin and add these exact application redirects:

- `https://YOUR_DOMAIN/auth/callback`
- `https://YOUR_DOMAIN/auth/callback?next=/reset-password`

Use exact production URLs, following [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls). Retain local development entries if still needed. Google and GitHub's **provider** callback remains `https://ghjdpcvnzclfvyosfhoz.supabase.co/auth/v1/callback`.

Both providers are enabled and handoff/state/callback checks pass. Their real account owners must complete consent with two GitHub accounts to verify the last external identity step. CoLearn logout clears CoLearn sessions; GitHub controls its own account chooser and provider cookies.

Immediate email signup is preserved as previously requested. The restricted Supabase test sender remains in use, also as requested. Password reset and confirmation-token handling have been tested using generated test links, including expired/reused-state rejection; delivery to public email recipients is **not** verified. Before public release, configure SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ADMIN_EMAIL`) privately in Supabase and then verify receipt/reset on a real mailbox. Decide whether to enable signup confirmation at that point.

## AI and voice limits

- Book generation requires server-only `GEMINI_API_KEY` and `AI_MODEL`. They are currently absent. Use the ignored `.env.ai` and [book runbook](BOOK_LEARNING.md); never use `VITE_` names for these secrets. Embeddings, retrieval, document processing and progress work and were tested against the cloud. Answers and summaries currently show the honest unconfigured state. Provider-adapter citation validation tests pass, but do not prove live generation.
- Group voice uses a small WebRTC audio mesh capped at eight participants. Three browsers exchanged real audio in the demo test. Group membership protects signaling and roster access; leaving or losing membership releases the microphone. Navigating away ends the group call.
- Both private and group calls use an authenticated `voice-ice` endpoint. Direct STUN calling is active; Cloudflare and generic coturn REST credentials are supported server-side. A provider account/secret still needs to be configured for restrictive networks. See [VOICE_SETUP.md](VOICE_SETUP.md) for exact variables and testing. No live TURN allocation has been verified.
- Incoming private calls have an opt-in browser notification and a single-tab ringtone while the app remains open. Notifications and sound remain subject to browser/OS permissions. The service worker handles call actions; it is not a closed-browser Web Push service. Signed media URLs remain valid until their short expiry even after access changes.

## Verification and rollback

See [ADDITIONAL_FIXES_REPORT.md](ADDITIONAL_FIXES_REPORT.md) for the latest checklist and tests, and [COMPLETION_REPORT.md](COMPLETION_REPORT.md) for the preceding functionality release. Live tests create disposable accounts/content and remove them afterward. Run browser suites sequentially using isolated Chrome CDP on port 9224 and Vite on port 5176; voice tests require the fake-media launch flags documented in [VOICE_CALLS.md](VOICE_CALLS.md). Tests must never attach to a personal browsing session. To check production bundles, run `npm --prefix CoLearner run preview -- --host 127.0.0.1 --port 4177` and then `node supabase/scripts/verify-production-ui.mjs`.

After hosting is configured, verify deep links, OAuth, a real reset email, database writes, media upload, realtime messages and audio from two separate networks on the actual HTTPS domain. Database changes in this delivery are additive except for reviewed function replacements and policy/grant changes. Keep backups and use forward migrations for fixes; do not reset the linked database. Roll back the frontend to a known commit if necessary and preserve the existing Django archive until retirement is separately approved.
