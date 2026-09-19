import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  url = `https://${ref}.supabase.co`,
  tag = `group-chat-${Date.now()}`;
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

  const project = await ok(
    a.c
      .from("projects")
      .insert({
        slug: tag,
        title: "Private group verification",
        owner_id: aid,
        is_public: false,
        status: "active",
      })
      .select()
      .single(),
  );
  await ok(
    service
      .from("project_members")
      .insert({ project_id: project.id, user_id: bid }),
  );
  const message = await ok(
    a.c
      .from("project_messages")
      .insert({
        project_id: project.id,
        sender_id: aid,
        body: "Team discussion",
      })
      .select()
      .single(),
  );
  const reply = await ok(
    b.c
      .from("project_messages")
      .insert({
        project_id: project.id,
        sender_id: bid,
        body: "Reply to the discussion",
        reply_to_id: message.id,
      })
      .select()
      .single(),
  );
  assert.equal(
    (
      await ok(
        a.c
          .from("project_messages")
          .select("reply_to_id")
          .eq("id", reply.id)
          .single(),
      )
    ).reply_to_id,
    message.id,
  );
  assert.equal(
    (
      await ok(
        c.c.from("project_messages").select("*").eq("project_id", project.id),
      )
    ).length,
    0,
  );
  assert(
    (
      await c.c.from("project_messages").insert({
        project_id: project.id,
        sender_id: cid,
        body: "Unauthorized",
      })
    ).error,
  );
  assert(
    (
      await b.c
        .from("project_messages")
        .insert({ project_id: project.id, sender_id: aid, body: "Spoof" })
    ).error,
  );
  const other = await ok(
    a.c
      .from("projects")
      .insert({
        slug: tag + "-other",
        title: "Other conversation",
        owner_id: aid,
      })
      .select()
      .single(),
  );
  assert(
    (
      await a.c.from("project_messages").insert({
        project_id: other.id,
        sender_id: aid,
        body: "Cross-project reply",
        reply_to_id: message.id,
      })
    ).error,
  );
  assert.equal(
    (await ok(b.c.rpc("colearn_project_inbox"))).find(
      (p) => p.id === project.id,
    ).unread_count,
    1,
  );
  await ok(
    b.c.rpc("colearn_read_project", {
      project: project.id,
      through_id: reply.id,
    }),
  );
  assert.equal(
    (await ok(b.c.rpc("colearn_project_inbox"))).find(
      (p) => p.id === project.id,
    ).unread_count,
    0,
  );
  assert.equal(
    (
      await ok(
        c.c.from("notifications").select("*").eq("verb", "project_message"),
      )
    ).length,
    0,
  );
  pass(
    "Project chat persists replies, keeps unread counts, sends only member notifications and rejects outsiders, spoofing and cross-project replies",
  );
  const devices = [randomUUID(), randomUUID(), randomUUID()],
    sessions = [randomUUID(), randomUUID(), randomUUID()];
  const call = (user, index, operation) =>
    user.c.rpc("colearn_project_voice", {
      project: project.id,
      operation,
      device: devices[index],
      session: sessions[index],
    });
  await ok(call(a, 0, "join"));
  const invitations = await ok(
    service
      .from("notifications")
      .select("user_id")
      .eq("verb", "project_call")
      .eq("target_id", String(project.id)),
  );
  assert.deepEqual(
    invitations.map((n) => n.user_id),
    [bid],
  );
  assert(
    !(await b.c.rpc("colearn_voice_ice_access", { project_id: project.id }))
      .error,
  );
  assert(
    (await c.c.rpc("colearn_voice_ice_access", { project_id: project.id }))
      .error,
  );

  await ok(call(b, 1, "join"));
  assert((await call(c, 2, "join")).error);
  assert(
    (
      await a.c.rpc("colearn_start_call", {
        peer: bid,
        device_id: randomUUID(),
      })
    ).error,
  );
  const payload = {
    project_id: project.id,
    sender_id: aid,
    recipient_id: bid,
    from_session: sessions[0],
    to_session: sessions[1],
    payload: { type: "ice", candidate: { candidate: "test" } },
  };
  await ok(a.c.from("project_voice_signals").insert(payload));
  assert.equal(
    (
      await ok(
        b.c
          .from("project_voice_signals")
          .select("*")
          .eq("project_id", project.id),
      )
    ).length,
    1,
  );
  assert.equal(
    (
      await ok(
        c.c
          .from("project_voice_signals")
          .select("*")
          .eq("project_id", project.id),
      )
    ).length,
    0,
  );
  assert((await b.c.from("project_voice_signals").insert(payload)).error);
  await ok(
    service
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", bid),
  );
  assert.equal(
    (
      await ok(
        b.c.from("project_messages").select("*").eq("project_id", project.id),
      )
    ).length,
    0,
  );
  assert((await call(b, 1, "heartbeat")).error);
  assert(
    (await b.c.rpc("colearn_voice_ice_access", { project_id: project.id }))
      .error,
  );

  assert((await a.c.from("project_voice_signals").insert(payload)).error);
  await ok(call(a, 0, "leave"));
  pass(
    "Group voice leases, participant-only signals, private-call exclusion and membership revocation are enforced in PostgreSQL",
  );
} finally {
  for (const { user, c } of users) {
    await c.removeAllChannels();
    await service.auth.admin.deleteUser(user.id);
  }
  writeFileSync(
    ".dist/group-security-verification.json",
    JSON.stringify({ checks, fixturesRemoved: true }, null, 2),
  );
}
