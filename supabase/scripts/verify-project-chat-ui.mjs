import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  origin = "http://127.0.0.1:5176",
  tag = `project-chat-ui-${Date.now()}`;
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
    source: `window.groupTest={pcs:[],tracks:[]};const OriginalPC=window.RTCPeerConnection;window.RTCPeerConnection=class extends OriginalPC {constructor(...a){super(...a);window.groupTest.pcs.push(this)} addTrack(track){return super.addTrack(track)} async setRemoteDescription(sdp){if(window.retryFirstOffer && sdp.type==='offer'){window.retryFirstOffer=false;throw new DOMException('Retry test','OperationError')}return super.setRemoteDescription(sdp)}};const originalMic=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async(...a)=>{const stream=await originalMic(...a);window.groupTest.tracks.push(...stream.getTracks());return stream}`,
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
  for (const name of ["Maya Chen", "Aria Shah", "Sam Rivera"]) {
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
  const [a, b, c] = accounts;
  const project = await ok(
    admin
      .from("projects")
      .insert({
        owner_id: a.user.id,
        slug: tag,
        title: "Study circle",
        is_public: true,
        status: "active",
      })
      .select()
      .single(),
  );
  await ok(
    admin
      .from("project_members")
      .insert({ project_id: project.id, user_id: b.user.id }),
  );
  const A = await page(a),
    B = await page(b),
    C = await page(c);
  for (const P of [A, B, C]) await P.navigate(`/projects/${tag}/chat`);
  await A.wait(
    "!!document.querySelector('textarea[aria-label=\"Project message\"]')",
  );
  await B.wait(
    "!!document.querySelector('textarea[aria-label=\"Project message\"]')",
  );
  await C.wait("document.body.innerText.includes('Members only')");
  await A.click("2 members");
  await A.wait(
    "document.querySelector('[aria-label=\"Project chat members\"]').textContent.includes('Aria Shah')",
  );
  await A.fill(
    'textarea[aria-label="Project message"]',
    "Let us plan the next chapter.",
    "HTMLTextAreaElement",
  );
  await A.evaluate(
    "document.querySelector('button[aria-label=\"Send project message\"]').click()",
  );
  await B.wait(
    "document.querySelector('[role=log]').textContent.includes('Let us plan the next chapter.')",
  );
  await B.evaluate(
    "document.querySelector('[aria-label=\"Reply to Maya Chen\"]').click()",
  );
  await B.fill(
    'textarea[aria-label="Project message"]',
    "I can review the examples.",
    "HTMLTextAreaElement",
  );
  await B.evaluate(
    "document.querySelector('button[aria-label=\"Send project message\"]').click()",
  );
  await A.wait(
    "document.querySelector('[role=log]').textContent.includes('I can review the examples.')",
  );
  await A.cmd("Page.reload");
  await A.wait(
    "document.querySelector('[role=log]')?.textContent.includes('I can review the examples.')",
  );
  assert(
    await A.evaluate(
      "!!document.querySelector('[aria-label=\"View original message\"]')",
    ),
  );
  pass(
    "Two-member realtime group chat, sender identity, replies and refresh persistence; non-member UI denied",
  );
  await ok(
    admin
      .from("project_members")
      .insert({ project_id: project.id, user_id: c.user.id }),
  );
  await C.wait(
    "!!document.querySelector('textarea[aria-label=\"Project message\"]')",
  );
  for (const P of [A, B, C]) await P.evaluate("window.retryFirstOffer=true");
  await A.click("Start voice call");
  await A.wait("document.body.innerText.includes('Leave call')");
  await B.wait(
    "[...document.querySelectorAll('button')].some(x=>x.textContent==='Join call')",
  );
  await B.click("Join call");
  await C.wait(
    "[...document.querySelectorAll('button')].some(x=>x.textContent==='Join call')",
  );
  await C.click("Join call");
  for (const P of [A, B, C])
    await P.wait(
      "window.groupTest.pcs.filter(pc=>pc.connectionState==='connected').length===2",
      160,
    );
  await pause(1800);
  for (const P of [A, B, C]) {
    const audio = await P.evaluate(
      "Promise.all(window.groupTest.pcs.filter(p=>p.connectionState==='connected').map(async p=>{const s=[...(await p.getStats()).values()];return {sent:s.find(x=>x.type==='outbound-rtp'&&x.kind==='audio')?.packetsSent||0,received:s.find(x=>x.type==='inbound-rtp'&&x.kind==='audio')?.packetsReceived||0,energy:s.find(x=>x.type==='inbound-rtp'&&x.kind==='audio')?.totalAudioEnergy||0}}))",
    );
    assert.equal(audio.length, 2);
    assert(
      await P.evaluate(
        "[...document.querySelectorAll('audio')].filter(a=>a.srcObject&&!a.paused&&!a.muted).length===2",
      ),
    );
    for (let i = 0; i < 2; i++)
      await P.wait(
        `[...document.querySelectorAll('meter')][${i}]?.value>0.001`,
      );

    assert(
      audio.every((s) => s.sent > 0 && s.received > 0 && s.energy > 0),
      JSON.stringify(audio),
    );
  }
  pass(
    "Three-member group voice establishes all mesh connections with bidirectional packets and actual audio energy",
  );
  await A.screenshot("project-group-chat-desktop");
  for (const theme of ["light", "dark"]) {
    await A.evaluate(
      `document.querySelector('[aria-label="Switch to ${theme} mode"]')?.click()`,
    );
    for (const width of [1440, 390]) {
      await A.cmd("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await pause(150);
      assert(
        await A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
      );
      assert.equal(
        await A.evaluate("document.documentElement.dataset.theme"),
        theme,
      );
      await A.screenshot(`project-group-call-${theme}-${width}`);
    }
  }
  await A.cmd("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  pass(
    "Active group voice stays readable and fits desktop/mobile in both themes",
  );
  await A.evaluate(
    "document.querySelector('[aria-label=\"Mute group microphone\"]').click()",
  );
  assert(await A.evaluate("window.groupTest.tracks.every(t=>!t.enabled)"));
  await A.evaluate(
    "document.querySelector('[aria-label=\"Unmute group microphone\"]').click()",
  );
  const removalNetwork = network.length;
  await ok(
    admin
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", c.user.id),
  );
  await C.wait("document.body.innerText.includes('Members only')");
  await C.wait("window.groupTest.tracks.every(t=>t.readyState==='ended')");
  await A.wait(
    "window.groupTest.pcs.filter(pc=>pc.connectionState==='connected').length===1",
  );
  await A.click("Leave call");
  await B.click("Leave call");
  for (const P of [A, B])
    await P.wait(
      "window.groupTest.tracks.every(t=>t.readyState==='ended') && window.groupTest.pcs.every(p=>p.connectionState==='closed')",
    );
  const removedRequests = network.splice(removalNetwork);
  assert(
    removedRequests.every(
      (r) =>
        r.status === 403 &&
        [
          "/rest/v1/rpc/colearn_project_voice",
          "/rest/v1/project_voice_signals",
        ].includes(r.path),
    ),
  );
  pass(
    "Group mute, leave, microphone cleanup and removal during an active call work",
  );
  await A.click("Start voice call");
  await B.click("Join call");
  for (const P of [A, B])
    await P.wait(
      "groupTest.pcs.filter(p=>p.connectionState==='connected').length===1",
    );
  await B.cmd("Page.reload");
  await A.wait("groupTest.pcs.every(p=>p.connectionState==='closed')");
  await B.click("Join call");
  for (const P of [A, B])
    await P.wait(
      "groupTest.pcs.filter(p=>p.connectionState==='connected').length===1",
    );
  await A.click("Leave call");
  await B.click("Leave call");
  pass(
    "Leave, rejoin, refresh and reconnect create fresh working audio sessions",
  );

  await A.evaluate(
    "(()=>{window.savedMic=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError')}})()",
  );
  await A.click("Start voice call");
  await A.wait(
    "document.body.innerText.includes('Microphone permission denied')",
  );
  await A.fill(
    'textarea[aria-label="Project message"]',
    "Text still works after microphone denial.",
    "HTMLTextAreaElement",
  );
  await A.evaluate(
    "document.querySelector('button[aria-label=\"Send project message\"]').click()",
  );
  await B.wait(
    "document.querySelector('[role=log]').textContent.includes('Text still works after microphone denial.')",
  );
  await A.evaluate("navigator.mediaDevices.getUserMedia=window.savedMic");

  await A.evaluate(
    "navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.resolveGroupMic=resolve)",
  );
  await A.click("Start voice call");
  await A.click("Cancel");
  await A.evaluate(
    "window.savedMic({audio:true}).then(stream=>window.resolveGroupMic(stream))",
  );
  await A.wait("groupTest.tracks.every(track=>track.readyState==='ended')");
  await A.evaluate("navigator.mediaDevices.getUserMedia=window.savedMic");
  pass(
    "Canceling a pending group microphone prompt stops a late permission grant",
  );
  const health = await A.evaluate(
    "import('/src/services/projectVoice.js').then(async({ProjectVoice})=>{const results=[];for(const kind of ['signal','heartbeat']){const controller=new ProjectVoice(1,'test',()=>{});controller.action=async()=>({});controller.session='test';controller.lastHeartbeat=Date.now()-(kind==='heartbeat'?40000:0);controller.stream=await navigator.mediaDevices.getUserMedia({audio:true});let closed=false;controller.peers.set('other',{pc:{close(){closed=true}},deadline:kind==='signal'?Date.now()-1:null});controller.syncing=true;controller.heartbeating=true;controller.checkHealth();await new Promise(r=>setTimeout(r,50));results.push(!controller.session&&closed&&controller.state.phase==='idle'&&controller.state.error.includes('Audio could not connect'));controller.dispose()}return results})",
  );
  assert.deepEqual(health, [true, true]);
  pass(
    "Connection watchdog cleans up even when signaling or heartbeat requests never finish",
  );
  await A.cmd("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await pause(300);
  assert(
    await A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await A.screenshot("project-group-chat-mobile");
  pass("Microphone failure preserves text chat; mobile layout fits");
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
    ".dist/project-chat-ui-verification.json",
    JSON.stringify({ checks, errors, network, fixturesRemoved: true }, null, 2),
  );
}
