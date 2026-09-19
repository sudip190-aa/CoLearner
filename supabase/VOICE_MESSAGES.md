# Recorded voice messages

Open Messages, select a connected person, and press the microphone beside the message box. Allow microphone access, record, then press Stop. Listen to the preview or discard it; Send posts the recording with an optional text caption. The phone button in the conversation header still starts a live call.

Recordings stop automatically at two minutes and are limited to 5 MB. Recording uses the browser's supported WebM/Opus, Ogg/Opus or MP4 format. Playback offers play/pause, seeking, elapsed time and 1×/1.5×/2× speed. Starting another clip pauses the current one. Microphone tracks stop on Stop, Cancel, navigation, logout or an incoming/active call. Cancelling an outstanding permission request also stops any stream granted afterward.

The existing `direct_messages` table stores `audio_path` and `audio_duration_ms`. A message can contain one image or one recording, with optional text. The private `chat-audio` bucket binds each file to sender, recipient and message UUID. Accepted connections are required to upload/send; a recipient can only request playback after the message exists. Outsiders and anonymous users cannot access recordings. Clients cannot change sent messages or delete their committed audio. Unsent uploaded drafts can be discarded. Signed playback URLs expire after five minutes and can be refreshed with Reload audio.

The existing inbox, message history, read receipts, rate limits, Realtime delivery and notification center are reused. Inbox previews say “Voice message”; central notifications say “Sent a voice message.” Upload retries preserve the preview and message ID, avoiding duplicate messages after a lost response. No Edge Function, transcription service or new credentials are required.

Migration `20260920090700_voice_messages.sql` is applied to the linked COlearn project. It adds columns/constraints, the private bucket, participant RLS, path validation and updated notification/contact previews. Duration metadata is bounded by PostgreSQL; the browser enforces elapsed recording time. There is no server-side transcoding or audio-content inspection.

## Verification

```powershell
node supabase/scripts/verify-voice-messages.mjs
npm --prefix CoLearner run lint
npm --prefix CoLearner run build
```

The browser test expects the local Vite app on port 5176 and isolated Chromium CDP on 9224 with the fake microphone flags described in [VOICE_CALLS.md](VOICE_CALLS.md). It creates and removes disposable users/audio, records with the real MediaRecorder, and checks:

- Recording, preview, microphone release, upload, recipient Realtime delivery and playable audio with speed control.
- Private Storage/RLS, uncommitted files, unauthorized recipients, spoofed message paths and protection of sent recordings.
- Cancellation, discard, denied microphone permission and cancellation before permission resolves.
- An injected upload failure, retained draft, successful retry and idempotent duplicate handling.
- Navigation cleanup, persistent history and the 390-pixel mobile layout.

The suite passed all five groups; lint and production build passed. Only the deliberately injected HTTP 500 and duplicate-retry HTTP 409 occurred. Evidence and screenshots are in ignored `.dist/voice-message-verification.json`, `.dist/voice-message-desktop.png` and `.dist/voice-message-mobile.png`.

Playback was verified using Chromium's synthetic microphone, not a human listening test on physical devices. Safari/Firefox and physical-phone interoperability remain manual checks. Recording needs browser microphone permission and HTTPS or localhost, as described in the [MediaRecorder documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).
