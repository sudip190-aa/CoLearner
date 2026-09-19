# Dashboard and direct messaging

The dashboard uses Today, Projects and Activity views to keep the initial screen focused. Project search, status, ordering and activity-date filters are stored in the URL. Assigned-task filters highlight overdue and high-priority work. The 15/25/50-minute focus timer stores a deadline per user in local browser storage and survives refresh; it does not manufacture XP or learning activity.

Connected people appear in the dashboard's Your circle panel, the `/messages` inbox and the navbar unread badge. Accepted connections also have a Message action in People.

## Messaging implementation

- `20260919091300_direct_messages.sql` adds private messages, indexes, RPCs, RLS and the Realtime publication; `20260919091400_message_body_limit.sql` bounds the full message payload. Both are applied to linked project `ghjdpcvnzclfvyosfhoz`.
- A sender must be active and have an accepted connection to an active recipient. Pending, removed and blocked connections cannot send.
- Only the sender and recipient can read a message. There is no staff-role bypass. Historical messages remain readable to the participants after disconnecting; the inbox only lists current accepted connections.
- Clients cannot edit/delete message text or forge send/read timestamps. The recipient-only read RPC uses the database clock. Messages have a 4,000-character limit including whitespace, must contain non-whitespace text, and the database enforces 30 sends per minute per sender.
- Realtime invalidates the inbox/history caches. Periodic refresh and reconnect refresh recover missed events. Read receipts require the conversation to be visible and scrolled to the latest messages.
- Message history uses 50-row cursor pages, ordered by timestamp and UUID. Text is rendered as text, never HTML. Send retries reuse a UUID to avoid duplicate delivery if a response is lost.
- Drafts remain in page memory when switching conversations; leaving the messaging page clears them. No attachments, typing/online indicators or end-to-end encryption are claimed.

## Verification

`node supabase/scripts/verify-messaging.mjs` exercises connection gating, participant-only reads, staff/outsider isolation, sender spoofing, immutable message contents/timestamps, input limits, read receipts, rate limiting, inactive users and Realtime delivery using disposable accounts.

`node supabase/scripts/verify-dashboard-messages.mjs` exercises the actual frontend through Chromium CDP on port 9223 and Vite on 5176: dashboard data, project/task filters, focus-timer persistence, real two-user messaging, safe text rendering, live read receipts, mobile navigation and responsive screenshots. It checks console/network errors and removes fixtures in `finally`.

Reports and screenshots are under ignored `.dist/`; no credentials are committed. Frontend validation: `npm run lint` and `npm run build` from `CoLearner`.
