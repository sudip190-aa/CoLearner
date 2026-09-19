# CoLearn voice calls

Voice calls are integrated into the existing Messages conversation header. They reuse Supabase Auth, profiles, avatars, accepted connections, and the existing blue/yellow UI. Incoming calls appear anywhere in the signed-in app. Text chat remains usable during a call.

## Implementation

- `CoLearner/src/services/voiceCalls.js`: WebRTC audio, private signaling, permission errors, candidate ordering, offer/answer retries, heartbeats, timeouts, mute, and cleanup.
- `CoLearner/src/components/calls/VoiceCallProvider.jsx`: app-wide lifecycle, incoming Accept/Decline dialog, call state/duration/mute/end panel, autoplay fallback and accessible status messages.
- `CoLearner/src/App.jsx`: mounts the provider around the existing router.
- `CoLearner/src/pages/Messages.jsx`: call button in the existing connected-user conversation header.
- `supabase/migrations/20260919091600_voice_calls.sql`: coordination metadata, authorization, single-call arbitration and Realtime policies.
- `supabase/migrations/20260919091700_voice_call_concurrency.sql`: consistent locking for heartbeat/allocation races and accepted-connection revocation.
- `supabase/scripts/verify-voice-calls.mjs`: live authorization and two-browser end-to-end verification with disposable accounts.

The authenticated `voice-ice` Edge Function supplies STUN and optional short-lived TURN credentials. No new frontend package is required. Django is not involved. See [VOICE_SETUP.md](VOICE_SETUP.md) for the current configuration and background-call behavior.

## Signaling and authorization

1. The caller grants microphone access. `colearn_start_call` derives the caller from `auth.uid()` and checks the existing `app.can_message(peer)` accepted-connection rule. Ordered transaction locks on both users prevent simultaneous calls, including cross-calls and calls from other tabs. Initiation is limited to five calls per caller per minute.
2. A `voice_calls` record contains only participant/device IDs, state and timestamps. Participant-only RLS and Supabase Postgres Changes deliver the invitation and accept/decline/end transitions. Five-second polling recovers missed notifications. There are no client insert/update/delete grants; state changes go through validated RPCs.
3. Each call has two **private** Broadcast topics: `voice:<call UUID>:<sender UUID>`. Both participants may receive; only the authenticated user matching the topic's sender may send. The peer identity comes from the authorized topic, never a supplied payload sender. Unrelated users cannot join. Public topics cannot deliver to these private subscriptions.
4. The caller creates an SDP offer. The receiver atomically claims the call for its page/device after microphone permission, joins the channels and sends readiness. The offer, answer and trickled ICE candidates travel only through Realtime Broadcast. Repeated offers/answers carry gathered candidates and recover messages sent before the receiver subscribed. Candidate application is serialized and queued until a remote description exists.
5. Browser WebRTC transports encrypted audio directly between peers. Supabase stores **no audio, recordings, SDP or ICE**. Its database only coordinates the call.
6. Every ten seconds, the owning pages refresh their leases. Ringing expires after 45 seconds; an abandoned accepted call becomes inactive after 45 seconds without either participant's heartbeat. Expired records no longer block a new call even if a page crashed. Acceptance and subsequent updates enforce page/device ownership. A removed or blocked connection ends its calls through a database trigger.
7. Hang-up sends the authoritative database transition plus a best-effort Broadcast end event, stops microphone tracks, closes the peer connection, clears timers/audio and removes both call-specific channels. The app-wide invitation listener remains ready for the next call. Refresh, leaving the website and sign-out perform the same cleanup, with a keepalive request and lease-expiry fallback. Navigation **within CoLearn** intentionally keeps the call and controls available.

Realtime caches channel authorization at join. Fresh call UUIDs are used for every session. Connection revocation updates the authoritative call state, and clients close old subscriptions; no channel is reused for a later call.

## Test on two PCs

