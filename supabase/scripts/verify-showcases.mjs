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

  const id = randomUUID(),
    path = `${aid}/${id}/${randomUUID()}.png`,
    png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    );
  await ok(
    a.c.storage
      .from("showcase-images")
      .upload(path, png, { contentType: "image/png" }),
  );
  files.push(["showcase-images", path]);
  assert(
    (await guest.storage.from("showcase-images").createSignedUrl(path, 60))
      .error,
  );
  const before = (await ok(a.c.from("project_members").select("id"))).length;
  const showcase = await ok(
    a.c
      .from("profile_showcases")
      .insert({
        id,
        title: "Climate map",
        description: "A personal data visualization.",
        image_path: path,
        live_url: "https://example.com/climate",
      })
      .select()
      .single(),
  );
  assert.equal(
    (await ok(a.c.from("project_members").select("id"))).length,
    before,
  );
  assert.equal(
    (await ok(guest.from("profile_showcases").select("*").eq("id", id))).length,
    1,
  );
  assert(
    (await ok(guest.storage.from("showcase-images").createSignedUrl(path, 60)))
      .signedUrl,
  );
  assert.equal(
    (
      await ok(
        b.c
          .from("profile_showcases")
          .update({ title: "Spoof" })
          .eq("id", id)
          .select(),
      )
    ).length,
    0,
  );
  assert.equal(
    (await ok(b.c.from("profile_showcases").delete().eq("id", id).select()))
      .length,
    0,
  );
  assert(
    (
      await b.c
        .from("profile_showcases")
        .insert({ user_id: aid, title: "Spoof" })
    ).error,
  );
  assert(
    (
      await b.c
        .from("profile_showcases")
        .insert({ title: "Borrowed image", image_path: path })
    ).error,
  );
  assert(
    (await guest.from("profile_showcases").insert({ title: "Anonymous" }))
      .error,
  );
  assert(
    (
      await a.c
        .from("profile_showcases")
        .update({ live_url: "javascript:alert(1)" })
        .eq("id", id)
    ).error,
  );
  pass(
    "Standalone showcase creation, public display/signed images, no project enrollment, owner-only writes and safe links",
  );
  await ok(
    a.c
      .from("profile_showcases")
      .update({
        title: "A clearer map",
        description: "Updated details",
        live_url: "https://example.com/updated",
        image_path: null,
      })
      .eq("id", id),
  );
  await ok(a.c.storage.from("showcase-images").remove([path]));
  assert(
    (await guest.storage.from("showcase-images").createSignedUrl(path, 60))
      .error,
  );
  const saved = await ok(
    guest.from("profile_showcases").select("*").eq("id", id).single(),
  );
  assert.equal(saved.title, "A clearer map");
  assert.equal(saved.live_url, "https://example.com/updated");
  await ok(a.c.from("profile_showcases").delete().eq("id", id));
  assert.equal(
    (await ok(guest.from("profile_showcases").select("id").eq("id", id)))
      .length,
    0,
  );
  pass(
    "Owner updates title/details/link/image and deletes the standalone showcase and unused storage object",
  );
} finally {
  for (const [bucket, path] of files)
    await service.storage.from(bucket).remove([path]);
  for (const { user, c } of users) {
    await c.removeAllChannels();
    await ok(service.auth.admin.deleteUser(user.id));
  }
  writeFileSync(
    ".dist/showcase-verification.json",
    JSON.stringify({ checks, fixturesRemoved: true }, null, 2),
  );
}
