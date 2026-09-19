# CoLearn product improvement report

## Existing Architecture

Inspected the React frontend, service facade, Supabase adapter, migrations/RLS, authentication, profiles, dashboard, connections, chat, voice, community, projects, notifications, book learning and admin components before implementation. React 18, Vite, React Router, Tailwind, Zustand and TanStack Query remain. Supabase Auth, PostgreSQL, private Storage, Realtime and existing Edge Functions remain the backend. Retained Django source is unchanged and is not required at runtime.

## Features Added

- Recorded voice messages: a dedicated microphone button, up to two minutes, stop/preview/discard/send, private audio delivery, play/pause, seeking and playback speed. See [VOICE_MESSAGES.md](VOICE_MESSAGES.md).
- One image per private message: selection, preview/removal, upload state, failure/retry, persistent history and enlarged viewer. JPEG/PNG/WebP, 5 MB maximum; the browser also checks decoding and a 24-megapixel limit. Storage policies bind sender, recipient and message ID.
- Connected-friend project invitations: eligible-friend picker, status, cancellation, duplicate protection and recipient-only acceptance/decline. Owners review join requests; outcomes create notifications.
- One notification center for messages, incoming calls, project activity, collaboration requests, replies and mentions. Realtime updates, ten-second popups, manual dismissal, deep links, read state, bounded history and optional sound use the existing notification table.
- Connected-person mention suggestions with keyboard selection, profile links and notification links to the exact comment, including older comments.
- Persistent Learner/Mentor role and notification-sound settings.
- Existing-project showcases with descriptions, skills/category, status, cover, six-image gallery, live demo and repository URLs. Existing owner editing/deletion and project memberships are reused. Public showcases work without login; private projects remain protected.
- Server pagination for projects, discussions, comment/reply history and notifications.

Existing voice calls were retained and regression-tested, with a central incoming-call notification added. Dashboard connections now expose distinct profile and messaging actions.

## Bugs Fixed

- OAuth starts by clearing CoLearn's old session and requesting provider account selection. The callback verifies the Supabase identity and expected provider; stale profile hydration cannot overwrite a newer account.
- Query caches and mounted app state are scoped to the current account. Notification requests cannot restore a previous account's data.
- Fixed a logout race that could navigate away before Supabase cleared its persisted session. Logout always asks Supabase to clear its session even when compatibility tokens are empty. Account isolation preserves in-progress authentication forms, so password-reset success is not erased during sign-out. Already-hydrated sessions are not fetched again merely because the app boundary remounted.
- Abandoned OAuth attempts no longer prevent an explicit email confirmation/recovery token from being processed.
- Fixed ambiguous profile joins after adding invitation-sender and mention relationships.
- Fixed private project creation with `INSERT ... RETURNING`, private-invitation decline navigation and project-filter SQL operator precedence.

These changes address application-side identity reuse. Actual sign-in and consent by two real GitHub users still require manual verification; provider handoff testing alone does not prove that final step.

## UI Improvements

Community now has a quieter two-column layout, compact discussion rows, fewer repeated controls, clearer search/filter hierarchy, an inline comment composer and highlighted comment destinations. Mobile filters collapse without hiding the main discussion feed. Messaging, project galleries, invitations and notifications use existing CoLearn colors, typography and components. Desktop and mobile Community screenshots were inspected. Existing library and reader designs are preserved.

## Database Changes

Eight versioned migrations, `20260920090000` through `20260920090700`, are applied to COlearn (`ghjdpcvnzclfvyosfhoz`):

| Area | Changes |
| --- | --- |
| Messages | `direct_messages.image_path`, text/image constraints, validated Storage paths, private `chat-images` bucket, participant-only image access, message notification trigger |
| Voice messages | `audio_path`, `audio_duration_ms`, bounded metadata and exclusive image/audio attachment constraints; private `chat-audio` bucket, validated paths, participant RLS and voice previews |
| Profiles | `notification_sound`, own-profile update permission; existing role field reused |
| Notifications | `target_anchor`, `event_key`, unique per-user event index, central event triggers and Realtime |
| Projects | `demo_url`, `repository_url`, `gallery`, `is_showcase`; URL/gallery constraints; public/private policies and owner insertion fix |
| Invitations | `join_requests.invited_by`, cancelled status, sender FK, recipient/sender policies, action authorization/cooldown, Realtime |
| Community | `comment_mentions` with unique comment/person pair and restricted writes; connected-mention/reply notification trigger; comment-history indexes and Realtime |
| Pagination | Invoker-security RPCs for project feeds/facets, discussion feeds and comment/reply history, preserving RLS |