1. Open the same CoLearn deployment over **HTTPS** in current Chrome, Edge or Firefox on each PC. `http://localhost` works for development on that machine; ordinary `http://192.168...` LAN addresses do not provide the secure context required for microphone access. Use an HTTPS development URL when sharing a local Vite instance.
2. Sign in with two different accounts and accept their connection request in People.
3. On PC A, open Messages, select PC B's account and click the phone icon. Allow microphone access.
4. Keep CoLearn open on PC B; click Accept and allow microphone access. The panel should say Connected and show a duration. Speak from each PC and use headphones to avoid feedback.
5. Test Mute/Unmute, End call from each side, Decline, refreshing and leaving the page. Text messages should still send and arrive. A third unconnected account should have no call button for either person and cannot bypass the server check.
6. If a browser blocks playback, use the **Enable call audio** button. If microphone access was denied, enable it in browser site permissions and call again.

## Automated verification

Run Vite on `http://127.0.0.1:5176` and a separate Chromium profile with remote debugging on port `9224`, then run from the repository root:

```text
node supabase/scripts/create-test-audio.mjs
# Start Chromium with the flags below, then:
node supabase/scripts/verify-voice-calls.mjs
```

Browser flags used by the test:

```text
--headless=new --remote-debugging-port=9224
--user-data-dir=<separate disposable testing directory>
--use-fake-device-for-media-stream --use-fake-ui-for-media-stream
--use-file-for-fake-audio-capture=<absolute path to .dist/voice-test.wav>
--autoplay-policy=no-user-gesture-required
```

The test obtains the linked project's keys through the authenticated Supabase CLI, keeps credentials in memory, creates temporary accounts, and deletes them with cascading test data cleanup. It uses distinct browser contexts for Alice and Bob, the real application UI, real WebRTC peer connections and real Supabase authorization. Received RTP packets and nonzero `totalAudioEnergy` verify audio transport in both directions using the deterministic synthetic microphone fixture; this is not a claim of human listening on two physical PCs. Permission/no-device errors are deliberately injected to verify their UI paths. Evidence and screenshots are written under ignored `.dist/`; no production credentials are saved.

Verified on 2026-09-19 against linked project `ghjdpcvnzclfvyosfhoz`: 17 check groups passed, including private-channel authorization, impersonation denial, concurrent calls/heartbeats, receiver device ownership, lease expiry, connection revocation, bidirectional audio, mobile layouts, mute/unmute, either-party hang-up, decline, microphone/browser errors, refresh/leaving cleanup, late permission cancellation, and existing text delivery. No unexpected console or network errors occurred; the deliberately rejected overlapping-call request returned the expected HTTP 400. All disposable accounts and their data were removed. Production build and targeted ESLint checks also passed; both migrations are applied remotely.

## Current network and browser behavior

- Private and project calls use STUN by default, with optional server-issued TURN credentials. Direct audio, three-user group audio, decoded output, retries, rejoin and authorization have been checked with separate Chromium accounts. TURN allocation and physical cross-network listening still require a configured relay and real devices.
- Remote tracks are attached even when `RTCTrackEvent.streams` is empty. Native media playback produces the audio; Web Audio measures decoded levels. Blocked playback exposes an explicit enable-audio control instead of claiming success.
- Private calls retry ICE negotiation after a temporary disconnect. Project signaling replays a bounded window and retries unsent messages; signal IDs are not treated as commit order. Membership revocation, microphone loss, page exit and bounded timeouts clean up resources.
- Project calls remain a small audio mesh capped at eight members. Starting an empty project call notifies enrolled teammates, with a cooldown against join/leave spam. No audio is recorded.
- Incoming private calls support one ringtone across tabs and opt-in browser notifications with action handling. An open, running app is required; frozen/closed browsers do not have a push-call service.

The exact provider variables, credential source, free-tier option, test limitations and production checks are documented in [VOICE_SETUP.md](VOICE_SETUP.md).

References: [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization), [WebRTC peer connections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection), [microphone security requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
