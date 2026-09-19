// Disposable live authorization fixtures. Never print API keys or credentials.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  url = `https://${ref}.supabase.co`;
const raw = JSON.parse(
  execFileSync(
    "supabase.cmd",
    [
      "projects",
      "api-keys",
      "--project-ref",
      ref,
      "--reveal",
      "--output",
      "json",
    ],
    { shell: true, encoding: "utf8" },
  ),
);
const keys = Array.isArray(raw) ? raw : raw.api_keys || raw.keys,
  anon = keys.find((k) => k.name === "anon").api_key;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(
  url,
  keys.find((k) => k.name === "service_role").api_key,
  options,
);
const ok = async (q) => {
  const { data, error } = await q;
  if (error) throw error;
  return data;
};
const users = [],
  clients = [],
  tokens = [];
const request = (token, scope) =>
  fetch(`${url}/functions/v1/voice-ice`, {
    method: "POST",
    headers: {
      apikey: anon,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(scope),
  });
try {
  for (let i = 0; i < 3; i++) {
    const email = `ice-${Date.now()}-${i}@colearn.example`,
      password = `Test!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({ email, password, email_confirm: true }),
    );
    users.push(user);
    const client = createClient(url, anon, options);
    clients.push(client);
    tokens.push(
      (await ok(client.auth.signInWithPassword({ email, password }))).session
        .access_token,
    );
  }
  assert.equal((await request(null, { callId: randomUUID() })).status, 401);
  assert.equal((await request(tokens[0], null)).status, 400);
  assert.equal((await request(tokens[0], {})).status, 400);
  assert.equal(
    (await request(tokens[0], { callId: randomUUID() })).status,
    403,
  );
  await ok(
    admin
      .from("connections")
      .insert({
        from_user_id: users[0].id,
        to_user_id: users[1].id,
        status: "accepted",
      }),
  );
  const call = await ok(
    clients[0].rpc("colearn_start_call", {
      peer: users[1].id,
      device_id: randomUUID(),
    }),
  );
  for (const token of tokens.slice(0, 2)) {
    const response = await request(token, { callId: call.id });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const config = await response.json();
    assert(config.iceServers.length);
    // Current project intentionally has no relay account. No shared public secrets.
    if (!config.relayAvailable)
      assert(
        config.iceServers.every((s) =>
          [s.urls].flat().every((u) => u.startsWith("stun:")),
        ),
      );
  }
  assert.equal((await request(tokens[2], { callId: call.id })).status, 403);
  const quota = await Promise.all(
    Array.from({ length: 32 }, () =>
      clients[0].rpc("colearn_voice_ice_access", { call_id: call.id }),
    ),
  );
  assert(
    quota.some((r) => r.error?.code === "P0001") &&
      quota.filter((r) => !r.error).length <= 29,
  );
  assert.equal((await request(tokens[0], { callId: call.id })).status, 429);

  await ok(
    admin
      .from("connections")
      .update({ status: "blocked" })
      .eq("from_user_id", users[0].id)
      .eq("to_user_id", users[1].id),
  );
  assert.equal((await request(tokens[0], { callId: call.id })).status, 403);
  console.log(
    "PASS Authenticated participants only; malformed, anonymous, outsider and revoked requests denied; no-store direct/relay configuration",
  );
} finally {
  for (const user of users) await ok(admin.auth.admin.deleteUser(user.id));
}
