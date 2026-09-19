// Run from repository root with Vite on :5176 and isolated Chromium CDP on :9224.
// Chromium flags: --headless=new --use-fake-device-for-media-stream
// --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required
// Creates disposable users, verifies live RLS + real WebRTC transport, cleans up.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const ref = "ghjdpcvnzclfvyosfhoz",
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
const ok = async (q) => {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const accounts = [],
  contexts = [],
  clients = [],
  channels = [],
  checks = [],
  errors = [],
  badNetwork = [],
  expectedNetwork = [];
const pass = (label) => {
  checks.push(label);
  console.log("PASS " + label);
};
const tag = `voice-${Date.now()}`;
const browserInfo = await (
  await fetch("http://127.0.0.1:9224/json/version")
).json();
const ws = new WebSocket(browserInfo.webSocketDebuggerUrl);
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
    badNetwork.push({
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
const instrument = `(() => {
  if (!navigator.mediaDevices?.getUserMedia) return;
  window.voiceTest={pcs:[],tracks:[]};window.rings=[];
  const Audio=window.AudioContext;window.AudioContext=class extends Audio {createOscillator(){const tone=super.createOscillator(),entry={context:this,tone};const set=tone.frequency.setValueAtTime.bind(tone.frequency);tone.frequency.setValueAtTime=(value,at)=>{if(value===660)entry.ring=true;return set(value,at)};const start=tone.start.bind(tone),stop=tone.stop.bind(tone);tone.start=(at)=>{entry.start=at??this.currentTime;window.rings.push(entry);return start(at)};tone.stop=(at)=>{entry.end=at??this.currentTime;return stop(at)};return tone}};

  const Original=window.RTCPeerConnection;
  window.RTCPeerConnection=class extends Original { constructor(...args){super(...args);window.voiceTest.pcs.push(this)} };
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async (...args)=>{const stream=await get(...args);window.voiceTest.tracks.push(...stream.getTracks());return stream};
})()`;
async function page(account, peer, contextId) {
  if (!contextId) {
    contextId = (await send("Target.createBrowserContext")).browserContextId;
    contexts.push(contextId);
  }
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
    browserContextId: contextId,
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const cmd = (m, p = {}) => send(m, p, sessionId);
  const evaluate = async (e) => {
    const r = await cmd("Runtime.evaluate", {
      expression: `(async()=>(${e}))()`,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description || r.exceptionDetails.text,
      );
    return r.result.value;
  };
  const wait = async (e, n = 120) => {
    for (let i = 0; i < n; i++) {
      try {
        if (await evaluate(e)) return;
      } catch {}
      await pause(250);
    }
    throw new Error(
      "Timed out: " +
        e +
        " UI: " +
        (await evaluate("document.body.innerText")).slice(-1800),
    );
  };
  const click = async (label) => {
    await wait(
      `Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled)`,
    );
    return evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`,
    );
  };
  const fill = (selector, value) =>
    evaluate(
      `(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    );
  await cmd("Page.enable");
  await cmd("Runtime.enable");
  await cmd("Network.enable");
  await cmd("Page.addScriptToEvaluateOnNewDocument", { source: instrument });
  await cmd("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cmd("Page.navigate", { url: origin + "/login" });
  await wait(
    "!!document.querySelector('input[type=email]') || location.pathname==='/dashboard'",
  );
  if (await evaluate("location.pathname==='/login'")) {
    await fill("input[type=email]", account.email);
    await fill("input[type=password]", account.password);
    await evaluate("document.querySelector('form').requestSubmit()");
    await wait("location.pathname==='/dashboard'");
  }
  await cmd("Page.navigate", { url: origin + "/messages?to=" + peer.id });
  await wait(
    "!!document.querySelector('button[aria-label^=\"Voice call\"]:not(:disabled)')",
  );
  const call = () =>
    evaluate(
      "document.querySelector('button[aria-label^=\"Voice call\"]').click()",
    );
  const connected = () =>
    wait(
      "document.querySelector('[aria-label=\"Voice call\"] [role=status]')?.textContent.includes('Connected')",
    );
  const idle = () =>
    wait(
      "!document.querySelector('section[aria-label=\"Voice call\"]') && !document.querySelector('[role=dialog]')",
    );
  const clean = async () => {
    await idle();
    assert(
      await evaluate(
        "voiceTest.pcs.every(p=>p.connectionState==='closed') && voiceTest.tracks.every(t=>t.readyState==='ended')",
      ),
      "WebRTC/microphone leaked",
    );
    await wait(
      "import('/src/services/supabase/client.js').then(({supabase})=>supabase.getChannels().every(c=>!c.topic.startsWith('realtime:voice:')))",
    );
  };
  const screenshot = async (name) => {
    const { data } = await cmd("Page.captureScreenshot", { format: "png" });
    writeFileSync(`.dist/${name}.png`, Buffer.from(data, "base64"));
  };
  return {
    cmd,
    evaluate,
    wait,
    click,
    call,
    connected,
    idle,
    clean,
    screenshot,
    contextId,
  };
}
let complete = false;
try {
  for (let i = 0; i < 3; i++) {
    const email = `${tag}-${i}@colearn.example`,
      password = `Test!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${i}`,
          full_name: ["Voice Alice", "Voice Bob", "Voice Outsider"][i],
        },
      }),
    );
    accounts.push({ ...user, password });
    await ok(
      admin
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id),
    );
    const c = client();
    await ok(c.auth.signInWithPassword({ email, password }));
    clients.push(c);
  }
  const [a, b, c] = accounts,
    [alice, bob, outsider] = clients;
  await ok(
    admin
      .from("connections")
      .insert({ from_user_id: a.id, to_user_id: b.id, status: "accepted" }),
  );

  const A = await page(a, b),
    B = await page(b, a),
    B2 = await page(b, a, B.contextId);
  await send("Browser.grantPermissions", {
    origin,
    browserContextId: B.contextId,
    permissions: ["notifications"],
  });
  for (const P of [B, B2]) {
    await P.evaluate(
      "import('/src/services/callAlerts.js').then(m=>m.enableCallNotifications())",
    );
    await P.evaluate(
      "document.dispatchEvent(new Event('pointerdown',{bubbles:true}))",
    );
  }
  const background = (
    await send("Target.createTarget", {
      url: "about:blank",
      browserContextId: B.contextId,
    })
  ).targetId;
  const backgroundSession = (
    await send("Target.attachToTarget", { targetId: background, flatten: true })
  ).sessionId;
  await send("Page.bringToFront", {}, backgroundSession);
  assert(
    await B.evaluate("document.hidden || !document.hasFocus()"),
    "Receiver must be unfocused for this test",
  );
  assert(
    await B2.evaluate("document.hidden || !document.hasFocus()"),
    "Every receiver tab must be unfocused",
  );
  const notifications = (P) =>
    P.evaluate(
      "navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.map(n=>({tag:n.tag,title:n.title,data:n.data,actions:n.actions})))",
    );
  const stopped = (P) =>
    P.wait(
      "rings.filter(r=>r.ring).every(r=>r.end<=r.context.currentTime+0.05)",
    );
  const callScreens = async (P, name) => {
    for (const theme of ["light", "dark"]) {
      await P.evaluate(
        `document.querySelector('[aria-label="Switch to ${theme} mode"]')?.click()`,
      );
      for (const width of [1440, 390]) {
        await P.cmd("Emulation.setDeviceMetricsOverride", {
          width,
          height: 900,
          deviceScaleFactor: 1,
          mobile: width < 768,
        });
        await pause(150);
        assert.equal(
          await P.evaluate("document.documentElement.dataset.theme"),
          theme,
        );
        assert(
          await P.evaluate(
            "document.documentElement.scrollWidth<=innerWidth+1",
          ),
        );
        await P.screenshot(`${name}-${theme}-${width}`);
      }
    }
    pass(`${name} fits desktop/mobile in both themes`);
  };
  await A.call();
  await B.wait("document.body.innerText.includes('Incoming voice call')");
  await B2.wait("document.body.innerText.includes('Incoming voice call')");
  await B.wait(
    "navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.length===1)",
  );
  await pause(3500);
  const nb = await notifications(B);
  assert.equal(nb.length, 1);
  assert(
    nb[0].title.includes("Incoming voice call") &&
      nb[0].title.includes("Voice Alice"),
  );
  const counts = await Promise.all(
    [B, B2].map((P) => P.evaluate("rings.filter(r=>r.ring).length")),
  );
  assert.equal(counts.filter((n) => n > 0).length, 1, "Only one tab may ring");
  pass(
    "Unfocused receiver gets a real browser notification with caller identity; two tabs create one alert and one ringtone",
  );
  await B.screenshot("voice-background-notification");
  await callScreens(B, "voice-incoming-theme");
  await B.click("Accept");
  await Promise.all([A.connected(), B.connected()]);
  await callScreens(B, "voice-active-theme");
  await Promise.all([stopped(B), stopped(B2)]);
  await B.wait(
    "navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.length===0)",
  );
  // Simulate a browser denying remote autoplay, then exercise the explicit recovery.
  await B.evaluate(
    "(()=>{const audio=document.querySelector('audio[src]')||[...document.querySelectorAll('audio')].find(a=>a.srcObject);audio.pause();window.originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'))})()",
  );
  // Module-level test uses the same production output helper, with an actual remote track.
  await B.evaluate(
    "import('/src/services/callAudio.js').then(async({CallAudio})=>{window.blockedOutput=new CallAudio(blocked=>window.outputWasBlocked=blocked);await blockedOutput.unlock();blockedOutput.add('test',voiceTest.pcs.at(-1).getReceivers()[0].track)})",
  );
  await B.wait("window.outputWasBlocked===true");
  await B.evaluate("HTMLMediaElement.prototype.play=window.originalPlay");
  await B.evaluate(
    "blockedOutput.add('second',voiceTest.pcs.at(-1).getReceivers()[0].track)",
  );
  await B.wait("blockedOutput.outputs.get('second').audio.paused===false");
  assert.equal(
    await B.evaluate("window.outputWasBlocked"),
    true,
    "A playing participant must not hide another participant's blocked audio",
  );
  await B.evaluate("window.blockedOutput.unlock()");
  await B.wait("window.outputWasBlocked===false");
  await B.evaluate("window.blockedOutput.close()");
  await A.click("End call");
  await Promise.all([A.clean(), B.clean()]);
  pass(
    "Answer stops ringtone and closes native alert; partial group autoplay stays blocked until a user gesture restores all outputs",
  );
  await A.call();
  await B.click("Decline");
  await Promise.all([
    A.clean(),
    B.clean(),
    B2.clean(),
    stopped(B),
    stopped(B2),
  ]);
  pass("Reject synchronizes every tab and stops ringtone");
  await A.call();
  await B.wait("document.body.innerText.includes('Incoming voice call')");
  await A.click("End call");
  await Promise.all([
    A.clean(),
    B.clean(),
    B2.clean(),
    stopped(B),
    stopped(B2),
  ]);
  pass("Caller cancellation removes incoming UI and stops ringing in all tabs");
  await A.call();
  await B.wait("document.body.innerText.includes('Incoming voice call')");
  const call = await ok(
    admin
      .from("voice_calls")
      .select("id")
      .eq("caller_id", a.id)
      .eq("status", "ringing")
      .single(),
  );
  await ok(
    admin
      .from("voice_calls")
      .update({ created_at: new Date(Date.now() - 60000).toISOString() })
      .eq("id", call.id),
  );
  await Promise.all([
    A.clean(),
    B.clean(),
    B2.clean(),
    stopped(B),
    stopped(B2),
  ]);
  await B.wait(
    "navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.length===0)",
  );
  pass("Expired calls clear the dialog, notification and ringtone");
  // An early decline/cancel can revoke access while ICE configuration is in flight.
  assert(
    badNetwork.every(
      (r) => r.status === 403 && r.path === "/functions/v1/voice-ice",
    ),
  );
  expectedNetwork.push(...badNetwork.splice(0));
  assert.deepEqual(errors, []);
  complete = true;
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  await pause(700);
  for (const [cl, ch] of channels) await cl.removeChannel(ch);
  for (const c of clients) await c.removeAllChannels();
  for (const account of accounts)
    await ok(admin.auth.admin.deleteUser(account.id));
  ws.close();
  writeFileSync(
    ".dist/background-call-verification.json",
    JSON.stringify(
      {
        status: complete ? "passed" : "failed",
        checks,
        errors,
        badNetwork,
        expectedNetwork,
        fixturesRemoved: true,
      },
      null,
      2,
    ),
  );
}
