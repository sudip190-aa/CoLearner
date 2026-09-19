# Voice calling: configuration and verification

Private and project calls use the same remote-audio playback helper and authenticated ICE configuration endpoint. Django is not involved. The linked project's `voice-ice` Edge Function and migrations `20260920110000` / `20260920111000` are deployed.

## Can we test without TURN?

Yes. No TURN credentials are currently configured. The endpoint supplies STUN, and browsers establish direct WebRTC connections when the network permits it. Separate signed-in browser accounts have exchanged real synthetic microphone audio in both directions, including all six directions in a three-person project call. Tests also check decoded audio levels and unmuted, playing output elements.

Use two or three accounts over HTTPS, accept their connection or enroll them in the same project, and start/join a call. Microphone access works on localhost; an ordinary HTTP LAN address is not a secure context. Use headphones for a physical-device test. Some guest Wi-Fi networks isolate devices even on the same network.

Direct connectivity is not guaranteed across restrictive NAT/firewalls or mobile networks. Those networks need TURN. The app reports bounded connection failures and keeps text chat available. Automated Chromium tests are not a claim of human listening on separate physical devices.

## Quick hackathon option: Cloudflare Realtime TURN

Cloudflare documents a free allowance of 1,000 GB, with paid usage beyond it. This makes its managed TURN service a practical hackathon option. It still requires your own Cloudflare account and TURN key; no account, billing agreement, or shared public credentials have been created for you. See [Cloudflare pricing](https://developers.cloudflare.com/realtime/turn/faq/).

Open the dashboard linked from [Create a TURN key](https://developers.cloudflare.com/realtime/turn/generate-credentials/). Create a TURN key and obtain its **key ID** and associated **TURN key API token**. These are server credentials, not the ephemeral username/password returned to a browser.

Only when you have these values, create the Git-ignored repository-root `.env.turn`:

```dotenv
CLOUDFLARE_TURN_KEY_ID=your_turn_key_id
CLOUDFLARE_TURN_API_TOKEN=your_turn_key_api_token
```

Install them in the linked Supabase project's Edge Function secrets:

```powershell
supabase secrets set --env-file .env.turn --project-ref ghjdpcvnzclfvyosfhoz
```

No frontend variable or rebuild is required. Do not use `VITE_` prefixes. The deployed function obtains a ten-minute credential from Cloudflare for an authorized caller. Active calls refresh configuration before expiry. Set a usage/billing alert in the provider account.

## Provider-independent alternative: coturn REST authentication

Use a coturn-compatible server supporting expiring HMAC credentials. Obtain the server endpoints and shared authentication secret from its operator, or set up your own coturn server with REST authentication (`use-auth-secret`, `static-auth-secret`, a realm, and working public relay ports/TLS). Software is free; hosting and bandwidth may cost money.

Configure **these instead of the Cloudflare pair**:

```dotenv
TURN_URLS=turn:relay.example.com:3478?transport=udp,turn:relay.example.com:3478?transport=tcp,turns:relay.example.com:5349?transport=tcp
TURN_SHARED_SECRET=the_server_rest_authentication_secret
```

Use the same `supabase secrets set` command. The function creates a user-bound expiring username and HMAC-SHA1 credential. Static username/password providers are not used directly: their long-lived passwords must not be shipped to the frontend. Another provider's credential API can be added in `_shared/turn.ts` without changing the React call implementation.

Browsers use normal ICE selection (`all`), so direct candidates remain available and relay candidates provide a fallback. The app does not force all calls through TURN. Only the short-lived credentials necessary for WebRTC reach the browser. Requests require a valid user and current call/project authorization, have a per-user database rate limit, and return `Cache-Control: no-store`.

## Background ringing

In Settings, select **Enable browser call alerts** and allow browser notifications. CoLearn must remain open. An unfocused tab can show an incoming voice-call notification with the caller's name and Answer/Decline actions where supported. The in-app dialog remains available if notifications are denied or unsupported.

The ringtone requires prior interaction/audio permission and follows the saved sound preference. A browser lock allows one tab to ring for a call. Answer, decline, cancellation, expiry and logout stop the sound and close the notification. Ordinary notification sounds are suppressed during private calls. The service worker handles notification actions only; it stores no credentials and does not cache the application.

Closed browsers, suspended mobile tabs, operating-system notification suppression, lock-screen behavior and native telephone integration are not covered by this implementation. It is not Web Push or CallKit. Native notification button appearance and microphone permission behavior vary by platform.

## Before production

1. Configure one TURN option above. None is configured yet.
2. On the final HTTPS deployment, test two physical devices on different networks, then three enrolled project members. Confirm sound in every direction, mute/unmute, disconnect/rejoin and membership removal.
3. Verify a selected `relay` candidate in WebRTC diagnostics on a restrictive network; in a controlled test, force relay through the browser test harness. Keep the application's default direct/relay selection unchanged.
4. Test a call longer than ten minutes to confirm provider credential renewal, and test background notifications/ringtone on the browsers and phones you will support.
5. Configure the production domain/OAuth redirect allowlist and any remaining SMTP/AI credentials described in [DEPLOYMENT.md](DEPLOYMENT.md).

No relay allocation or cross-network physical-device test is claimed while provider credentials are absent.
