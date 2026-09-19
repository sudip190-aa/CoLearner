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
  const email = `${tag}@colearn.example`,
    password = `Test!${randomUUID()}`;
  const { user } = await ok(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: tag, full_name: "Maya Chen" },
    }),
  );
  accounts.push({ user, email, password });
  await ok(
    admin
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id),
  );
  const A = await page(accounts[0]);
  await A.navigate("/profile");
  await A.wait("document.body.innerText.includes('Add showcase')");
  await A.click("Add showcase");
  const fillLabel = async (name, value, type = "HTMLInputElement") => {
    const id = await A.evaluate(
      `[...document.querySelectorAll('[role=dialog] label')].find(el=>el.textContent.trim().startsWith(${JSON.stringify(name)})).htmlFor`,
    );
    await A.fill(`[id="${id}"]`, value, type);
  };
  await fillLabel("Project title", "Climate map");
  await fillLabel(
    "Description",
    "A map of local environmental observations.",
    "HTMLTextAreaElement",
  );
  await fillLabel("Live / demo link", "https://example.com/climate");
  const pngPath =
    process.cwd().replaceAll("\\", "/") + "/.dist/showcase-test.png";
  const png = await A.evaluate(
    "(()=>{const c=document.createElement('canvas');c.width=600;c.height=360;const ctx=c.getContext('2d');ctx.fillStyle='#2e78e5';ctx.fillRect(0,0,600,360);ctx.fillStyle='white';ctx.font='30px sans-serif';ctx.fillText('Climate map',40,180);return c.toDataURL('image/png').split(',')[1]})()",
  );
  writeFileSync(pngPath, Buffer.from(png, "base64"));
  await A.upload('input[aria-label="Showcase image"]', pngPath);
  await A.wait("!!document.querySelector('img[alt=\"Showcase preview\"]')");
  await A.click("Save showcase");
  await A.wait(
    "!!document.querySelector('[data-showcase-id]') && !document.querySelector('[role=dialog]')",
  );
  const saved = await ok(
    admin.from("profile_showcases").select("*").eq("user_id", user.id).single(),
  );
  assert.equal(
    (
      await ok(
        admin.from("project_members").select("id").eq("user_id", user.id),
      )
    ).length,
    0,
  );
  assert.equal(
    await A.evaluate("document.querySelector('[data-showcase-id] a').href"),
    "https://example.com/climate",
  );
  const G = await page();
  await G.navigate("/u/" + tag);
  await G.wait("!!document.querySelector('[data-showcase-id] img')");
  assert(
    !(await G.evaluate(
      "[...document.querySelectorAll('button')].some(b=>b.textContent==='Add showcase')",
    )),
  );
  await A.evaluate(
    "document.querySelector('[aria-label=\"Edit Climate map\"]').click()",
  );
  await fillLabel("Project title", "Climate atlas");
  await fillLabel(
    "Description",
    "Updated observations and charts.",
    "HTMLTextAreaElement",
  );
  await fillLabel("Live / demo link", "https://example.com/atlas");
  await A.upload('input[aria-label="Showcase image"]', pngPath);
  await A.click("Save showcase");
  await A.wait(
    "document.querySelector('[data-showcase-id] h3')?.textContent==='Climate atlas' && !document.querySelector('[role=dialog]')",
  );
  await A.cmd("Page.reload");
  await A.wait(
    "document.querySelector('[data-showcase-id] h3')?.textContent==='Climate atlas'",
  );
  assert.equal(
    await A.evaluate("document.querySelector('[data-showcase-id] a').href"),
    "https://example.com/atlas",
  );
  const updated = await ok(
    admin
      .from("profile_showcases")
      .select("image_path,description")
      .eq("id", saved.id)
      .single(),
  );
  assert.notEqual(updated.image_path, saved.image_path);
  assert.equal(updated.description, "Updated observations and charts.");
  await A.screenshot("profile-showcase-desktop");
  await A.cmd("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await A.evaluate(
    "document.querySelector('[aria-label=\"Profile showcase\"]').scrollIntoView()",
  );
  await pause(400);
  assert(
    await A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await A.screenshot("profile-showcase-mobile");
  await A.evaluate(
    "document.querySelector('[aria-label=\"Remove Climate atlas\"]').click()",
  );
  await A.click("Remove showcase");
  await A.wait(
    "!document.querySelector('[data-showcase-id]') && !document.querySelector('[role=dialog]')",
  );
  assert.equal(
    (await ok(admin.from("profile_showcases").select("id").eq("id", saved.id)))
      .length,
    0,
  );
  pass(
    "Standalone profile showcase create/edit/image replacement/live link/public display/refresh/delete on desktop and mobile",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  for (const account of accounts) {
    const dirs = await ok(
      admin.storage.from("showcase-images").list(account.user.id),
    );
    for (const dir of dirs) {
      const files = await ok(
        admin.storage
          .from("showcase-images")
          .list(account.user.id + "/" + dir.name),
      );
      if (files.length)
        await ok(
          admin.storage
            .from("showcase-images")
            .remove(
              files.map((f) => `${account.user.id}/${dir.name}/${f.name}`),
            ),
        );
    }
    await ok(admin.auth.admin.deleteUser(account.user.id));
  }
  ws.close();
  writeFileSync(
    ".dist/showcases-ui-verification.json",
    JSON.stringify({ checks, errors, network, fixturesRemoved: true }, null, 2),
  );
}
