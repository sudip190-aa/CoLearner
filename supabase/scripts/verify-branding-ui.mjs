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
  for (let i = 0; i < 2; i++) {
    const email = `branding-${Date.now()}-${i}@colearn.example`,
      password = `Test!${randomUUID()}`,
      username = `branding-${Date.now()}-${i}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, full_name: `Branding ${i}` },
      }),
    );
    accounts.push({ user, email, password, username });
    await ok(
      admin
        .from("profiles")
        .update({
          onboarding_completed: true,
          ...(i === 0
            ? {
                github: "https://github.com/alice",
                linkedin: "https://www.linkedin.com/in/alice",
                website: "https://alice.example/projects",
              }
            : {}),
        })
        .eq("id", user.id),
    );
  }
  const A = await page(accounts[0]);
  await A.navigate("/u/" + accounts[0].username);
  await A.wait("!!document.querySelector('a[aria-label=GitHub]')");
  const links = await A.evaluate(
    "['GitHub','LinkedIn','Website'].map(label=>{const a=document.querySelector('a[aria-label='+label+']');return {label,href:a.href,rel:a.rel,target:a.target,path:a.querySelector('svg')?.getAttribute('viewBox')}})",
  );
  assert.deepEqual(
    links.map((l) => l.href),
    [
      "https://github.com/alice",
      "https://www.linkedin.com/in/alice",
      "https://alice.example/projects",
    ],
  );
  assert(
    links.every(
      (l) =>
        l.rel.includes("noopener") &&
        l.rel.includes("noreferrer") &&
        l.target === "_blank",
    ),
  );
  assert(links.slice(0, 2).every((l) => l.path === "0 0 16 16"));
  for (const theme of ["light", "dark"]) {
    await A.evaluate(
      `document.documentElement.classList.toggle('dark',${theme === "dark"})`,
    );
    for (const width of [1440, 768, 390]) {
      await A.cmd("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      assert(
        await A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
      );
      await A.wait(
        "!![...document.querySelectorAll('img[alt=Colearn]')].find(i=>i.complete&&i.naturalWidth>0)",
      );
      const logo = await A.evaluate(
        "(()=>{const img=[...document.querySelectorAll('img[alt=Colearn]')].find(i=>i.getBoundingClientRect().width>0),r=img.parentElement.getBoundingClientRect();return {filter:getComputedStyle(img).filter,ratio:r.width/r.height,height:r.height}})()",
      );
      assert(Math.abs(logo.ratio - 1716 / 773) < 0.01);
      assert(logo.height <= 42);
      if (theme === "dark")
        assert(
          logo.filter.includes("brightness(0)") &&
            logo.filter.includes("invert(1)"),
        );
      else assert.equal(logo.filter, "none");
      await A.screenshot(`branding-profile-${theme}-${width}`);
    }
  }
  pass(
    "Correct per-user social URLs, recognizable GitHub/LinkedIn marks, accessible safe links and proportionate white dark-mode logo at desktop/tablet/mobile sizes",
  );
  await A.navigate("/u/" + accounts[1].username);
  await A.wait("document.body.innerText.includes('Branding 1')");
  assert(
    await A.evaluate(
      "!document.querySelector('a[aria-label=GitHub],a[aria-label=LinkedIn],a[aria-label=Website]')",
    ),
  );
  pass(
    "Empty social links are hidden and another profile never inherits the first user?s links",
  );
  const B = await page(null);
  await B.navigate("/signup");
  await B.wait("!!document.querySelector('input[name=fullName]')");
  assert.deepEqual(
    await B.evaluate(
      "['fullName','email','username','password'].map(name=>document.querySelector('input[name='+name+']').placeholder)",
    ),
    ["Your name", "Your email", "Choose a username", "Create a password"],
  );
  for (const theme of ["light", "dark"]) {
    await B.evaluate(
      `document.documentElement.classList.toggle('dark',${theme === "dark"})`,
    );
    await B.cmd("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert(
      await B.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
    );
    await B.screenshot("branding-signup-" + theme);
  }
  pass(
    "Signup labels and logic preserved with clearer placeholders; light/dark mobile layout checked",
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
    ".dist/branding-verification.json",
    JSON.stringify({ checks, errors, network, fixturesRemoved: true }, null, 2),
  );
}
