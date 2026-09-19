// Live RLS + Realtime integration test. All disposable accounts are removed.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `chat-${Date.now()}`;
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
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = () =>
  createClient(
    `https://${ref}.supabase.co`,
    keys.find((k) => k.name === "anon").api_key,
    options,
  );
const admin = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "service_role").api_key,
  options,
);
const ok = async (query) => {
  const r = await query;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const deny = async (query, label) => {
  const r = await query;
  assert(r.error, label);
};
const accounts = [],
  clients = [];
try {
  for (let n = 0; n < 3; n++) {
    const email = `${tag}-${n}@example.com`,
      password = `Test!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${n}`,
          full_name: `Messaging test ${n}`,
        },
      }),
    );
    accounts.push(user);
    const c = client();
    clients.push(c);
    const signed = await ok(c.auth.signInWithPassword({ email, password }));
    await c.realtime.setAuth(signed.session.access_token);
  }
  const [a, b, c] = clients,
    [A, B, C] = accounts;
  const send = (by, to, body, extra = {}) =>
    by
      .from("direct_messages")
      .insert({
        sender_id: by === a ? A.id : by === b ? B.id : C.id,
        recipient_id: to,
        body,
        ...extra,
      })
      .select()
      .single();
  await deny(
    send(a, B.id, "Cannot send before connecting"),
    "Unconnected send succeeded",
  );
  await ok(
    a.rpc("colearn_action", {
      action: "connection",
      payload: { username: B.user_metadata.username },
    }),
  );
  await deny(
    send(a, B.id, "Still pending"),
    "Pending connection sent a message",
  );
  await ok(
    b.rpc("colearn_action", {
      action: "connection",
      payload: { username: A.user_metadata.username, action: "accept" },
    }),
  );
  let eventReceived = false,
    intruderReceived = false;
  const subscribe = (who, onEvent) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Realtime subscription timed out")),
        20000,
      );
      const channel = who
        .channel(`test:${randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `recipient_id=eq.${B.id}`,
          },
          onEvent,
        )
        .subscribe((status, error) => {
          if (error) console.log("Realtime status", status, error.message);
          if (status === "SUBSCRIBED") {
            clearTimeout(timer);
            resolve(channel);
          }
        });
    });
  await Promise.all([
    subscribe(b, () => {
      eventReceived = true;
    }),
    subscribe(c, () => {
      intruderReceived = true;
    }),
  ]);
  const message = await ok(send(a, B.id, "Private hello"));
  for (let n = 0; n < 90 && !eventReceived; n++)
    await new Promise((r) => setTimeout(r, 500));
  assert(eventReceived, "Recipient did not receive Realtime message");
  assert(!intruderReceived, "Realtime leaked to outsider");
  assert.equal((await ok(c.from("direct_messages").select("*"))).length, 0);
  await ok(admin.from("profiles").update({ is_staff: true }).eq("id", C.id));
  assert.equal(
    (await ok(c.from("direct_messages").select("*"))).length,
    0,
    "Staff bypassed conversation privacy",
  );
  const publicClient = client();
  clients.push(publicClient);
  await deny(
    publicClient.from("direct_messages").select("*"),
    "Anonymous user could read private messages",
  );
  await deny(
    send(a, B.id, "Spoof", { sender_id: C.id }),
    "Sender spoofing succeeded",
  );
  await deny(
    send(a, B.id, "Forged read", { read_at: new Date().toISOString() }),
    "Sender forged receipt",
  );
  await deny(
    send(a, B.id, "Forged time", { created_at: "2000-01-01" }),
    "Sender forged timestamp",
  );
  await deny(send(a, A.id, "Self"), "Self messaging allowed");
  await deny(send(a, B.id, "  "), "Empty message allowed");
  await deny(send(a, B.id, "x".repeat(4001)), "Oversized message allowed");
  await deny(send(a, B.id, "x" + " ".repeat(4000)), "Whitespace bypassed message size limit");
  await deny(
    b.from("direct_messages").update({ body: "Altered" }).eq("id", message.id),
    "Recipient edited body",
  );
  await deny(
    a.from("direct_messages").delete().eq("id", message.id),
    "Sender deleted immutable message",
  );
  assert.equal(
    (await ok(b.rpc("colearn_message_contacts")))[0].unread_count,
    1,
  );
  await ok(
    a.rpc("colearn_read_messages", {
      peer: B.id,
      through_at: new Date().toISOString(),
    }),
  );
  assert.equal(
    (
      await ok(
        a
          .from("direct_messages")
          .select("read_at")
          .eq("id", message.id)
          .single(),
      )
    ).read_at,
    null,
  );
  await ok(
    b.rpc("colearn_read_messages", {
      peer: A.id,
      through_at: message.created_at,
    }),
  );
  assert(
    (
      await ok(
        a
          .from("direct_messages")
          .select("read_at")
          .eq("id", message.id)
          .single(),
      )
    ).read_at,
  );
  assert.equal(
    (await ok(b.rpc("colearn_message_contacts")))[0].unread_count,
    0,
  );
  console.log(
    "PASS accepted-connection gating, private reads, spoofing protection, message constraints, read receipts and Realtime isolation",
  );
  await ok(
    a
      .from("direct_messages")
      .insert(
        Array.from({ length: 29 }, (_, i) => ({
          sender_id: A.id,
          recipient_id: B.id,
          body: `Rate limit fixture ${i}`,
        })),
      ),
  );
  await deny(
    send(a, B.id, "Over the limit"),
    "Message rate limit was not enforced",
  );
  console.log("PASS database enforces a 30-message-per-minute sender limit");
  await ok(admin.from("profiles").update({ is_active: false }).eq("id", B.id));
  await deny(
    send(a, B.id, "Inactive peer"),
    "Inactive recipient accepted a message",
  );
  assert.equal((await ok(b.from("direct_messages").select("*"))).length, 0);
  await ok(admin.from("profiles").update({ is_active: true }).eq("id", B.id));
  await ok(
    a.rpc("colearn_action", {
      action: "connection",
      payload: { username: B.user_metadata.username, action: "cancel" },
    }),
  );
  await deny(send(a, B.id, "Disconnected"), "Disconnected sender could write");
  console.log("PASS inactive users and removed connections cannot message");
} finally {
  for (const c of clients) await c.removeAllChannels();
  for (const u of accounts) await admin.auth.admin.deleteUser(u.id);
  console.log("Removed all messaging test accounts and records");
}
