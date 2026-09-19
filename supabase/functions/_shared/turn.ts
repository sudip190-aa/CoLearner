export const stun = {
  urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
};
type Env = (name: string) => string | undefined;
export async function iceConfiguration(
  userId: string,
  env: Env,
  request = fetch,
) {
  const ttl = 600;
  const keyId = env("CLOUDFLARE_TURN_KEY_ID"),
    token = env("CLOUDFLARE_TURN_API_TOKEN");
  const urls = env("TURN_URLS"),
    secret = env("TURN_SHARED_SECRET");
  if (keyId || token) {
    if (!keyId || !token || !/^[a-zA-Z0-9_-]+$/.test(keyId))
      throw new Error("Incomplete relay configuration");
    const response = await request(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error("Relay provider is unavailable");
    const data = await response.json();
    if (
      !Array.isArray(data.iceServers) ||
      !data.iceServers.some((server: { urls?: string | string[] }) =>
        [server.urls].flat().some((url) => /^turns?:/.test(url || "")),
      )
    )
      throw new Error("Relay provider returned no relay");
    return {
      iceServers: data.iceServers,
      relayAvailable: true,
      expiresIn: ttl,
    };
  }
  if (urls || secret) {
    const servers = (urls || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    if (
      !secret ||
      !servers.length ||
      servers.some(
        (url) =>
          !/^turns?:[^\s/@]+(?::\d+)?(?:\?transport=(?:tcp|udp))?$/.test(url),
      )
    )
      throw new Error("Incomplete relay configuration");
    const username = `${Math.floor(Date.now() / 1000) + ttl}:${userId}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const bytes = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(username)),
    );
    const credential = btoa(String.fromCharCode(...bytes));
    return {
      iceServers: [stun, { urls: servers, username, credential }],
      relayAvailable: true,
      expiresIn: ttl,
    };
  }
  return { iceServers: [stun], relayAvailable: false, expiresIn: ttl };
}
