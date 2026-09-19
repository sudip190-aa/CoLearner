import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  url = `https://${ref}.supabase.co`,
  tag = `project-feed-${Date.now()}`;
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

  const before = await ok(
    b.c.from("notifications").select("id").eq("actor_id", aid),
  );
  const fixtures = [];
  for (let i = 0; i < 9; i++)
    fixtures.push(
      await ok(
        service
          .from("projects")
          .insert({
            slug: `${tag}-${i}`,
            title: `${tag} project ${i}`,
            owner_id: i % 2 ? bid : aid,
            category: i % 2 ? "Web" : "Mobile",
            status: i % 3 ? "active" : "idea",
            tech_stack: i % 2 ? ["React"] : ["Python"],
            created_at: new Date(
              Date.now() + Math.floor(i / 2) * 1000,
            ).toISOString(),
          })
          .select()
          .single(),
      ),
    );
  assert.equal(
    (await ok(b.c.from("notifications").select("id").eq("actor_id", aid)))
      .length,
    before.length,
    "Creating projects must not notify connected people",
  );
  const read = (client, filters = {}) =>
    ok(
      client.rpc("colearn_project_feed", {
        filters: { search: tag, ...filters },
      }),
    );
  const sorted = [...fixtures]
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
    .map((x) => x.id);
  assert.deepEqual(
    (await read(a.c)).results.map((x) => x.id),
    sorted,
  );
  const paged = [];
  for (let page = 1; page <= 3; page++)
    paged.push(
      ...(await read(a.c, { page, page_size: 3 })).results.map((x) => x.id),
    );
  assert.deepEqual(paged, sorted);
  assert.equal(new Set(paged).size, 9);
  for (const client of [a.c, b.c]) {
    assert.equal(
      (
        await read(client, {
          category: "Web",
          tech: ["React"],
          status: "active",
        })
      ).results.length,
      3,
    );
    assert.equal(
      (await read(client, { category: "Mobile", tech: ["React"] })).results
        .length,
      0,
    );
    assert.equal((await read(client, {})).count, 9);
  }
  assert.equal((await read(a.c, { mine: "true" })).count, 5);
  assert.equal((await read(b.c, { mine: "true" })).count, 4);
  pass(
    "Multi-user project filtering, combined search, deterministic newest order, tied timestamps, pagination and no creation broadcast",
  );
} finally {
  for (const { user, c } of users) {
    await c.removeAllChannels();
    await service.auth.admin.deleteUser(user.id);
  }
  writeFileSync(
    ".dist/project-feed-verification.json",
    JSON.stringify({ checks, fixturesRemoved: true }, null, 2),
  );
}
