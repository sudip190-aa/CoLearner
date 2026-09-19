import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  url = `https://${ref}.supabase.co`,
  tag = `social-${Date.now()}`;
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

  const counts = async (client) => ok(client.rpc("colearn_navigation_counts"));
  assert.deepEqual(await counts(b.c), {
    messages: 0,
    projects: 0,
    people: 0,
    community: 0,
  });
  await ok(
    action(c.c, "connection", { username: b.user.user_metadata.username }),
  );
  await ok(
    action(c.c, "connection", { username: b.user.user_metadata.username }),
  );
  assert.equal((await counts(b.c)).people, 1);
  assert.equal((await counts(a.c)).people, 0);
  assert.equal(
    (
      await ok(
        service
          .from("notifications")
          .select("id")
          .eq("user_id", bid)
          .eq("actor_id", cid)
          .eq("verb", "connection_request"),
      )
    ).length,
    1,
  );
  await ok(
    action(b.c, "connection", {
      username: c.user.user_metadata.username,
      action: "cancel",
    }),
  );
  assert.equal((await counts(b.c)).people, 0);
  assert(
    (
      await ok(
        service
          .from("notifications")
          .select("is_read")
          .eq("user_id", bid)
          .eq("actor_id", cid)
          .eq("verb", "connection_request"),
      )
    ).every((n) => n.is_read),
  );
  pass(
    "Incoming request count, recipient isolation, duplicate suppression and resolved notification state",
  );
  const project = await ok(
    a.c
      .from("projects")
      .insert({
        owner_id: aid,
        title: "Counters project",
        slug: tag,
        description: "A private test project",
        is_public: true,
        max_members: 5,
      })
      .select()
      .single(),
  );
  await ok(
    action(a.c, "invite", {
      slug: project.slug,
      username: b.user.user_metadata.username,
    }),
  );
  assert.equal((await counts(b.c)).projects, 1);
  assert.equal((await counts(c.c)).projects, 0);
  await ok(action(b.c, "join", { slug: project.slug }));
  assert.equal((await counts(b.c)).projects, 0);
  await ok(action(c.c, "join", { slug: project.slug }));
  assert.equal((await counts(a.c)).projects, 1);
  const request = await ok(
    service
      .from("join_requests")
      .select("id")
      .eq("project_id", project.id)
      .eq("user_id", cid)
      .single(),
  );
  await ok(action(a.c, "respond", { id: request.id, status: "rejected" }));
  assert.equal((await counts(a.c)).projects, 0);
  pass(
    "Invitation and owner join-request counts resolve with acceptance/rejection",
  );
  const direct = await ok(
    a.c
      .from("direct_messages")
      .insert({
        sender_id: aid,
        recipient_id: bid,
        body: "Unread private message",
      })
      .select()
      .single(),
  );
  const group = await ok(
    a.c
      .from("project_messages")
      .insert({
        project_id: project.id,
        sender_id: aid,
        body: "Unread team message",
      })
      .select()
      .single(),
  );
  assert.equal((await counts(b.c)).messages, 2);
  assert.equal((await counts(c.c)).messages, 0);
  await ok(
    b.c.rpc("colearn_read_messages", {
      peer: aid,
      through_at: direct.created_at,
    }),
  );
  assert.equal((await counts(b.c)).messages, 1);
  await ok(
    b.c.rpc("colearn_read_project", {
      project: project.id,
      through_id: group.id,
    }),
  );
  assert.equal((await counts(b.c)).messages, 0);
  assert(
    (
      await ok(
        service
          .from("notifications")
          .select("is_read")
          .eq("user_id", bid)
          .in("verb", ["direct_message", "project_message"]),
      )
    ).every((n) => n.is_read),
  );
  assert((await guest.rpc("colearn_navigation_counts")).error);
  pass(
    "Direct and group unreads count once, clear on read and synchronize central notifications",
  );

  const thread = await ok(
    a.c
      .from("threads")
      .insert({
        author_id: aid,
        title: "Mentioned discussion",
        slug: tag,
        body: `Hello @${b.user.user_metadata.username} and @${c.user.user_metadata.username}`,
        category: "community",
      })
      .select()
      .single(),
  );
  const comment = await ok(
    a.c
      .from("comments")
      .insert({
        thread_id: thread.id,
        author_id: aid,
        body: `A specific idea for @${b.user.user_metadata.username}`,
      })
      .select()
      .single(),
  );
  assert.equal((await counts(b.c)).community, 2);
  assert.equal((await counts(c.c)).community, 0);
  await ok(
    a.c
      .from("threads")
      .update({ body: `Again @${b.user.user_metadata.username}` })
      .eq("id", thread.id),
  );
  assert.equal((await counts(b.c)).community, 2);
  await ok(
    c.c.rpc("colearn_read_mentions", {
      discussion: thread.id,
      post_seen: true,
      comment_ids: [comment.id],
    }),
  );
  assert.equal((await counts(b.c)).community, 2);
  await ok(
    b.c.rpc("colearn_read_mentions", {
      discussion: thread.id,
      post_seen: true,
    }),
  );
  assert.equal((await counts(b.c)).community, 1);
  await ok(
    b.c.rpc("colearn_read_mentions", {
      discussion: thread.id,
      comment_ids: [comment.id],
    }),
  );
  assert.equal((await counts(b.c)).community, 0);
  pass(
    "Post/comment mentions notify accepted connections once and only the recipient can clear each mention",
  );
} finally {
  for (const { user, c } of users) {
    await c.removeAllChannels();
    await ok(service.auth.admin.deleteUser(user.id));
  }
  writeFileSync(
    ".dist/navigation-verification.json",
    JSON.stringify({ checks, fixturesRemoved: true }, null, 2),
  );
}