No replacement auth/profile/message/project tables were introduced. Existing foreign keys, memberships, cascades, progress and reward handlers are retained. Earlier action handlers are delegated to by the social wrapper and cannot be called directly by clients to bypass it.

## Routes/API

- New public route: `/showcase/:slug`.
- Updated existing routes: `/dashboard`, `/messages?to=:userId`, `/notifications`, `/community`, `/community/:slug#comment-:id`, `/projects`, `/projects/new`, `/projects/:slug`, `/projects/:slug/workspace`, `/settings`, `/u/:username` and the existing OAuth callback.
- New PostgreSQL RPCs: `colearn_project_feed(filters)`, `colearn_thread_feed(filters)`, `colearn_comment_page(discussion, before_id, parent, focus)`.
- Extended existing `colearn_action` actions: `join`, `invite`, `cancel_invite`, `respond`; other actions retain their previous handlers.
- Extended `colearn_message_contacts`, existing direct-message queries, private Storage upload/signing, project/profile updates and notification listing/read operations.
- The existing JavaScript API facade remains. Its route-like identifiers dispatch to Supabase; no Django HTTP server or new Edge Function is required for these changes.

## Files Changed

The complete inventory appears below. No files were deleted.

52 files: 22 added; 30 modified.

| Change | File |
| --- | --- |
| Modified | [CoLearner/src/App.jsx](../CoLearner/src/App.jsx) |
| Modified | [CoLearner/src/components/auth/OAuthButtons.jsx](../CoLearner/src/components/auth/OAuthButtons.jsx) |
| Added | [CoLearner/src/components/community/MentionTextarea.jsx](../CoLearner/src/components/community/MentionTextarea.jsx) |
| Modified | [CoLearner/src/components/layout/AppNavbar.jsx](../CoLearner/src/components/layout/AppNavbar.jsx) |
| Added | [CoLearner/src/components/messages/MessageAudio.jsx](../CoLearner/src/components/messages/MessageAudio.jsx) |
| Added | [CoLearner/src/components/messages/MessageImage.jsx](../CoLearner/src/components/messages/MessageImage.jsx) |
| Added | [CoLearner/src/components/messages/VoiceMessagePlayer.jsx](../CoLearner/src/components/messages/VoiceMessagePlayer.jsx) |
| Added | [CoLearner/src/components/notifications/NotificationHub.jsx](../CoLearner/src/components/notifications/NotificationHub.jsx) |
| Added | [CoLearner/src/components/projects/ProjectGalleryEditor.jsx](../CoLearner/src/components/projects/ProjectGalleryEditor.jsx) |
| Added | [CoLearner/src/components/projects/ProjectInvitations.jsx](../CoLearner/src/components/projects/ProjectInvitations.jsx) |
| Modified | [CoLearner/src/components/ui/RichText.jsx](../CoLearner/src/components/ui/RichText.jsx) |
| Modified | [CoLearner/src/hooks/useNotificationSync.js](../CoLearner/src/hooks/useNotificationSync.js) |
| Added | [CoLearner/src/hooks/useVoiceRecorder.js](../CoLearner/src/hooks/useVoiceRecorder.js) |
| Modified | [CoLearner/src/lib/notifications.js](../CoLearner/src/lib/notifications.js) |
| Modified | [CoLearner/src/main.jsx](../CoLearner/src/main.jsx) |
| Modified | [CoLearner/src/pages/Community.jsx](../CoLearner/src/pages/Community.jsx) |
| Modified | [CoLearner/src/pages/CreateProject.jsx](../CoLearner/src/pages/CreateProject.jsx) |
| Modified | [CoLearner/src/pages/Dashboard.jsx](../CoLearner/src/pages/Dashboard.jsx) |
| Modified | [CoLearner/src/pages/Messages.jsx](../CoLearner/src/pages/Messages.jsx) |
| Modified | [CoLearner/src/pages/Notifications.jsx](../CoLearner/src/pages/Notifications.jsx) |
| Modified | [CoLearner/src/pages/ProjectDetail.jsx](../CoLearner/src/pages/ProjectDetail.jsx) |
| Modified | [CoLearner/src/pages/ProjectWorkspace.jsx](../CoLearner/src/pages/ProjectWorkspace.jsx) |
| Modified | [CoLearner/src/pages/Projects.jsx](../CoLearner/src/pages/Projects.jsx) |
| Modified | [CoLearner/src/pages/PublicProfile.jsx](../CoLearner/src/pages/PublicProfile.jsx) |
| Modified | [CoLearner/src/pages/Settings.jsx](../CoLearner/src/pages/Settings.jsx) |
| Modified | [CoLearner/src/pages/ThreadDetail.jsx](../CoLearner/src/pages/ThreadDetail.jsx) |
| Modified | [CoLearner/src/pages/auth/AuthCallback.jsx](../CoLearner/src/pages/auth/AuthCallback.jsx) |
| Modified | [CoLearner/src/routes.jsx](../CoLearner/src/routes.jsx) |
| Modified | [CoLearner/src/services/api.js](../CoLearner/src/services/api.js) |
| Modified | [CoLearner/src/services/messages.js](../CoLearner/src/services/messages.js) |
| Modified | [CoLearner/src/services/supabase/adapter.js](../CoLearner/src/services/supabase/adapter.js) |
| Modified | [CoLearner/src/services/supabase/read-models.js](../CoLearner/src/services/supabase/read-models.js) |
| Modified | [CoLearner/src/store/authStore.js](../CoLearner/src/store/authStore.js) |
| Modified | [CoLearner/src/store/notificationStore.js](../CoLearner/src/store/notificationStore.js) |
| Modified | [README.md](../README.md) |
| Added | [supabase/SOCIAL_UX.md](SOCIAL_UX.md) |
| Added | [supabase/SOCIAL_UX_REPORT.md](SOCIAL_UX_REPORT.md) |
| Added | [supabase/VOICE_MESSAGES.md](VOICE_MESSAGES.md) |
| Added | [supabase/migrations/20260920090000_social_messages.sql](migrations/20260920090000_social_messages.sql) |
| Added | [supabase/migrations/20260920090100_social_projects.sql](migrations/20260920090100_social_projects.sql) |
| Added | [supabase/migrations/20260920090200_community_mentions.sql](migrations/20260920090200_community_mentions.sql) |
| Added | [supabase/migrations/20260920090300_community_feed.sql](migrations/20260920090300_community_feed.sql) |
| Added | [supabase/migrations/20260920090400_comment_history.sql](migrations/20260920090400_comment_history.sql) |
| Added | [supabase/migrations/20260920090500_project_feed.sql](migrations/20260920090500_project_feed.sql) |
| Added | [supabase/migrations/20260920090600_project_filter_fix.sql](migrations/20260920090600_project_filter_fix.sql) |
| Added | [supabase/migrations/20260920090700_voice_messages.sql](migrations/20260920090700_voice_messages.sql) |
| Modified | [supabase/scripts/verify-auth-links.mjs](scripts/verify-auth-links.mjs) |
| Modified | [supabase/scripts/verify-book-ui.mjs](scripts/verify-book-ui.mjs) |
| Modified | [supabase/scripts/verify-oauth.mjs](scripts/verify-oauth.mjs) |
| Added | [supabase/scripts/verify-social-ui.mjs](scripts/verify-social-ui.mjs) |
| Added | [supabase/scripts/verify-social.mjs](scripts/verify-social.mjs) |
| Added | [supabase/scripts/verify-voice-messages.mjs](scripts/verify-voice-messages.mjs) |

