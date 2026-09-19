import { iceConfiguration } from "./turn.ts";
const assert = (condition: unknown) => {
  if (!condition) throw new Error("Assertion failed");
};
Deno.test(
  "Unconfigured calling keeps direct STUN connectivity without secrets",
  async () => {
    const config = await iceConfiguration("alice", () => undefined);
    assert(
      !config.relayAvailable &&
        config.iceServers.every((s: { urls: string[] }) =>
          s.urls.every((u) => u.startsWith("stun:")),
        ),
    );
  },
);
Deno.test(
  "Coturn issues a short-lived user-bound HMAC credential, never the shared secret",
  async () => {
    const env: Record<string, string> = {
      TURN_URLS:
        "turn:relay.example:3478?transport=udp,turns:relay.example:5349?transport=tcp",
      TURN_SHARED_SECRET: "test-server-only-secret",
    };
    const config = await iceConfiguration("alice", (key) => env[key]);
    const server = config.iceServers[1];
    assert(config.relayAvailable && server.username.endsWith(":alice"));
    assert(Number(server.username.split(":")[0]) > Date.now() / 1000 + 590);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.TURN_SHARED_SECRET),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["verify"],
    );
    const signature = Uint8Array.from(atob(server.credential), (ch) =>
      ch.charCodeAt(0),
    );
    assert(
      await crypto.subtle.verify(
        "HMAC",
        key,
        signature,
        new TextEncoder().encode(server.username),
      ),
    );
    assert(!JSON.stringify(config).includes(env.TURN_SHARED_SECRET));
  },
);
Deno.test(
  "Managed TURN sends the API token only to the provider and returns ephemeral ICE",
  async () => {
    const env: Record<string, string> = {
      CLOUDFLARE_TURN_KEY_ID: "test-key",
      CLOUDFLARE_TURN_API_TOKEN: "server-only-token",
    };
    const request: typeof fetch = async (url, options) => {
      assert(
        String(url) ===
          "https://rtc.live.cloudflare.com/v1/turn/keys/test-key/credentials/generate-ice-servers",
      );
      assert(
        new Headers(options?.headers).get("Authorization") ===
          "Bearer server-only-token",
      );
      assert(JSON.parse(String(options?.body)).ttl === 600);
      return Response.json({
        iceServers: [
          {
            urls: ["turn:relay.example:3478"],
            username: "ephemeral-user",
            credential: "ephemeral-password",
          },
        ],
      });
    };
    const config = await iceConfiguration("alice", (key) => env[key], request);
    assert(
      config.relayAvailable &&
        !JSON.stringify(config).includes("server-only-token"),
    );
  },
);
Deno.test(
  "Incomplete or failed provider configuration fails clearly rather than claiming relay support",
  async () => {
    for (const env of [
      { TURN_URLS: "turn:relay.example" },
      { TURN_SHARED_SECRET: "test" },
      { CLOUDFLARE_TURN_KEY_ID: "test" },
    ]) {
      let rejected = false;
      try {
        await iceConfiguration("alice", (key) => env[key as keyof typeof env]);
      } catch {
        rejected = true;
      }
      assert(rejected);
    }
    let rejected = false;
    try {
      await iceConfiguration(
        "alice",
        (key) =>
          ({
            CLOUDFLARE_TURN_KEY_ID: "test",
            CLOUDFLARE_TURN_API_TOKEN: "secret",
          })[key],
        async () => new Response("unavailable", { status: 503 }),
      );
    } catch {
      rejected = true;
    }
    assert(rejected);
  },
);
