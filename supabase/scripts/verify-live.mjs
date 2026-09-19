// Integration checks against the linked project. Creates isolated users/content and cleans up.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID, pbkdf2Sync } from "node:crypto";
import { writeFileSync } from "node:fs";
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
const keys = Array.isArray(raw) ? raw : raw.api_keys || raw.keys;
const key = (name) => keys.find((k) => k.name === name).api_key;
const client = (k) =>
  createClient(url, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const service = client(key("service_role")),
  anon = client(key("anon"));
const ok = async (promise) => {
  const r = await promise;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const action = (c, name, payload = {}) =>
  ok(c.rpc("colearn_action", { action: name, payload }));
const denied = async (promise) => {
  const r = await promise;
  assert(
    r.error || (Array.isArray(r.data) && r.data.length === 0),
    "Unauthorized operation succeeded",
  );
};
const tag = `migration-${Date.now()}`,
  created = [],
  objects = [];
let bookId, threadId;
let assertions = 0;
const check = (name, fn) =>
  fn().then(() => {
    assertions++;
    console.log(`PASS ${name}`);
  });
try {
  const accounts = [];
  for (const role of ["owner", "peer", "admin"]) {
    const email = `${tag}-${role}@example.com`,
      password = `Test!${randomUUID()}`;
    const { user } = await ok(
      service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${role}`,
          full_name: "Migration verification",
        },
      }),
    );
    created.push(user.id);
    if (role === "admin")
      await ok(
        service
          .from("profiles")
          .update({ is_staff: true, is_superuser: true })
          .eq("id", user.id),
      );
    const c = client(key("anon"));
    await ok(c.auth.signInWithPassword({ email, password }));
    accounts.push({ c, id: user.id, email, password });
  }
  const [owner, peer, admin] = accounts;
  await check(
    "email/password authentication and profile creation",
    async () => {
      assert.equal(
        (
          await ok(
            owner.c.from("profiles").select("*").eq("id", owner.id).single(),
          )
        ).xp,
        10,
      );
    },
  );
  await check(
    "anonymous approved library allowed; private account data blocked",
    async () => {
      const published = await ok(anon.from("books").select("status"));
      assert(
        published.length &&
          published.every((book) => book.status === "APPROVED"),
      );
      await denied(
        anon.rpc("colearn_legacy_hash", { email_address: owner.email }),
      );
      await denied(anon.from("contact_messages").select("*"));
    },
  );
  await check("profile privilege and XP escalation blocked", async () => {
    await denied(
      owner.c
        .from("profiles")
        .update({ website: "javascript:alert(1)" })
        .eq("id", owner.id),
    );
    await denied(
      owner.c
        .from("profiles")
        .update({ interests: { invalid: true } })
        .eq("id", owner.id),
    );
    await denied(
      owner.c.from("profiles").update({ is_staff: true }).eq("id", owner.id),
    );
    await denied(
      owner.c.from("profiles").update({ xp: 999999 }).eq("id", owner.id),
    );
    await denied(
      owner.c.from("profiles").update({ role: "admin" }).eq("id", owner.id),
    );
    await denied(
      peer.c
        .from("profiles")
        .update({ bio: "hacked" })
        .eq("id", owner.id)
        .select(),
    );
  });
  await check(
    "skills, onboarding, and daily rewards are idempotent",
    async () => {
      await action(owner.c, "skills", { skills: ["React"] });
      await action(owner.c, "onboarding");
      await action(owner.c, "touch");
      const before = (
        await ok(
          owner.c.from("profiles").select("xp").eq("id", owner.id).single(),
        )
      ).xp;
      await action(owner.c, "onboarding");
      await action(owner.c, "touch");
      assert.equal(
        (
          await ok(
            owner.c.from("profiles").select("xp").eq("id", owner.id).single(),
          )
        ).xp,
        before,
      );
    },
  );
  const project = await ok(
    owner.c
      .from("projects")
      .insert({
        slug: tag,
        title: "Migration test project",
        owner_id: owner.id,
        is_public: false,
      })
      .select()
      .single(),
  );
  await check("private project ownership and membership enforced", async () => {
    await denied(peer.c.from("projects").select("*").eq("id", project.id));
    await denied(
      peer.c
        .from("tasks")
        .insert({ project_id: project.id, title: "Unapproved task" }),
    );
    await denied(
      peer.c
        .from("project_members")
        .insert({ project_id: project.id, user_id: peer.id }),
    );
    assert.equal(
      (
        await ok(
          owner.c
            .from("project_members")
            .select("*")
            .eq("project_id", project.id),
        )
      ).length,
      1,
    );
  });
  await check(
    "invitations and acceptance grant private project access",
    async () => {
      await denied(
        owner.c.rpc("colearn_action", {
          action: "invite",
          payload: { slug: project.slug, username: `${tag}-peer` },
        }),
      );
      await action(owner.c, "connection", { username: `${tag}-peer` });
      await action(peer.c, "connection", {
        username: `${tag}-owner`,
        action: "accept",
      });
      const invite = await action(owner.c, "invite", {
        slug: project.slug,
        username: `${tag}-peer`,
      });
      await action(peer.c, "respond", { id: invite.id, status: "approved" });
      assert.equal(
        (await ok(peer.c.from("projects").select("*").eq("id", project.id)))
          .length,
        1,
      );
    },
  );
  await check("task CRUD and completion rewards", async () => {
    const task = await ok(
      owner.c
        .from("tasks")
        .insert({
          project_id: project.id,
          title: "Verify task",
          assignee_id: peer.id,
        })
        .select()
        .single(),
    );
    await ok(peer.c.from("tasks").update({ status: "done" }).eq("id", task.id));
    const before = (
      await ok(peer.c.from("profiles").select("xp").eq("id", peer.id).single())
    ).xp;
    await ok(peer.c.from("tasks").update({ status: "todo" }).eq("id", task.id));
    await ok(peer.c.from("tasks").update({ status: "done" }).eq("id", task.id));
    assert.equal(
      (
        await ok(
          peer.c.from("profiles").select("xp").eq("id", peer.id).single(),
        )
      ).xp,
      before,
    );
    await denied(peer.c.from("tasks").delete().eq("id", task.id).select());
    await ok(owner.c.from("tasks").delete().eq("id", task.id));
  });
  await check(
    "admin content CRUD, reading, notes, bookmarks, and XP",
    async () => {
      const b = await ok(
        admin.c
          .from("books")
          .insert({
            slug: tag,
            title: "Verification book",
            author: "CoLearn",
            source_url: "https://example.com/source",
            license_name: "Original fixture",
            license_url: "https://example.com/license",
            attribution: "CoLearn test suite",
            changes_made: "None",
            license_evidence_url: "https://example.com/permission",
            license_evidence_notes: "Original verification content",
            redistribution_confirmed: true,
          })
          .select()
          .single(),
      );
      bookId = b.id;
      const chapter = await ok(
        admin.c
          .from("chapters")
          .insert({
            book_id: b.id,
            slug: tag,
            title: "Introduction",
            chapter_number: 1,
            content: "Verification chapter",
          })
          .select()
          .single(),
      );
      await denied(
        owner.c
          .from("books")
          .update({ title: "Unauthorized" })
          .eq("id", b.id)
          .select(),
      );
      await ok(
        admin.c.from("books").update({ status: "APPROVED" }).eq("id", b.id),
      );
      const p = await action(owner.c, "progress", {
        slug: b.slug,
        chapter_id: chapter.id,
        completed: true,
      });
      assert(p.book_completed);
      assert.equal(
        (
          await action(owner.c, "progress", {
            slug: b.slug,
            chapter_id: chapter.id,
            completed: true,
          })
        ).xp_awarded,
        0,
      );
      const n = await ok(
        owner.c
          .from("notes")
          .insert({
            chapter_id: chapter.id,
            user_id: owner.id,
            content: "My private note",
          })
          .select()
          .single(),
      );
      await denied(peer.c.from("notes").select("*").eq("id", n.id));
      await ok(owner.c.from("notes").delete().eq("id", n.id));
      assert.equal(
        (await action(owner.c, "bookmark", { id: chapter.id })).status,
        "created",
      );
      assert.equal(
        (await action(owner.c, "bookmark", { id: chapter.id })).status,
        "deleted",
      );
    },
  );
  await check("discussion, comment, vote, report, and moderation", async () => {
    const t = await ok(
      owner.c
        .from("threads")
        .insert({
          author_id: owner.id,
          slug: tag,
          title: "Verification discussion",
          body: "Test discussion",
        })
        .select()
        .single(),
    );
    threadId = t.id;
    await action(owner.c, "thread_tags", {
      id: t.id,
      tags: [(await ok(service.from("tags").select("slug").limit(1)))[0].slug],
    });
    const c = await ok(
      peer.c
        .from("comments")
        .insert({
          author_id: peer.id,
          thread_id: t.id,
          body: "A helpful response",
        })
        .select()
        .single(),
    );
    await ok(
      peer.c
        .from("comments")
        .update({ body: "An edited response" })
        .eq("id", c.id),
    );
    await denied(
      owner.c
        .from("comments")
        .update({ body: "Unauthorized edit" })
        .eq("id", c.id)
        .select(),
    );
    assert.equal(
      (
        await action(owner.c, "vote", {
          content_type: "comment",
          object_id: c.id,
          value: 1,
        })
      ).score,
      1,
    );
    await action(owner.c, "report", {
      content_type: "comment",
      object_id: c.id,
      reason: "Verification only",
    });
    const report = (
      await ok(owner.c.from("reports").select("*").eq("comment_id", c.id))
    )[0];
    await denied(
      owner.c.rpc("colearn_moderate", {
        report_id: report.id,
        action: "resolve",
      }),
    );
    await ok(
      admin.c.rpc("colearn_moderate", {
        report_id: report.id,
        action: "resolve",
      }),
    );
  });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=",
    "base64",
  );
  await check(
    "Storage ownership, public avatars, and private covers",
    async () => {
      const avatar = `${owner.id}/${tag}.png`,
        cover = `${project.id}/${tag}.png`;
      objects.push(["avatars", avatar], ["project-covers", cover]);
      await ok(
        owner.c.storage
          .from("avatars")
          .upload(avatar, png, { contentType: "image/png" }),
      );
      await denied(
        peer.c.storage
          .from("avatars")
          .upload(`${owner.id}/forbidden.png`, png, {
            contentType: "image/png",
          }),
      );
      await ok(
        owner.c.storage
          .from("project-covers")
          .upload(cover, png, { contentType: "image/png" }),
      );
      await ok(
        peer.c.storage.from("project-covers").createSignedUrl(cover, 60),
      );
      await denied(
        anon.storage.from("project-covers").createSignedUrl(cover, 60),
      );
      await action(owner.c, "remove_member", {
        slug: project.slug,
        user_id: peer.id,
      });
      await denied(
        peer.c.storage.from("project-covers").createSignedUrl(cover, 60),
      );
    },
  );
  await check("public portfolio excludes private projects", async () => {
    const p = await ok(
      anon.rpc("colearn_portfolio", { username: `${tag}-owner` }),
    );
    assert(!p.projects.some((p) => p.id === project.id));
    assert(!("email" in p.profile));
    assert.equal(p.heatmap.length, 12);
    assert(p.heatmap.every((w) => w.week_start && Number.isFinite(w.activity)));
    assert(Number.isFinite(p.stats.badges_count));
  });
  await check("admin Edge Function permissions and listing", async () => {
    const match = await ok(
      admin.c.functions.invoke("account", {
        body: { action: "list-users", params: { q: owner.email } },
      }),
    );
    assert.equal(match.results.length, 1);
    assert.equal(match.results[0].id, owner.id);
    const deniedResult = await owner.c.functions.invoke("account", {
      body: { action: "list-users" },
    });
    assert(deniedResult.error);
    const list = await ok(
      admin.c.functions.invoke("account", { body: { action: "list-users" } }),
    );
    assert(list.count >= created.length);
    await ok(admin.c.rpc("colearn_admin_stats"));
    await denied(owner.c.rpc("colearn_admin_stats"));
  });
  await check("contact Edge Function validation and persistence", async () => {
    const bad = await anon.functions.invoke("contact", { body: { name: "x" } });
    assert(bad.error);
    await ok(
      anon.functions.invoke("contact", {
        body: {
          name: "Migration test",
          email: `${tag}@example.com`,
          subject: "Migration verification",
          message: "Verifying the migrated contact form.",
        },
      }),
    );
    assert.equal(
      (
        await ok(
          service
            .from("contact_messages")
            .select("id")
            .eq("email", `${tag}@example.com`),
        )
      ).length,
      1,
    );
  });
  await check("legacy password migration and reset invalidation", async () => {
    const salt = "migration-verification",
      iterations = 120000,
      hash = `pbkdf2_sha256$${iterations}$${salt}$${pbkdf2Sync(owner.password, salt, iterations, 32, "sha256").toString("base64")}`;
    const install = () => {
      writeFileSync(
        ".dist/test-legacy.sql",
        `insert into app.legacy_auth(user_id,password_hash) values('${owner.id}','${hash}') on conflict(user_id) do update set password_hash=excluded.password_hash;`,
      );
      execFileSync(
        "supabase.cmd",
        ["db", "query", "--linked", "--file", ".dist/test-legacy.sql"],
        { shell: true, encoding: "utf8" },
      );
    };
    install();
    const migrated = await ok(
      anon.functions.invoke("account", {
        body: {
          action: "legacy-login",
          email: owner.email,
          password: owner.password,
        },
      }),
    );
    assert(migrated.session.access_token);
    assert.equal(
      await ok(
        service.rpc("colearn_legacy_hash", { email_address: owner.email }),
      ),
      null,
    );
    install();
    await ok(
      service.auth.admin.updateUserById(owner.id, {
        password: `Reset!${randomUUID()}`,
      }),
    );
    assert.equal(
      await ok(
        service.rpc("colearn_legacy_hash", { email_address: owner.email }),
      ),
      null,
    );
    await denied(
      anon.functions.invoke("account", {
        body: {
          action: "legacy-login",
          email: owner.email,
          password: owner.password,
        },
      }),
    );
  });
  await check(
    "admin account creation, edit, ban/unban, and deletion",
    async () => {
      const p = await ok(
        admin.c.functions.invoke("account", {
          body: {
            action: "create-user",
            username: tag + "-managed",
            full_name: "Managed test",
            email: tag + "-managed@example.com",
            password: "Managed!" + randomUUID(),
            role: "learner",
          },
        }),
      );
      created.push(p.id);
      await ok(
        admin.c.functions.invoke("account", {
          body: {
            action: "update-user",
            id: p.id,
            role: "builder",
            is_active: false,
          },
        }),
      );
      assert.equal(
        (
          await ok(
            service
              .from("profiles")
              .select("is_active,role")
              .eq("id", p.id)
              .single(),
          )
        ).is_active,
        false,
      );
      await ok(
        admin.c.functions.invoke("account", {
          body: { action: "update-user", id: p.id, is_active: true },
        }),
      );
      await ok(
        admin.c.functions.invoke("account", {
          body: { action: "delete-user", id: p.id },
        }),
      );
    },
  );
  await check("account deactivation blocks data access", async () => {
    await ok(
      service.from("profiles").update({ is_active: false }).eq("id", peer.id),
    );
    await denied(peer.c.from("reading_progress").select("*"));
    await denied(peer.c.rpc("colearn_action", { action: "touch" }));
  });
  console.log(`${assertions} integration groups passed.`);
  writeFileSync(
    ".dist/live-verification.json",
    JSON.stringify(
      { at: new Date().toISOString(), passed: assertions },
      null,
      2,
    ),
  );
} finally {
  for (const [bucket, path] of objects)
    await service.storage.from(bucket).remove([path]);
  if (threadId) await service.from("threads").delete().eq("id", threadId);
  if (bookId) await service.from("books").delete().eq("id", bookId);
  await service
    .from("contact_messages")
    .delete()
    .eq("email", `${tag}@example.com`);
  for (const id of created) await service.auth.admin.deleteUser(id);
  console.log("Removed verification accounts and temporary content.");
}
