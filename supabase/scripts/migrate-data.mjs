// Run from repository root after export_legacy.py. Service key stays in memory.
// Existing destination records are never overwritten on a subsequent run.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, basename, extname } from "node:path";
const ref = "ghjdpcvnzclfvyosfhoz";
const cli = (args) =>
  execFileSync("supabase.cmd", args, {
    shell: true,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
const keys = JSON.parse(
  cli([
    "projects",
    "api-keys",
    "--project-ref",
    ref,
    "--reveal",
    "--output",
    "json",
  ]),
);
const keyList = Array.isArray(keys) ? keys : keys.api_keys || keys.keys;
const key = keyList.find((k) => k.name === "service_role").api_key;
if (!key) throw new Error("Service credential unavailable");
const db = createClient(`https://${ref}.supabase.co`, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const checked = async (promise) => {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
};
const legacy = JSON.parse(readFileSync(".dist/legacy-data.json", "utf8"));
const catalog = JSON.parse(
  readFileSync(".dist/supabase-columns.json", "utf8").replace(/^\uFEFF/, ""),
);
const columns = Array.isArray(catalog)
  ? catalog
  : catalog.rows || catalog.data || catalog.result;
if (!Array.isArray(columns))
  throw new Error("Unrecognized schema catalog format");
const users = new Map();
let existing = [];
for (let page = 1; ; page++) {
  const batch = (
    await checked(db.auth.admin.listUsers({ page, perPage: 1000 }))
  ).users;
  existing.push(...batch);
  if (batch.length < 1000) break;
}
for (const u of legacy.users_customuser) {
  let authUser = existing.find(
    (a) => a.email?.toLowerCase() === u.email.toLowerCase(),
  );
  if (!authUser)
    authUser = (
      await checked(
        db.auth.admin.createUser({
          email: u.email,
          email_confirm: true,
          user_metadata: {
            username: u.username,
            full_name: u.full_name,
            legacy_id: u.id,
          },
        }),
      )
    ).user;
  else if (authUser.user_metadata?.legacy_id !== u.id)
    throw new Error(
      `Destination account conflict for legacy ID ${u.id}; refusing to take over an unrelated account.`,
    );
  users.set(u.id, authUser.id);
}
console.log(`Mapped ${users.size} legacy accounts to Supabase Auth.`);
const mapping = {
  profiles: "users_customuser",
  skills: "users_skill",
  user_skills: "users_userskill",
  connections: "users_connection",
  books: "books_book",
  chapters: "books_chapter",
  reading_progress: "books_readingprogress",
  bookmarks: "books_bookmark",
  notes: "books_note",
  projects: "projects_project",
  project_members: "projects_projectmember",
  join_requests: "projects_joinrequest",
  tasks: "projects_task",
  milestones: "projects_milestone",
  project_updates: "projects_projectupdate",
  tags: "community_tag",
  threads: "community_thread",
  thread_tags: "community_thread_tags",
  comments: "community_comment",
  votes: "community_vote",
  thread_views: "community_threadview",
  reports: "core_report",
  contact_messages: "core_contactmessage",
  user_badges: "gamification_userbadge",
  xp_events: "gamification_xpevent",
  notifications: "notifications_notification",
};
const types = new Map(
  legacy.django_content_type.map((t) => [
    t.id,
    t.model === "customuser" ? "user" : t.model,
  ]),
);
const badgeIds = new Map(
  (await checked(db.from("badges").select("id,slug"))).map((b) => [
    b.slug,
    b.id,
  ]),
);
const oldBadges = new Map(
  legacy.gamification_badge.map((b) => [b.id, badgeIds.get(b.slug)]),
);
const quote = (s) => `'${String(s).replaceAll("'", "''")}'`;
let sql =
  "begin;\nselect pg_advisory_xact_lock(hashtextextended('colearn_legacy_import',0));\ncreate table if not exists app.import_runs(name text primary key,completed_at timestamptz not null default now());\ndo $$ begin if exists(select 1 from app.import_runs where name='django-sqlite-v1') then raise exception 'This snapshot has already been imported; refusing to overwrite live data';end if;end $$;\n";
// Suspend only application triggers, transactionally, so historical imports do not pay XP again.
for (const table of Object.keys(mapping))
  sql += `alter table public.${table} disable trigger user;\n`;
sql += `delete from public.xp_events where user_id in (${[...users.values()].map(quote).join(",")});\n`;
let counts = {},
  seenEvents = new Set();
for (const [table, source] of Object.entries(mapping)) {
  const allowed = columns
    .filter((c) => c.table_name === table)
    .map((c) => c.column_name);
  const records = [];
  for (const raw of legacy[source] || []) {
    const r = { ...raw };
    for (const k of [
      "user_id",
      "owner_id",
      "author_id",
      "assignee_id",
      "from_user_id",
      "to_user_id",
      "actor_id",
      "reporter_id",
    ])
      if (r[k] != null) r[k] = users.get(r[k]);
    if (table === "profiles") {
      r.legacy_id = r.id;
      r.id = users.get(r.id);
    }
    if (table === "projects" && ["in_progress", "review"].includes(r.status))
      r.status = "active";
    if (table === "user_badges") r.badge_id = oldBadges.get(r.badge_id);
    if (table === "votes" || table === "reports") {
      const type = types.get(r.content_type_id);
      r.target_type = type;
      r[type === "user" ? "target_user_id" : `${type}_id`] =
        type === "user" ? users.get(r.object_id) : r.object_id;
      const targetTable =
        type === "user" ? "users_customuser" : `community_${type}`;
      if (!legacy[targetTable]?.some((t) => t.id === r.object_id)) {
        if (table === "votes") continue;
        r[type === "user" ? "target_user_id" : `${type}_id`] = null;
      }
    }
    if (table === "notifications") {
      r.target_type = types.get(r.target_content_type_id) || "";
      r.target_id =
        r.target_type === "user"
          ? users.get(r.object_id)
          : String(r.object_id || "");
      const sourceTable = {
        project: "projects_project",
        thread: "community_thread",
        comment: "community_comment",
        badge: "gamification_badge",
        book: "books_book",
        user: "users_customuser",
      }[r.target_type];
      const target = legacy[sourceTable]?.find((t) => t.id === r.object_id);
      r.target_label = target?.title || target?.name || target?.username || "";
      r.target_slug = target?.slug || target?.username || "";
    }
    if (table === "xp_events") {
      const key = JSON.stringify([r.user_id, r.reason, r.source]);
      if (seenEvents.has(key)) r.source = `${r.source}:legacy-${r.id}`;
      seenEvents.add(key);
    }
    for (const [field, bucket] of Object.entries({
      avatar: "avatars",
      cover: table === "books" ? "book-covers" : "project-covers",
    })) {
      const value = r[field];
      if (!value || /^https?:/.test(value)) continue;
      const file = resolve("backend/media", value);
      if (!file.startsWith(resolve("backend/media") + "\\"))
        throw new Error("Media path escapes source directory");
      if (!existsSync(file))
        throw new Error(`Missing legacy media for ${table} ${r.id}`);
      const object = `${r.id}/legacy-${basename(file)}`,
        mime = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
        }[extname(file).toLowerCase()];
      await checked(
        db.storage.from(bucket).upload(object, readFileSync(file), {
          contentType: mime,
          upsert: true,
        }),
      );
      r[field] = object;
    }
    records.push(
      Object.fromEntries(
        Object.entries(r).filter(([k]) => allowed.includes(k)),
      ),
    );
  }
  counts[table] = records.length;
  if (!records.length) continue;
  const names = allowed
    .filter((k) => records.some((r) => k in r))
    .map((k) => `"${k}"`)
    .join(",");
  const conflict =
    table === "profiles"
      ? `do update set ${allowed
          .filter((k) => k !== "id" && records.some((r) => k in r))
          .map((k) => `"${k}"=excluded."${k}"`)
          .join(",")}`
      : "do nothing";
  sql += `insert into public.${table}(${names}) select ${names} from jsonb_populate_recordset(null::public.${table},${quote(JSON.stringify(records))}::jsonb) on conflict ${table === "profiles" ? "(id) " : ""}${conflict};\n`;
}
for (const u of legacy.users_customuser)
  if (u.password.startsWith("pbkdf2_sha256$"))
    sql += `insert into app.legacy_auth values(${quote(users.get(u.id))},${quote(u.password)}) on conflict do nothing;\n`;
for (const table of Object.keys(mapping))
  sql += `alter table public.${table} enable trigger user;\n`;
sql +=
  "do $$ declare r record; s text; begin for r in select table_name from information_schema.columns where table_schema='public' and column_name='id' and is_identity='YES' loop s=pg_get_serial_sequence('public.'||r.table_name,'id');execute format('select setval(%L,greatest(coalesce((select max(id) from public.%I),0),1),exists(select 1 from public.%I))',s,r.table_name,r.table_name);end loop;end $$;\ninsert into app.import_runs(name) values('django-sqlite-v1');\ncommit;\n";
writeFileSync(".dist/import-legacy.sql", sql);
writeFileSync(".dist/import-counts.json", JSON.stringify(counts, null, 2));
console.log(
  "Prepared transactional data import in ignored .dist/import-legacy.sql; no source database changes made.",
);
// Apply with: supabase db query --linked --file .dist/import-legacy.sql
