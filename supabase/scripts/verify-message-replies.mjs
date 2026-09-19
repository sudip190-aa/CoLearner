import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  url = `https://${ref}.supabase.co`,
  tag = `reply-${Date.now()}`;
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
  options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(
    url,
    keys.find((k) => k.name === "service_role").api_key,
    options,
  ),
  guest = createClient(
    url,
    keys.find((k) => k.name === "anon").api_key,
    options,
  );
const ok = async (p) => {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const users = [],
  files = [],
  checks = [];
const pass = (s) => {
  checks.push(s);
  console.log("PASS " + s);
};
const action = (c, action, payload) =>
  c.rpc("colearn_action", { action, payload });
try {
  for (let i = 0; i < 3; i++) {
    const email = `${tag}-${i}@colearn.example`,
      password = `Verify!${randomUUID()}`;
    const { user } = await ok(
      service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${i}`,
          full_name: `Social test ${i}`,
        },
      }),
    );
    const c = createClient(
      url,
      keys.find((k) => k.name === "anon").api_key,
      options,
    );
    users.push({ user, c, email, password });
    await ok(c.auth.signInWithPassword({ email, password }));
    await ok(
      service
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id),
    );
  }
  const [a, b, c] = users,
    aid = a.user.id,
    bid = b.user.id,
    cid = c.user.id;
  await ok(
    action(a.c, "connection", { username: b.user.user_metadata.username }),
  );
  await ok(
    action(b.c, "connection", {
      username: a.user.user_metadata.username,
      action: "accept",
    }),
  );

  const original = await ok(
    a.c
      .from("direct_messages")
      .insert({
        sender_id: aid,
        recipient_id: bid,
        body: "Original private message",
      })
      .select()
      .single(),
  );
  const reply = await ok(
    b.c
      .from("direct_messages")
      .insert({
        sender_id: bid,
        recipient_id: aid,
        body: "A linked reply",
        reply_to_id: original.id,
      })
      .select()
      .single(),
  );
  assert.equal(
    (
      await ok(
        a.c.from("direct_messages").select("*").eq("id", reply.id).single(),
      )
    ).reply_to_id,
    original.id,
  );
  await ok(
    service
      .from("connections")
      .insert({ from_user_id: aid, to_user_id: cid, status: "accepted" }),
  );
  assert(
    (
      await a.c
        .from("direct_messages")
        .insert({
          sender_id: aid,
          recipient_id: cid,
          body: "Invalid cross-conversation reference",
          reply_to_id: original.id,
        })
    ).error,
  );
  assert(
    (
      await c.c
        .from("direct_messages")
        .insert({
          sender_id: cid,
          recipient_id: aid,
          body: "Outsider reference",
          reply_to_id: original.id,
        })
    ).error,
  );
  assert.equal(
    (await ok(c.c.from("direct_messages").select("*").eq("id", reply.id)))
      .length,
    0,
  );
  const before = await ok(a.c.rpc("colearn_message_contacts"));
  assert.equal(before.find((p) => p.id === bid).unread_count, 1);
  await ok(
    a.c.rpc("colearn_read_messages", {
      peer: bid,
      through_at: reply.created_at,
    }),
  );
  assert.equal(
    (await ok(a.c.rpc("colearn_message_contacts"))).find((p) => p.id === bid)
      .unread_count,
    0,
  );
  pass(
    "Private reply FK persists, read receipts count replies once, and cross-conversation references and disclosure are rejected",
  );
} finally {
  for (const { user, c } of users) {
    await c.removeAllChannels();
    await service.auth.admin.deleteUser(user.id);
  }
  writeFileSync(
    ".dist/reply-security-verification.json",
    JSON.stringify({ checks, fixturesRemoved: true }, null, 2),
  );
}
