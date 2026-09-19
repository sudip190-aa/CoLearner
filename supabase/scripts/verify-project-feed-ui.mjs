import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  origin = "http://127.0.0.1:5176",
  tag = `private-reply-ui-${Date.now()}`;
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
const admin = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "service_role").api_key,
  options,
);
const ok = async (p) => {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms)),
  accounts = [],
  contexts = [],
  checks = [],
  errors = [],
  network = [];
const pass = (s) => {
  checks.push(s);
  console.log("PASS " + s);
};
const info = await (await fetch("http://127.0.0.1:9224/json/version")).json(),
  ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
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
    network.push({
      status: m.params.response.status,
      path: new URL(m.params.response.url).pathname,
    });
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
async function page(account) {
  const { browserContextId } = await send("Target.createBrowserContext");
  contexts.push(browserContextId);
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
    browserContextId,
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const cmd = (m, p = {}) => send(m, p, sessionId);
  const evaluate = async (expression) => {
    const r = await cmd("Runtime.evaluate", {
      expression: `(async()=>(${expression}))()`,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description || r.exceptionDetails.text,
      );
    return r.result.value;
  };
  const wait = async (expression, n = 240) => {
    for (let i = 0; i < n; i++) {
      try {
        if (await evaluate(expression)) return;
      } catch {}
      await pause(250);
    }
    throw new Error(
      `Timed out: ${expression}\n${(await evaluate("document.body.innerText")).slice(-2300)}\nResources: ${JSON.stringify(await evaluate("performance.getEntriesByType('resource').filter(e=>e.name.includes('supabase.co')).slice(-10).map(e=>({path:new URL(e.name).pathname,ms:e.duration}))"))}`,
    );
  };
  const navigate = async (path) => {
    await cmd("Page.navigate", { url: origin + path });
    await wait(
      `location.pathname===${JSON.stringify(path.split("?")[0])} && document.readyState==='complete'`,
    );
  };
  const click = async (text) => {
    await wait(
      `[...document.querySelectorAll('button'),...document.querySelectorAll('a')].some(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled)`,
    );
    await evaluate(
      `[...document.querySelectorAll('button'),...document.querySelectorAll('a')].find(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled).click()`,
    );
  };
  const fill = async (selector, value, type = "HTMLInputElement") =>
    evaluate(
      `(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${type}.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})()`,
    );
  const upload = async (selector, path) => {
    const { root } = await cmd("DOM.getDocument");
    const { nodeId } = await cmd("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    await cmd("DOM.setFileInputFiles", { nodeId, files: [path] });
  };
  const screenshot = async (name) => {
    const { data } = await cmd("Page.captureScreenshot", { format: "png" });
    writeFileSync(`.dist/${name}.png`, Buffer.from(data, "base64"));
  };
  await cmd("Page.enable");
  await cmd("Runtime.enable");
  await cmd("Network.enable");
  await cmd("Emulation.setDeviceMetricsOverride", {
    width: 1365,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cmd("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.socialSoundCount=0;const RealAudio=window.AudioContext;window.AudioContext=class extends RealAudio{createOscillator(){window.socialSoundCount++;return super.createOscillator()}}`,
  });
  await cmd("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.groupTest={pcs:[],tracks:[]};const OriginalPC=window.RTCPeerConnection;window.RTCPeerConnection=class extends OriginalPC {constructor(...a){super(...a);window.groupTest.pcs.push(this)}};const originalMic=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async(...a)=>{const stream=await originalMic(...a);window.groupTest.tracks.push(...stream.getTracks());return stream}`,
  });
  await navigate("/login");
  await wait("!!document.querySelector('input[type=email]')");
  if (account) {
    await fill("input[type=email]", account.email);
    await fill("input[type=password]", account.password);
    await evaluate("document.querySelector('form').requestSubmit()");
    await wait(
      "location.pathname==='/dashboard' && document.body.innerText.includes('Your circle')",
    );
  }
  return { cmd, evaluate, wait, navigate, click, fill, upload, screenshot };
}

try {
  for (const name of ["Maya Chen", "Aria Shah"]) {
    const email = `${tag}-${accounts.length}@colearn.example`,
      password = `Test!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${accounts.length}`,
          full_name: name,
        },
      }),
    );
    accounts.push({ user, email, password });
    await ok(
      admin
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id),
    );
  }
  const [a, b] = accounts;
  const list = [];
  for (let i = 0; i < 9; i++)
    list.push(
      await ok(
        admin
          .from("projects")
          .insert({
            owner_id: i % 2 ? a.user.id : b.user.id,
            title: `${tag} Project ${i}`,
            slug: `${tag}-${i}`,
            summary: "An interactive project filter fixture.",
            description: "Verify ordering and combined filters.",
            is_public: true,
            category: i % 2 ? "Web" : "Data",
            tech_stack: i % 2 ? ["React"] : ["Python"],
            status: i === 1 ? "completed" : "active",
            created_at: new Date(Date.now() - (9 - i) * 60000).toISOString(),
          })
          .select()
          .single(),
      ),
    );
  const A = await page(a);
  await A.navigate("/projects");
  await A.wait("!!document.querySelector('[aria-label=\"Search projects\"]')");
  await A.fill('[aria-label="Search projects"]', tag);
  const titles = () =>
    A.evaluate(
      "[...document.querySelectorAll('[role=tabpanel] article h2')].map(el=>el.textContent)",
    );
  await A.wait(
    `document.querySelector('[role=tabpanel] article h2')?.textContent===${JSON.stringify(tag + " Project 8")}`,
  );
  assert.deepEqual(
    await titles(),
    [8, 7, 6, 5, 4, 3].map((i) => tag + " Project " + i),
  );
  await A.evaluate(
    "document.querySelector('[aria-label^=\"Filter projects\"]').click()",
  );
  const label = async (name) =>
    await A.evaluate(
      `[...document.querySelectorAll('#project-filters label')].find(el=>el.textContent.trim()===${JSON.stringify(name)}).htmlFor`,
    );
  await A.fill(`[id="${await label("Category")}"]`, "Web", "HTMLSelectElement");
  await A.wait(
    `document.querySelector('[role=tabpanel] article h2')?.textContent===${JSON.stringify(tag + " Project 7")}`,
  );
  await A.fill(
    `[id="${await label("Status")}"]`,
    "active",
    "HTMLSelectElement",
  );
  await A.wait(
    "document.querySelectorAll('[role=tabpanel] article').length===3",
  );
  await A.click("React");
  await A.wait(
    "document.querySelectorAll('[role=tabpanel] article').length===3",
  );
  assert.deepEqual(
    await titles(),
    [7, 5, 3].map((i) => tag + " Project " + i),
  );
  await A.click("Python");
  await A.wait(
    "!document.querySelector('[role=tabpanel] article') && !document.querySelector('[role=tabpanel] .animate-pulse')",
  );
  assert.equal((await titles()).length, 0);
  await A.click("Reset filters");
  await A.wait(
    "document.querySelectorAll('[role=tabpanel] article').length===6",
  );
  assert.deepEqual(
    await titles(),
    [8, 7, 6, 5, 4, 3].map((i) => tag + " Project " + i),
  );
  const next = await A.evaluate(
    "[...document.querySelectorAll('button')].find(b=>/Next/.test(b.getAttribute('aria-label')||''))?.getAttribute('aria-label')",
  );
  assert(next);
  await A.evaluate(
    `document.querySelector('[aria-label=${JSON.stringify(next)}]').click()`,
  );
  await A.wait(
    "document.querySelectorAll('[role=tabpanel] article').length===3",
  );
  assert.deepEqual(
    await titles(),
    [2, 1, 0].map((i) => tag + " Project " + i),
  );
  await A.evaluate("document.getElementById('projects-tab-mine').click()");
  await A.wait(
    "document.querySelectorAll('[role=tabpanel] article').length===4",
  );
  assert.deepEqual(
    await titles(),
    [7, 5, 3, 1].map((i) => tag + " Project " + i),
  );
  const fresh = await ok(
    admin
      .from("projects")
      .insert({
        owner_id: a.user.id,
        title: `${tag} Newest`,
        slug: tag + "-latest",
        description: "A new project appears without reloading.",
        is_public: true,
      })
      .select()
      .single(),
  );
  await A.wait(
    `document.querySelector('[role=tabpanel] article h2')?.textContent===${JSON.stringify(fresh.title)}`,
  );
  pass(
    "Project UI combines search/category/status/technology, clears filters, paginates in newest order, isolates My projects and receives new projects live",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  for (const account of accounts)
    await ok(admin.auth.admin.deleteUser(account.user.id));
  ws.close();
  writeFileSync(
    ".dist/project-feed-ui-verification.json",
    JSON.stringify({ checks, errors, network, fixturesRemoved: true }, null, 2),
  );
}
