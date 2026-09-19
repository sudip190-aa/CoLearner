import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const raw = JSON.parse(
  execFileSync(
    "supabase.cmd",
    [
      "projects",
      "api-keys",
      "--project-ref",
      "ghjdpcvnzclfvyosfhoz",
      "--reveal",
      "--output",
      "json",
    ],
    { shell: true, encoding: "utf8" },
  ),
);
const keys = Array.isArray(raw) ? raw : raw.api_keys || raw.keys;
const db = createClient(
  "https://ghjdpcvnzclfvyosfhoz.supabase.co",
  keys.find((k) => k.name === "service_role").api_key,
  { auth: { persistSession: false } },
);
const counts = JSON.parse(readFileSync(".dist/import-counts.json", "utf8"));
const source = JSON.parse(readFileSync(".dist/legacy-data.json", "utf8"));
const results = {};
for (const [table, expected] of Object.entries(counts)) {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  // Verification accounts are intentionally excluded from the legacy profile count.
  results[table] = { expected, actual: count };
  assert.equal(count, expected, `${table} count mismatch`);
}
const { data: profiles } = await db
  .from("profiles")
  .select(
    "id,legacy_id,username,xp,is_staff,is_superuser,onboarding_completed",
  );
for (const old of source.users_customuser) {
  const p = profiles.find((p) => p.legacy_id === old.id);
  assert(p, `Missing legacy profile ${old.id}`);
  assert.equal(p.username, old.username);
  assert.equal(p.is_staff, old.is_staff);
  assert.equal(p.is_superuser, old.is_superuser);
  assert.equal(p.xp, old.xp);
}
const { data: projects } = await db
  .from("projects")
  .select("id,owner_id,is_public");
for (const old of source.projects_project) {
  const p = projects.find((p) => p.id === old.id);
  assert.equal(
    p.owner_id,
    profiles.find((u) => u.legacy_id === old.owner_id).id,
  );
  assert.equal(p.is_public, old.is_public);
}
writeFileSync(
  ".dist/import-verification.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      tables: results,
      profileFieldsVerified: true,
      ownershipVerified: true,
    },
    null,
    2,
  ),
);
console.log(
  `Verified exact counts for ${Object.keys(counts).length} imported tables, all legacy account privileges/XP, and project ownership.`,
);
