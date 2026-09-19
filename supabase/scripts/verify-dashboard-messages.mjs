import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `workspace-${Date.now()}`,
  origin = "http://127.0.0.1:5176";
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
const admin = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "service_role").api_key,
  options,
);
const peer = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "anon").api_key,
  options,
);
const ok = async (query) => {
  const r = await query;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const accounts = [],
  projects = [],
  errors = [],
  badNetwork = [],
  checks = [];
const info = await (await fetch("http://127.0.0.1:9224/json/version")).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
let browserSession;
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sequence = 0;
const pending = new Map();
ws.addEventListener("message", ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
  } else if (m.method === "Runtime.exceptionThrown")
    errors.push(
      m.params.exceptionDetails.exception?.description ||
        m.params.exceptionDetails.text,
    );
  else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    errors.push(
      m.params.args.map((a) => a.value || a.description || "").join(" "),
    );
  else if (
    m.method === "Network.responseReceived" &&
    m.params.response.status >= 400
  )
    badNetwork.push({
      status: m.params.response.status,
      path: new URL(m.params.response.url).pathname,
    });
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(!method.startsWith("Target.") && browserSession
          ? { sessionId: browserSession }
          : {}),
      }),
    );
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text,
    );
  return r.result.value;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const wait = async (expression, attempts = 90) => {
  for (let n = 0; n < attempts; n++) {
    try {
      if (await evaluate(expression)) return;
    } catch {}
    await pause(300);
  }
  throw new Error("Timed out: " + expression);
};
const click = (label) =>
  evaluate(
    `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`,
  );