## Environment Variables

No new variables are required for the social features. Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` remain public frontend configuration. Service-role and OAuth secrets remain outside React and version control.

Live book generation still requires server-only `GEMINI_API_KEY` and `AI_MODEL`, as documented in [BOOK_LEARNING.md](BOOK_LEARNING.md). These were not supplied or invented. Email keeps the previously authorized Supabase test sender. TURN credentials are not configured; see [VOICE_CALLS.md](VOICE_CALLS.md) for the existing network limitation.

## Tests Performed

Verification used the linked cloud database and a local Vite instance on port 5176. Browser checks used isolated Chromium contexts and disposable users; fixture accounts, messages, images, projects and discussions were removed afterward. No real user's conversations or account credentials were used.

| Check | Result |
| --- | --- |
| Production build, ESLint and `git diff --check` | Passed; no lint warnings |
| Remote migration inventory | All eight new migrations are applied to the linked project |
| Group A: authentication | Password login, direct signup, Home navigation, reload, logout and account switching passed. Recovery/password changes, confirmation, reused-link rejection and missing-PKCE rejection passed. Google/GitHub handoffs and account-selection parameters passed; actual provider consent remains manual. |
| Recorded voice messages | Five browser/security groups passed: recording, playback, private delivery, microphone cleanup, upload retry/idempotency, persistent history and mobile layout. |
| Group B: friends/chat | Connection-gated history, Realtime text, one-image upload/view, participant-only Storage access, spoofing rejection, read receipts and rate limits passed. Existing voice suite passed 17 groups, including bidirectional WebRTC packets/audio energy and cleanup. |
| Group C: projects | Showcase creation/edit/delete, technologies/URLs, gallery upload, anonymous detail, live demo, owner acceptance/rejection, friend invitations and cancellation/duplicate/visibility authorization passed. |
| Group D: community | Feed/comments, connected mention autocomplete, recipient filtering, edit deduplication, older-comment retrieval and exact destinations passed. Desktop/mobile layouts inspected. |
| Group E: notifications | Live popup, ten-second expiry, dismissal, no repeat, center persistence/read state, sound and saved mute preference passed. |
| Group F: profiles | Learner-to-Mentor save, reload and logout/login persistence passed. Unauthorized profile/staff changes rejected. |
| Group G: learning/admin | Public catalog/search/license detail, reader resume, chapter completion, dashboard progress, assistant configuration UI, protected admin access and license-gated publishing passed. Live AI generation was not tested without credentials. |

Versioned scripts: `verify-social.mjs` (six database/security groups), `verify-social-ui.mjs` (eight integration groups), `verify-social-ui.mjs --project-only` (five groups), `verify-social-ui.mjs --auth-only` (two groups), `verify-messaging.mjs`, `verify-voice-calls.mjs`, `verify-oauth.mjs`, `verify-auth-links.mjs` and `verify-book-ui.mjs` (ten learning/admin groups).

## Verification Results

Successful assertions establish the tested flows and authorization rules, not unrestricted production-network or third-party-provider coverage. Main social browser and book/admin runs recorded no unexpected console/network errors. The admin test intentionally rejected publication without license evidence. RLS tests intentionally attempted unauthorized operations and checked their rejection.

Evidence is in ignored `.dist/` reports and screenshots; verification scripts are versioned under `supabase/scripts/`. See [SOCIAL_UX.md](SOCIAL_UX.md) for commands.

## Remaining Issues

- Two real GitHub accounts must each finish provider sign-in/consent and confirm the resulting CoLearn profile. Automated tests reach and inspect account selection, callback, state and cancellation; they do not enter another person's provider credentials.
- Live AI answers remain unverified until server generation credentials are configured. The tested assistant clearly reports this state.
- Public password-reset email delivery is limited by the retained Supabase test sender. Token verification and password changes can be tested independently; mailbox delivery is not claimed.
- Voice uses existing STUN-only WebRTC. Automated tests verify bidirectional synthetic audio in Chromium; restrictive networks need TURN, and two physical devices with microphones remain a manual check.
- Notification sounds obey browser autoplay restrictions; popups and calls require CoLearn to be open. Signed chat-image URLs remain valid until their five-minute expiry.

## Manual Testing Steps

1. Open `http://127.0.0.1:5176` in two browser profiles. Sign up/log in, return Home, refresh, and check **My Dashboard**. Explicitly log out and switch accounts. Complete GitHub sign-in for each real account and check its name, avatar and profile.
2. Connect the accounts in People. Use Dashboard's profile/message actions. Send text and one image, reopen the conversation, then call, accept, mute and hang up.
3. Mention the connection in a Community comment. Check the other account's popup, sound, ten-second expiry, dismiss button, notification center and exact-comment link. Disable sound in Settings and repeat.
4. Create an existing-project showcase; set descriptions, category, skills, links, cover and gallery. Inspect it logged out, edit it as owner and check private visibility with an unrelated account.
5. Request to join a project and accept/reject from its owner's Team tab. Invite a connected friend, cancel another invitation, and check recipient acceptance/decline and notifications.
6. Switch Learner/Mentor, save, refresh, log out/in and inspect the public profile.
7. Read and complete a chapter, reload/resume, inspect dashboard progress and open the book assistant. As staff, verify draft creation and the existing license-gated publishing workflow.
