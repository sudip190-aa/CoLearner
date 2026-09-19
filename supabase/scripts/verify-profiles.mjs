import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  origin = "http://127.0.0.1:5176",
  tag = `profile-${Date.now()}`;
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

const guest = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "anon").api_key,
  options,
);
let passed = false;
try {
  for (let i = 0; i < 2; i++) {
    const email = `${tag}-${i}@colearn.example`,
      password = `Test!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${i}`,
          full_name: i ? "Profile Visitor" : "Profile Owner",
        },
      }),
    );
    accounts.push({ user, email, password });
    await ok(
      admin
        .from("profiles")
        .update({
          onboarding_completed: true,
          role: i ? "learner" : "mentor",
          bio: "A public profile that opens correctly.",
        })
        .eq("id", user.id),
    );
  }
  const [owner, visitor] = accounts,
    username = owner.user.user_metadata.username;
  await ok(
    admin.from("projects").insert([
      {
        owner_id: owner.user.id,
        slug: tag + "-public",
        title: "Public profile showcase",
        is_public: true,
      },
      {
        owner_id: owner.user.id,
        slug: tag + "-private",
        title: "Private project must stay hidden",
        is_public: false,
      },
    ]),
  );
  const portfolio = await ok(
    guest.rpc("colearn_portfolio", { username: username.toUpperCase() }),
  );
  assert.equal(portfolio.profile.id, owner.user.id);
  assert.equal(portfolio.profile.role, "mentor");
  assert.equal(portfolio.heatmap.length, 12);
  assert(portfolio.projects.some((p) => p.slug === tag + "-public"));
  assert(!portfolio.projects.some((p) => p.slug === tag + "-private"));
  assert(
    (await guest.rpc("colearn_portfolio_before_books", { username })).error,
    "Unfiltered helper must remain private",
  );
  for (const book of portfolio.books)
    assert.equal(
      (
        await ok(
          admin.from("books").select("status").eq("id", book.id).single(),
        )
      ).status,
      "APPROVED",
    );
  assert(
    (await guest.rpc("colearn_portfolio", { username: tag + "-missing" }))
      .error,
  );
  pass(
    "Anonymous portfolio RPC resolves case-insensitive usernames, preserves shape and keeps private projects/helper inaccessible",
  );
  const A = await page(owner);
  await A.navigate("/profile");
  await A.wait(
    `location.pathname==='/u/${username}' && document.body.innerText.includes('Profile Owner') && !document.body.innerText.includes('could not load')`,
  );
  assert(await A.evaluate("document.body.innerText.includes('Mentor')"));
  assert(
    await A.evaluate(
      "document.body.innerText.includes('Public profile showcase')",
    ),
  );
  assert(
    !(await A.evaluate(
      "document.body.innerText.includes('Private project must stay hidden')",
    )),
  );
  const before = await A.evaluate("performance.timeOrigin");
  await A.cmd("Page.reload");
  await A.wait(
    `performance.timeOrigin!==${before} && document.body.innerText.includes('Profile Owner')`,
  );
  pass(
    "Own-profile redirect and refresh render the correct role and public projects",
  );
  const B = await page(visitor);
  await B.navigate(`/u/${username}`);
  await B.wait(
    "document.body.innerText.includes('Profile Owner') && document.body.innerText.includes('Connect')",
  );
  const G = await page();
  await G.navigate(`/u/${username}`);
  await G.wait(
    "document.body.innerText.includes('Profile Owner') && document.body.innerText.includes('Join Colearn')",
  );
  await G.screenshot("profile-fixed-desktop");
  await G.cmd("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await pause(350);
  assert(
    await G.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await G.screenshot("profile-fixed-mobile");
  pass(
    "Another account and logged-out visitor can open the public profile; mobile layout fits",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  passed = true;
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  for (const account of accounts)
    await admin.auth.admin.deleteUser(account.user.id);
  ws.close();
  writeFileSync(
    ".dist/profile-verification.json",
    JSON.stringify(
      { passed, checks, errors, network, fixturesRemoved: true },
      null,
      2,
    ),
  );
}