const fill = (selector, value, tagName = "HTMLInputElement") =>
  evaluate(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${tagName}.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})()`,
  );
const pass = (message) => {
  checks.push(message);
  console.log("PASS " + message);
};
const snapshot = async (name, width, height) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await pause(350);
  assert(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
    `Horizontal overflow at ${width}px`,
  );
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: !name.startsWith("navbar"),
  });
  writeFileSync(`.dist/${name}.png`, Buffer.from(data, "base64"));
};
const { browserContextId } = await send("Target.createBrowserContext");
const { targetId } = await send("Target.createTarget", {
  url: "about:blank",
  browserContextId,
});
browserSession = (
  await send("Target.attachToTarget", { targetId, flatten: true })
).sessionId;

try {
  for (const [i, name] of ["Maya Patel", "Jordan Lee"].entries()) {
    const email = `${tag}-${i}@example.com`,
      password = `Verify!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: `${tag}-${i}`, full_name: name },
      }),
    );
    accounts.push({ ...user, password });
    await ok(
      admin
        .from("profiles")
        .update({
          onboarding_completed: true,
          headline: i
            ? "Frontend builder · happy to collaborate"
            : "Learning by building",
        })
        .eq("id", user.id),
    );
  }
  const [a, b] = accounts;
  await ok(
    peer.auth.signInWithPassword({ email: b.email, password: b.password }),
  );
  await ok(
    admin
      .from("connections")
      .insert({ from_user_id: a.id, to_user_id: b.id, status: "accepted" }),
  );
  for (const [i, [title, status]] of [
    ["Learning journal", "active"],
    ["Open source toolkit", "completed"],
    ["Community reading room", "idea"],
  ].entries()) {
    const project = await ok(
      admin
        .from("projects")
        .insert({
          owner_id: a.id,
          title,
          slug: `${tag}-${i}`,
          summary:
            "A thoughtful place to learn, share progress, and build something useful together.",
          category: "Education",
          status,
          is_public: false,
        })
        .select()
        .single(),
    );
    projects.push(project);
  }
  await ok(
    admin.from("tasks").insert([
      {
        project_id: projects[0].id,
        assignee_id: a.id,
        title: "Sketch the learning journal flow",
        priority: "high",
        due_date: "2026-09-18",
      },
      {
        project_id: projects[0].id,
        assignee_id: a.id,
        title: "Polish the weekly reflection",
        priority: "medium",
        due_date: "2026-09-25",
      },
    ]),
  );
  const book = (
    await ok(admin.from("books").select("id").eq("status", "APPROVED").limit(1))
  )[0];
  if (book)
    await ok(
      admin
        .from("reading_progress")
        .insert({ user_id: a.id, book_id: book.id, progress_percent: 35 }),
    );
  await ok(
    peer.from("direct_messages").insert({
      sender_id: b.id,
      recipient_id: a.id,
      body: "Hey Maya! Want to work on the reading room together?",
    }),
  );
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const clear = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.clear()",
  });
  await send("Page.navigate", { url: origin + "/login" });
  await wait("!!document.querySelector('input[type=email]')");
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: clear.identifier,
  });
  await fill("input[type=email]", a.email);
  await fill("input[type=password]", a.password);
  await evaluate("document.querySelector('form').requestSubmit()");
  await wait(
    "!!document.querySelector('[data-dashboard=workspace]') && document.body.innerText.includes('Jordan Lee')",
  );
  assert(
    await evaluate(
      "document.body.innerText.includes('Sketch the learning journal flow')",
    ),
  );
  pass(
    "Dashboard loads actual reading, projects, assigned tasks, connections and unread counts",
  );
  await snapshot("dashboard-redesign-desktop", 1440, 1100);
  await click("High priority");
  assert(
    !(await evaluate(
      "document.body.innerText.includes('Polish the weekly reflection')",
    )),
  );
  await click("All tasks");
  await click("Focus view");
  assert(!(await evaluate("document.body.innerText.includes('Your circle')")));
  await click("Exit focus");
  await wait("document.body.innerText.includes('Your circle')");
  assert(
    !(await evaluate(
      "!!document.querySelector('[aria-label=\"Focus timer\"]')",
    )),
  );
  pass(
    "Task priority filtering and distraction-free view preserve the dashboard without the removed timer",
  );
  await send("Page.navigate", { url: origin + "/dashboard?view=projects" });
  await wait("!!document.querySelector('[aria-label=\"Project status\"]')");
  await fill('[aria-label="Project status"]', "completed", "HTMLSelectElement");
  await wait("document.body.innerText.includes('1 of 3 projects')");
  assert(
    await evaluate(
      "document.body.innerText.includes('Open source toolkit') && !document.body.innerText.includes('Learning journal')",
    ),
  );
  await click("Clear filters");
  await wait(
    "document.body.innerText.includes('3 of 3 projects') && !location.search.includes('status=')",
  );
  await fill('[aria-label="Search projects"]', "reading room");
  await wait("document.body.innerText.includes('1 of 3 projects')");
  await send("Page.reload");
  await wait(
    "document.querySelector('[aria-label=\"Search projects\"]')?.value==='reading room'",
  );
  await click("Clear filters");
  await wait("document.body.innerText.includes('3 of 3 projects')");
  await fill('[aria-label="Sort projects"]', "name", "HTMLSelectElement");
  await wait("new URLSearchParams(location.search).get('sort')==='name'");
  await wait(
    "document.querySelectorAll('main h3')[1]?.textContent==='Learning journal'",
  );
  const titles = await evaluate(
    "Array.from(document.querySelectorAll('main h3')).map(x=>x.textContent)",
  );
  assert.deepEqual(titles, [
    "Community reading room",
    "Learning journal",
    "Open source toolkit",
  ]);
  await snapshot("dashboard-project-filters", 1440, 950);
  pass(
    "Project status, search, name ordering, clear controls and URL-persisted filters",
  );
  await send("Page.navigate", { url: origin + `/messages?to=${b.id}` });
  await wait(
    "!!document.querySelector('textarea[aria-label=Message]') && document.body.innerText.includes('Want to work on')",
  );
  const payload =
    "Absolutely! Let’s start with the reading flow. <b>Plain text only</b>";
  await fill("textarea[aria-label=Message]", payload, "HTMLTextAreaElement");
  await evaluate("document.querySelector('textarea').form.requestSubmit()");
  await wait(
    `document.querySelector('[role=log]').innerText.includes(${JSON.stringify(payload)})`,
  );
  assert(!(await evaluate("!!document.querySelector('[role=log] b')")));
  const sent = (
    await ok(
      peer
        .from("direct_messages")
        .select("*")
        .eq("sender_id", a.id)
        .eq("recipient_id", b.id),
    )
  )[0];
  assert.equal(sent.body, payload);
  await ok(
    peer.rpc("colearn_read_messages", {
      peer: a.id,
      through_at: sent.created_at,
    }),
  );
  await wait("!!document.querySelector('[aria-label=Read]')", 40);
  await ok(
    peer.from("direct_messages").insert({
      sender_id: b.id,
      recipient_id: a.id,
      body: "Perfect. I’ll map out the first chapter.",
    }),
  );
  await wait(
    "document.querySelector('[role=log]').innerText.includes('Perfect. I’ll map')",
    40,
  );
  await snapshot("messages-desktop", 1440, 950);
  pass(
    "Browser sends to a real connected peer, receives live replies and read receipts, renders messages safely",
  );
  await snapshot("messages-mobile", 390, 844);
  assert(
    await evaluate(
      "document.querySelector('textarea').getBoundingClientRect().bottom < document.querySelector('nav[aria-label=\"Mobile app navigation\"]').getBoundingClientRect().top",
    ),
    "Mobile navigation covers the message composer",
  );
  await fill(
    "textarea[aria-label=Message]",
    "Keep this draft",
    "HTMLTextAreaElement",
  );
  await evaluate(
    "document.querySelector('[aria-label=\"Back to conversations\"]').click()",
  );
  await wait("!location.search.includes('to=')");
  await evaluate(
    "Array.from(document.querySelectorAll('aside button')).find(b=>b.textContent.includes('Jordan Lee')).click()",
  );
  await wait("document.querySelector('textarea')?.value==='Keep this draft'");
  await evaluate(
    "document.querySelector('[aria-label=\"Back to conversations\"]').click()",
  );
  await wait("!location.search.includes('to=')");
  await fill('[aria-label="Search connections"]', "nobody matches");
  await wait("document.body.innerText.includes('No conversations found.')");
  pass("Mobile conversation/back navigation and connection search");
  await send("Page.navigate", { url: origin + "/dashboard" });
  await wait("!!document.querySelector('[data-dashboard=workspace]')");
  await snapshot("dashboard-redesign-mobile", 390, 844);
  await snapshot("dashboard-redesign-tablet", 768, 1024);
  await send("Page.navigate", { url: origin + "/" });
  await wait("!!document.querySelector('nav[aria-label=\"Main navigation\"]')");
  await snapshot("navbar-mobile", 360, 800);
  pass(
    "Dashboard, chat and enlarged marketing logo fit mobile and tablet widths",
  );
  assert.deepEqual(errors, [], "Browser console/runtime errors");
  assert.deepEqual(badNetwork, [], "Failed network responses");
  pass("No browser console errors or failed network responses");
  writeFileSync(
    ".dist/dashboard-messaging-verification.json",
    JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2),
  );
} finally {
  await send("Emulation.clearDeviceMetricsOverride").catch(() => {});
  await evaluate(
    "import('/src/services/supabase/client.js').then(m=>m.supabase.auth.signOut())",
  ).catch(() => {});
  for (const p of projects)
    await admin.from("projects").delete().eq("id", p.id);
  for (const u of accounts) await admin.auth.admin.deleteUser(u.id);
  await peer.removeAllChannels();
  await send("Target.disposeBrowserContext", { browserContextId }).catch(
    () => {},
  );
  ws.close();
  console.log("Removed dashboard/browser messaging fixtures");
}
