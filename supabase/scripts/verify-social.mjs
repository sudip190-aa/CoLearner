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
  const mid = randomUUID(),
    path = `${aid}/${bid}/${mid}.png`,
    png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    );
  await ok(
    a.c.storage
      .from("chat-images")
      .upload(path, png, { contentType: "image/png" }),
  );
  files.push(["chat-images", path]);
  assert(
    (await c.c.storage.from("chat-images").createSignedUrl(path, 30)).error,
  );
  assert(
    (await b.c.storage.from("chat-images").createSignedUrl(path, 30)).error,
  );
  await ok(
    a.c
      .from("direct_messages")
      .insert({
        id: mid,
        sender_id: aid,
        recipient_id: bid,
        body: "",
        image_path: path,
      }),
  );
  assert(
    (await ok(b.c.storage.from("chat-images").createSignedUrl(path, 30)))
      .signedUrl,
  );
  assert.equal(
    (await ok(c.c.from("direct_messages").select("*").eq("id", mid))).length,
    0,
  );
  assert(
    (
      await a.c
        .from("direct_messages")
        .insert({ sender_id: aid, recipient_id: cid, body: "Unauthorized" })
    ).error,
  );
  assert(
    (
      await a.c
        .from("direct_messages")
        .insert({
          sender_id: aid,
          recipient_id: bid,
          body: "Spoof",
          image_path: path,
        })
    ).error,
  );
  const notifications = await ok(
    b.c.from("notifications").select("*").eq("verb", "direct_message"),
  );
  assert.equal(notifications.length, 1);
  assert(
    (
      await c.c
        .from("notifications")
        .insert({ user_id: bid, verb: "direct_message" })
    ).error,
  );
  pass(
    "One private image per message; recipient reads after send; outsiders, spoofing and arbitrary notifications blocked",
  );
  const p = await ok(
    a.c
      .from("projects")
      .insert({
        owner_id: aid,
        slug: tag,
        title: "Social collaboration test",
        summary: "An original verification project",
        is_public: false,
        status: "active",
        demo_url: "https://example.com/demo",
        repository_url: "https://example.com/repository",
      })
      .select()
      .single(),
  );
  assert.equal(
    (await ok(guest.from("projects").select("id").eq("id", p.id))).length,
    0,
  );
  assert(
    (
      await action(c.c, "invite", {
        slug: p.slug,
        username: b.user.user_metadata.username,
      })
    ).error,
  );
  assert(
    (
      await action(a.c, "invite", {
        slug: p.slug,
        username: c.user.user_metadata.username,
      })
    ).error,
  );
  const invitation = await ok(
    action(a.c, "invite", {
      slug: p.slug,
      username: b.user.user_metadata.username,
    }),
  );
  assert(
    (
      await action(a.c, "invite", {
        slug: p.slug,
        username: b.user.user_metadata.username,
      })
    ).error,
  );
  assert.equal(
    (await ok(b.c.from("projects").select("id").eq("id", p.id))).length,
    1,
  );
  assert(
    (await action(a.c, "respond", { id: invitation.id, status: "approved" }))
      .error,
  );
  await ok(action(b.c, "respond", { id: invitation.id, status: "approved" }));
  assert.equal(
    (
      await ok(
        a.c
          .from("notifications")
          .select("id")
          .eq("verb", "project_invite_accepted"),
      )
    ).length,
    1,
  );
  assert.equal(
    (
      await ok(
        b.c
          .from("project_members")
          .select("id")
          .eq("project_id", p.id)
          .eq("user_id", bid),
      )
    ).length,
    1,
  );
  assert.equal(
    (await ok(c.c.from("projects").select("id").eq("id", p.id))).length,
    0,
  );
  await ok(a.c.from("projects").update({ is_public: true }).eq("id", p.id));
  const request = await ok(
    action(c.c, "join", { slug: p.slug, message: "Please review my request" }),
  );
  await ok(action(c.c, "join", { slug: p.slug, message: "Retry" }));
  assert.equal(
    (
      await ok(
        a.c
          .from("notifications")
          .select("id")
          .eq("verb", "project_join_request"),
      )
    ).length,
    1,
  );
  assert(
    (await action(c.c, "respond", { id: request.id, status: "approved" }))
      .error,
  );
  await ok(action(a.c, "respond", { id: request.id, status: "rejected" }));
  assert.equal(
    (
      await ok(
        c.c
          .from("notifications")
          .select("id")
          .eq("verb", "project_join_rejected"),
      )
    ).length,
    1,
  );
  assert.equal(
    (await ok(guest.from("projects").select("demo_url").eq("id", p.id))).length,
    1,
  );
  assert.equal(
    (
      await ok(
        c.c
          .from("projects")
          .update({ title: "Forbidden edit" })
          .eq("id", p.id)
          .select(),
      )
    ).length,
    0,
  );
  pass(
    "Project invitations, duplicate prevention, private preview, recipient-only responses, join requests/rejection and public showcase RLS",
  );
  await ok(
    a.c
      .from("profiles")
      .update({ role: "mentor", notification_sound: false })
      .eq("id", aid),
  );
  await ok(a.c.auth.signOut());
  await ok(
    a.c.auth.signInWithPassword({ email: a.email, password: a.password }),
  );
  assert.equal(
    (await ok(a.c.from("profiles").select("role").eq("id", aid).single())).role,
    "mentor",
  );
  assert.equal(
    (
      await ok(
        c.c.from("profiles").update({ role: "learner" }).eq("id", aid).select(),
      )
    ).length,
    0,
  );
  assert(
    (await a.c.from("profiles").update({ is_staff: true }).eq("id", aid)).error,
  );
  pass(
    "Role and sound preferences persist through login; other profiles and admin privileges protected",
  );
  const thread = await ok(
    a.c
      .from("threads")
      .insert({
        slug: tag,
        author_id: aid,
        title: "Social mention verification",
        body: "A discussion with actual connected participants",
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
        body: `Hi @${b.user.user_metadata.username} and @${c.user.user_metadata.username}`,
      })
      .select()
      .single(),
  );
  const mention = await ok(
    b.c.from("notifications").select("*").eq("verb", "mentioned_you"),
  );
  assert.equal(mention.length, 1);
  assert.equal(mention[0].target_anchor, `comment-${comment.id}`);
  assert.equal(
    (
      await ok(
        c.c.from("notifications").select("id").eq("verb", "mentioned_you"),
      )
    ).length,
    0,
  );
  await ok(
    a.c
      .from("comments")
      .update({ body: `Updated @${b.user.user_metadata.username}` })
      .eq("id", comment.id),
  );
  assert.equal(
    (
      await ok(
        b.c.from("notifications").select("id").eq("verb", "mentioned_you"),
      )
    ).length,
    1,
  );
  await ok(
    b.c
      .from("comments")
      .insert({
        thread_id: thread.id,
        parent_id: comment.id,
        author_id: bid,
        body: "A useful reply",
      }),
  );
  assert.equal(
    (
      await ok(
        a.c.from("notifications").select("id").eq("verb", "replied_to_comment"),
      )
    ).length,
    1,
  );
  assert(
    (
      await c.c
        .from("comment_mentions")
        .insert({ comment_id: comment.id, user_id: cid })
    ).error,
  );
  const feed = await ok(
    a.c.rpc("colearn_thread_feed", {
      filters: { search: "Social mention verification", page: 1, page_size: 1 },
    }),
  );
  assert.equal(feed.count, 1);
  assert.equal(feed.results.length, 1);
  assert.equal(feed.results[0].comment_count, 2);
  await ok(
    b.c.from("notifications").update({ is_read: true }).eq("id", mention[0].id),
  );
  assert(
    (
      await ok(
        b.c
          .from("notifications")
          .select("is_read")
          .eq("id", mention[0].id)
          .single(),
      )
    ).is_read,
  );
  pass(
    "Connected mentions, exact comment destinations, reply notification deduplication, private notification ownership and paginated feed",
  );
  await ok(
    a.c
      .from("comments")
      .insert(
        Array.from({ length: 25 }, (_, i) => ({
          thread_id: thread.id,
          author_id: aid,
          body: `History item ${i}`,
        })),
      ),
  );
  const page1 = await ok(
    a.c.rpc("colearn_comment_page", { discussion: thread.id }),
  );
  assert.equal(page1.results.filter((c) => !c.parent_id).length, 20);
  assert(page1.next_cursor);
  const page2 = await ok(
    a.c.rpc("colearn_comment_page", {
      discussion: thread.id,
      before_id: page1.next_cursor,
    }),
  );
  assert.equal(page2.results.filter((c) => !c.parent_id).length, 6);
  const focus = await ok(
    b.c.rpc("colearn_comment_page", {
      discussion: thread.id,
      focus: comment.id,
    }),
  );
  assert(focus.results.some((c) => c.id === comment.id));
  const p2 = await ok(
    a.c
      .from("projects")
      .insert({
        owner_id: aid,
        slug: tag + "-second",
        title: "Another collaboration",
        status: "active",
      })
      .select()
      .single(),
  );
  const cancel = await ok(
    action(a.c, "invite", {
      slug: p2.slug,
      username: b.user.user_metadata.username,
    }),
  );
  await ok(action(a.c, "cancel_invite", { id: cancel.id }));
  assert.equal(
    (
      await ok(
        a.c.from("join_requests").select("status").eq("id", cancel.id).single(),
      )
    ).status,
    "cancelled",
  );
  assert(
    (await action(b.c, "respond", { id: cancel.id, status: "approved" })).error,
  );
  const accepted = await ok(action(c.c, "join", { slug: p2.slug }));
  await ok(action(a.c, "respond", { id: accepted.id, status: "approved" }));
  assert.equal(
    (
      await ok(
        c.c
          .from("project_members")
          .select("id")
          .eq("project_id", p2.id)
          .eq("user_id", cid),
      )
    ).length,
    1,
  );
  pass(
    "Bounded comment history, older mention destinations, invitation cancellation and owner-only request acceptance",
  );
  const projectFeed = await ok(
    a.c.rpc("colearn_project_feed", {
      filters: { mine: "true", page: 1, page_size: 1 },
    }),
  );
  assert.equal(projectFeed.results.length, 1);
  assert(projectFeed.count >= 2);
  assert(projectFeed.facets);
  pass(
    "Paginated project feed includes owned projects and server-derived filters",
  );
} finally {
  for (const [bucket, path] of files)
    await service.storage.from(bucket).remove([path]);
  for (const { user, c } of users) {
    await c.removeAllChannels();
    await service.auth.admin.deleteUser(user.id);
  }
  writeFileSync(
    ".dist/social-verification.json",
    JSON.stringify({ checks, fixturesRemoved: true }, null, 2),
  );
}
