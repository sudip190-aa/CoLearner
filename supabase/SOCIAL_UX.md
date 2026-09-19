# Social features and UX stabilization

## Existing architecture

React 18, Vite, React Router, Tailwind, Zustand authentication and TanStack Query remain in place. Supabase Auth, PostgreSQL RLS, Storage and Realtime are the backend. Existing profiles, connections, direct messages, WebRTC calls, projects, join requests, comments and notifications are extended. Retained Django code is not involved.

## Authentication and identity

OAuth uses the existing Supabase PKCE flow. Google and GitHub are asked to show account selection with `prompt=select_account`; CoLearn's old local session is discarded before starting the provider handoff. The callback checks the verified Supabase user and expected provider. Profile hydration rejects stale results after logout or account changes. Query caches and mounted application state are scoped to the current account, and notification requests cannot repopulate a previous account's state.

CoLearn logout does not log a person out of github.com. Account selection is handled by GitHub, as documented in [GitHub OAuth authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). Provider credentials and browser cookies are never copied between CoLearn profiles. Completing OAuth with two real GitHub accounts still requires their owners to authenticate; automated handoff checks do not constitute full provider consent verification.

## Messages and calls

The existing paginated, connection-gated inbox now supports one JPEG, PNG or WebP image per message, up to 5 MB and 24 megapixels in the UI. The browser decodes images before uploading. Preview, removal, upload errors, retry with a stable message ID and an enlarged viewer are provided. Images live in private `chat-images` storage. Paths bind sender, recipient and message UUID; a recipient cannot read an upload until its message is committed. Outsiders and staff have no special private-message access. Signed URLs expire after five minutes. Text remains independent of images and calls.

Existing WebRTC voice calls retain calling, incoming, connected, mute, decline, end, unavailable and failure states. Signaling and connection permissions remain server-enforced; no audio is recorded. TURN configuration for difficult networks remains as documented in [VOICE_CALLS.md](VOICE_CALLS.md).

Recorded voice notes are now a separate composer action. See [VOICE_MESSAGES.md](VOICE_MESSAGES.md) for two-minute recording, preview, private audio storage, playback controls and verification. Live calls remain unrecorded.

## Projects and profiles

Projects gain live demo and repository URLs, a six-image gallery and a showcase flag. Existing creation, editing, visibility, owner controls, team membership and deletion are reused. `/showcase/:slug` presents a public project without requiring login; private projects remain protected. A pending invite allows its recipient to preview that project until it is accepted, declined or cancelled.

The workspace Team tab offers a picker of accepted connections. Project members may invite their connections; only the invite's sender or project owner may cancel it. Pending duplicates are rejected, and repeat invitations/requests have a one-day cooldown. Only the owner answers join requests and only the invitee answers invitations. Acceptance checks capacity and creates the existing membership. Notifications identify the actor/project and record acceptance or rejection.

Settings → Profile exposes Learner/Mentor and notification-sound preferences. These persist in the existing profile. Mentor is a public product role, not a staff/admin privilege. Existing staff permissions remain separate.

## Community and notifications

The Community feed uses a quieter two-column layout, one primary posting action, compact discussion rows, search and filters, and responsive spacing. Feed and comment history are paginated on the server. Comment composers offer keyboard-accessible suggestions from accepted connections. Only eligible mentions receive notifications; only recorded mentions become profile links in comments. Notification links contain `#comment-ID`, including targeted retrieval when that comment is older than the current page.

The existing notification table/center serves project activity, requests, invitations, replies, mentions, messages and calls. A single authenticated subscription receives Realtime changes, with a visibility-aware polling fallback. New activity appears for approximately ten seconds; dismissal does not remove it from the center. Seen IDs are deduplicated per account/browser session. A short sound plays only after browser audio can be unlocked and when the user's sound preference permits it. Notifications and earlier history remain private and can be marked read.

## Migrations and commands

Migrations `20260920090000`–`20260920090600` are stored in `supabase/migrations/` and applied to COlearn (`ghjdpcvnzclfvyosfhoz`). Changes include private chat storage, message images, notification event keys/anchors, project showcase fields and invitation metadata, comment mentions, pagination RPCs, RLS, triggers, indexes and Realtime publication membership.

```powershell
supabase db push --linked --yes --skip-vault
node supabase/scripts/verify-oauth.mjs
node supabase/scripts/verify-messaging.mjs
node supabase/scripts/verify-voice-messages.mjs
node supabase/scripts/verify-voice-calls.mjs
node supabase/scripts/verify-social.mjs
node supabase/scripts/verify-social-ui.mjs
node supabase/scripts/verify-social-ui.mjs --auth-only
node supabase/scripts/verify-social-ui.mjs --project-only
node supabase/scripts/verify-auth-links.mjs
node supabase/scripts/verify-book-ui.mjs
npm --prefix CoLearner run build
npm --prefix CoLearner run lint
```

Browser checks expect Vite on port 5176 and isolated Chrome CDP on port 9224. Voice checks need Chrome's fake media flags, as documented in the existing voice guide. Test accounts and fixture content are disposable and removed. Reports/screenshots are written to ignored `.dist/`. Do not run browser scripts concurrently.

## Configuration and limits

No new credentials are required for these social features. Existing Supabase public frontend configuration and enabled Google/GitHub providers are reused. No service-role key belongs in React. Live book AI generation still needs the server-only key/model described in [BOOK_LEARNING.md](BOOK_LEARNING.md); this feature does not change that limitation or SMTP configuration.

Popups operate while CoLearn is open; this is not an operating-system push-notification service. Sound follows browser autoplay restrictions. An already issued signed image URL remains valid until expiry. Private image paths are not public URLs. Database permissions cannot retract bytes already delivered to a browser.

## Manual walkthrough

1. Use two accounts in separate browser profiles. Log in, visit Home, refresh, and confirm My Dashboard appears. Log out before signing into the other account. Repeat GitHub authentication with each real GitHub account and verify its profile.
2. Connect the accounts through People. Open a dashboard connection's profile or message action; send text and one image, leave the chat, and return. Start a voice call, accept, mute, and end it.
3. In Community, create a discussion and type `@` in a comment. Select the connection. On the other account, check the popup, sound, dismissal, notification center, and exact comment destination.
4. Create a project or showcase existing work. Add description, skills, cover, demo/repository links and gallery images. Check its public showcase while logged out, then verify a private project is unavailable to unrelated accounts.
5. Send a join request; have the owner accept/reject it in the workspace. Invite a connected friend, inspect its notification, and accept/decline it. Test cancellation and duplicate protection.
6. Change Learner/Mentor in Settings, save, refresh, log out/in, and inspect the public profile. Disable notification sounds and check that visual notifications continue.
7. Open a book, read, complete a chapter, reload and resume. The assistant should either answer from configured evidence or clearly state that generation is not configured.
