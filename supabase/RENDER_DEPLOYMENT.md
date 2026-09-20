# Render deployment

Deployed and verified on 2026-09-20.

- Website: **https://colearn-zuqe.onrender.com**
- Render service: `srv-danio7ijnfac738pgf40`
- [Render dashboard](https://dashboard.render.com/static/srv-danio7ijnfac738pgf40)
- Repository: `https://github.com/sudip190-aa/CoLearner`, branch `main`
- Hosting: free **Static Site**, with HTTPS/CDN. No paid web server, database, disk or worker was created on Render.
- Backend: existing Supabase project `ghjdpcvnzclfvyosfhoz`.

## Configuration

`render.yaml` contains the validated configuration. The initial service was created through the authenticated Render CLI; its matching routes/headers were applied through the API. It is Git-backed, with automatic deploys enabled, but is not managed by a Blueprint sync. Configuration changes in `render.yaml` must also be applied to the service or connected through a Blueprint.

| Setting              | Value                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| Root directory       | `CoLearner`                                                               |
| Runtime              | Static site                                                               |
| Node                 | `22`                                                                      |
| Build                | `npm ci --include=dev && npm run build`                                   |
| Publish directory    | `dist`                                                                    |
| Automatic deploy     | Commits to `main` affecting the frontend                                  |
| SPA routing          | Rewrite `/*` to `/index.html`; existing assets remain directly accessible |
| Browser media policy | `camera=(), microphone=(self)`                                            |
| Worker cache         | `no-cache` for `/call-notifications-sw.js`                                |

Render has `NODE_VERSION`, `SKIP_INSTALL_DEPS`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The Supabase key is the public anon key, with RLS protecting data. No service-role, OAuth provider, TURN or AI secret is placed in the frontend or Render configuration. CLI authentication stays in the user's local Render config, outside Git.

Vite derives metadata from `RENDER_EXTERNAL_URL`; `VITE_SITE_URL` can override it for a future custom domain. The Supabase Auth Site URL and both production callback routes match the Render origin. Existing development callbacks, OAuth providers and email settings were preserved using a reviewed, minimal Auth configuration push.

## Verification

- Render's server-side Blueprint validation passed. Its initial production build/deploy completed successfully.
- HTTPS `/`, `/login`, `/auth/callback`, `/messages` and the actual service-worker JavaScript returned 200 with the configured headers.
- The production browser suite signed in and loaded dashboard, library, projects, community, messages, profile and settings through deep links. Data loaded from Supabase without browser exceptions or failed API requests.
- Light/dark persistence, Poppins, mobile library layout, logout and protected-page redirects passed.
- Google/GitHub buttons reached their correct provider clients and callback with OAuth state. Cancellation and signup policy acceptance passed. Real provider-account consent remains an account-owner check.
- Immediate signup, recovery/confirmation tokens, reset-password form, old-password rejection, new-password login and reused/invalid link rejection passed on the live URL. Temporary test accounts were removed.
- The restricted test email sender rejected the disposable recipient; the UI reported that correctly. Actual mailbox delivery is not claimed.

Repeat the deployed browser checks with an isolated test browser on CDP port 9224 and an authenticated Supabase CLI:

```powershell
$env:COLEARN_TEST_ORIGIN = 'https://colearn-zuqe.onrender.com'
node supabase/scripts/verify-production-ui.mjs
node supabase/scripts/verify-oauth.mjs
node supabase/scripts/verify-auth-links.mjs
```

The site uses Render's included static-hosting allocation. Monitor the workspace's bandwidth/build-minute allowance; no paid upgrade was selected. See [Render Static Sites](https://render.com/docs/static-sites).

The previous external configuration limits remain: SMTP for public email delivery, server-side AI generation credentials, and TURN plus physical cross-network call tests. See [DEPLOYMENT.md](DEPLOYMENT.md) and [VOICE_SETUP.md](VOICE_SETUP.md). Publishing the frontend does not provision those services or enable closed-browser call delivery.
