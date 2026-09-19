import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  origin = "http://127.0.0.1:5176",
  tag = `voice-message-${Date.now()}`;
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

const clients = [],
  files = [];
let passed = false;
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
          full_name: `Voice Tester ${i}`,
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
    const client = createClient(
      `https://${ref}.supabase.co`,
      keys.find((k) => k.name === "anon").api_key,
      options,
    );
    await ok(client.auth.signInWithPassword({ email, password }));
    clients.push(client);
  }
  const [a, b, c] = accounts,
    [alice, bob, outsider] = clients;
  await ok(
    admin
      .from("connections")
      .insert({
        from_user_id: a.user.id,
        to_user_id: b.user.id,
        status: "accepted",
      }),
  );
  const A = await page(a),
    B = await page(b);
  await A.navigate(`/messages?to=${b.user.id}`);
  await B.navigate(`/messages?to=${a.user.id}`);
  await A.wait(
    "!!document.querySelector('[aria-label=\"Record voice message\"]')",
  );
  await B.wait("!!document.querySelector('textarea[aria-label=Message]')");
  await A.evaluate(
    "(()=>{window.micStreams=[];window.realGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async(...args)=>{const stream=await window.realGetUserMedia(...args);window.micStreams.push(stream);return stream}})()",
  );
  const record = async () => {
    await A.evaluate(
      "document.querySelector('[aria-label=\"Record voice message\"]').click()",
    );
    await A.wait("!!document.querySelector('[aria-label=\"Stop recording\"]')");
    await pause(1200);
    await A.evaluate(
      "document.querySelector('[aria-label=\"Stop recording\"]').click()",
    );
    await A.wait(
      "!!document.querySelector('[aria-label=\"Voice message preview\"] audio')",
    );
    assert(
      await A.evaluate(
        "window.micStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))",
      ),
    );
  };
  await record();
  await A.evaluate(
    "document.querySelector('[aria-label=\"Play voice message\"]').click()",
  );
  await A.wait(
    "document.querySelector('[aria-label=\"Voice message preview\"] audio').currentTime>0",
  );
  await A.evaluate(
    "document.querySelector('[aria-label=\"Pause voice message\"]').click()",
  );
  const fixture = await A.evaluate(
    "(async()=>{const blob=await (await fetch(document.querySelector('[aria-label=\"Voice message preview\"] audio').src)).blob();const data=new Uint8Array(await blob.arrayBuffer());return {base64:btoa(String.fromCharCode(...data)),type:blob.type}})()",
  );
  await A.fill(
    "textarea[aria-label=Message]",
    "Listen to this update",
    "HTMLTextAreaElement",
  );
  await A.evaluate(
    "document.querySelector('[aria-label=\"Send message\"]').click()",
  );
  await A.wait("!!document.querySelector('[role=log] audio')");
  await B.wait("!!document.querySelector('[role=log] audio')");
  await B.evaluate(
    "document.querySelector('[aria-label=\"Play voice message\"]').click()",
  );
  await B.wait("document.querySelector('[role=log] audio').currentTime>0");
  await B.evaluate(
    "document.querySelector('[aria-label=\"Pause voice message\"]').click()",
  );
  await B.evaluate(
    "document.querySelector('[aria-label=\"Playback speed 1 times\"]').click()",
  );
  assert.equal(
    await B.evaluate("document.querySelector('[role=log] audio').playbackRate"),
    1.5,
  );
  const saved = await ok(
    admin
      .from("direct_messages")
      .select("*")
      .eq("sender_id", a.user.id)
      .single(),
  );
  assert(saved.audio_path);
  assert(saved.audio_duration_ms > 0);
  assert.equal(saved.image_path, null);
  assert.equal(
    (
      await ok(
        admin
          .from("notifications")
          .select("target_label")
          .eq("event_key", "message:" + saved.id)
          .single(),
      )
    ).target_label,
    "Sent a voice message",
  );
  assert.equal(
    (await ok(bob.rpc("colearn_message_contacts")))[0].last_message,
    "Voice message",
  );
  await A.screenshot("voice-message-desktop");
  pass(
    "Real MediaRecorder capture, stopped microphone, preview, private upload, live delivery, playback and speed controls",
  );

  const path = `${a.user.id}/${b.user.id}/${randomUUID()}.webm`,
    bytes = Buffer.from(fixture.base64, "base64");
  files.push(path);
  await ok(
    alice.storage
      .from("chat-audio")
      .upload(path, bytes, { contentType: fixture.type }),
  );
  assert(
    (await bob.storage.from("chat-audio").createSignedUrl(path, 30)).error,
  );
  assert(
    (
      await outsider.storage
        .from("chat-audio")
        .createSignedUrl(saved.audio_path, 30)
    ).error,
  );
  const guest = createClient(
    `https://${ref}.supabase.co`,
    keys.find((k) => k.name === "anon").api_key,
    options,
  );
  assert(
    (
      await guest.storage
        .from("chat-audio")
        .createSignedUrl(saved.audio_path, 30)
    ).error,
  );
  assert(
    (
      await alice.storage
        .from("chat-audio")
        .upload(`${a.user.id}/${c.user.id}/${randomUUID()}.webm`, bytes, {
          contentType: fixture.type,
        })
    ).error,
  );
  assert(
    (
      await alice
        .from("direct_messages")
        .insert({
          sender_id: a.user.id,
          recipient_id: b.user.id,
          body: "",
          audio_path: path,
          audio_duration_ms: 1500,
        })
    ).error,
    "Reused/mismatched message path accepted",
  );
  assert(
    (
      await alice
        .from("direct_messages")
        .update({ audio_duration_ms: 2 })
        .eq("id", saved.id)
    ).error,
  );
  await ok(alice.storage.from("chat-audio").remove([saved.audio_path]));
  assert(
    (
      await ok(
        bob.storage.from("chat-audio").createSignedUrl(saved.audio_path, 30),
      )
    ).signedUrl,
    "Sent audio was deleted",
  );
  await ok(alice.storage.from("chat-audio").remove([path]));
  assert(
    (await alice.storage.from("chat-audio").createSignedUrl(path, 30)).error,
  );
  assert.equal(
    (await ok(outsider.from("direct_messages").select("id").eq("id", saved.id)))
      .length,
    0,
  );
  pass(
    "RLS blocks outsiders, anonymous listeners, uncommitted playback, spoofed paths, nonconnections and deletion of sent audio",
  );

  await A.evaluate(
    "document.querySelector('[aria-label=\"Record voice message\"]').click()",
  );
  await A.wait("!!document.querySelector('[aria-label=\"Stop recording\"]')");
  await A.evaluate(
    "document.querySelector('[aria-label=\"Cancel recording\"]').click()",
  );
  assert(
    await A.evaluate(
      "window.micStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))",
    ),
  );
  assert(
    !(await A.evaluate(
      "!!document.querySelector('[aria-label=\"Voice message preview\"]')",
    )),
  );
  await A.evaluate(
    "navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('Denied','NotAllowedError'))",
  );
  await A.evaluate(
    "document.querySelector('[aria-label=\"Record voice message\"]').click()",
  );
  await A.wait(
    "document.body.innerText.includes('Microphone access was denied')",
  );
  await A.evaluate(
    "navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.resolveMic=resolve)",
  );
  await A.evaluate(
    "document.querySelector('[aria-label=\"Record voice message\"]').click()",
  );
  await A.wait("document.body.innerText.includes('Allow microphone access')");
  await A.evaluate(
    "document.querySelector('[aria-label=\"Cancel recording\"]').click()",
  );
  await A.evaluate(
    "(async()=>{const stream=await window.realGetUserMedia({audio:true});window.micStreams.push(stream);window.resolveMic(stream)})()",
  );
  await A.wait(
    "window.micStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))",
  );
  await A.evaluate(
    "navigator.mediaDevices.getUserMedia=async(...args)=>{const stream=await window.realGetUserMedia(...args);window.micStreams.push(stream);return stream}",
  );
  await record();
  await A.evaluate(
    "document.querySelector('[aria-label=\"Discard voice message\"]').click()",
  );
  assert(
    !(await A.evaluate(
      "!!document.querySelector('[aria-label=\"Voice message preview\"]')",
    )),
  );
  pass(
    "Cancel, discard, denied permission and late microphone permission release media without sending",
  );

  await record();
  let failedUpload = false;
  const failUpload = ({ data }) => {
    const m = JSON.parse(data);
    if (m.method !== "Fetch.requestPaused") return;
    const p = m.params;
    if (p.request.method === "POST" && !failedUpload) {
      failedUpload = true;
      void A.cmd("Fetch.fulfillRequest", {
        requestId: p.requestId,
        responseCode: 500,
        responseHeaders: [
          { name: "Content-Type", value: "application/json" },
          { name: "Access-Control-Allow-Origin", value: origin },
        ],
        body: Buffer.from(
          JSON.stringify({
            statusCode: "500",
            message: "Simulated upload failure",
            error: "test",
          }),
        ).toString("base64"),
      });
    } else void A.cmd("Fetch.continueRequest", { requestId: p.requestId });
  };
  ws.addEventListener("message", failUpload);
  await A.cmd("Fetch.enable", {
    patterns: [
      {
        urlPattern: "*/storage/v1/object/chat-audio/*",
        requestStage: "Request",
      },
    ],
  });
  await A.evaluate(
    "document.querySelector('[aria-label=\"Send message\"]').click()",
  );
  await A.wait("document.body.innerText.includes('Simulated upload failure')");
  assert(
    await A.evaluate(
      "!!document.querySelector('[aria-label=\"Voice message preview\"]')",
    ),
  );
  await A.cmd("Fetch.disable");
  ws.removeEventListener("message", failUpload);
  await A.evaluate(
    "document.querySelector('[aria-label=\"Send message\"]').click()",
  );
  await B.wait("document.querySelectorAll('[role=log] audio').length===2");
  const records = await ok(
    admin
      .from("direct_messages")
      .select("*")
      .eq("sender_id", a.user.id)
      .order("created_at"),
  );
  assert.equal(records.length, 2);
  assert.equal(records[1].body, "");
  const retry = await A.evaluate(
    `import(performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/services/messages.js').name).then(m=>m.messages.send(${JSON.stringify(b.user.id)},'',${JSON.stringify(records[1].id)},null,${JSON.stringify({ path: records[1].audio_path, durationMs: records[1].audio_duration_ms })})).then(m=>m.id)`,
  );
  assert.equal(retry, records[1].id);
  assert.equal(
    (
      await ok(
        admin.from("direct_messages").select("id").eq("sender_id", a.user.id),
      )
    ).length,
    2,
  );
  pass(
    "Failed upload preserves the preview; retry sends audio-only once and duplicate retries return the original message",
  );

  await A.evaluate(
    "document.querySelector('[aria-label=\"Record voice message\"]').click()",
  );
  await A.wait("!!document.querySelector('[aria-label=\"Stop recording\"]')");
  await A.evaluate("document.querySelector('a[href=\"/people\"]').click()");
  await A.wait(
    "location.pathname==='/people' && document.body.innerText.includes('Discover people')",
  );
  await A.wait(
    "window.micStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))",
  );
  await B.navigate("/people");
  await B.navigate(`/messages?to=${a.user.id}`);
  await B.wait("document.querySelectorAll('[role=log] audio').length===2");
  await B.cmd("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await pause(500);
  assert(
    await B.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await B.screenshot("voice-message-mobile");
  pass(
    "Leaving chat releases the microphone; voice history survives navigation and fits mobile",
  );
  const unexpected = network.filter(
    (e) =>
      !(
        e.status === 500 && e.path.startsWith("/storage/v1/object/chat-audio/")
      ) && !(e.status === 409 && e.path === "/rest/v1/direct_messages"),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  passed = true;
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  for (const account of accounts) {
    const objects = await admin
      .from("direct_messages")
      .select("audio_path")
      .eq("sender_id", account.user.id)
      .not("audio_path", "is", null);
    if (objects.data?.length)
      await admin.storage
        .from("chat-audio")
        .remove(objects.data.map((m) => m.audio_path));
    await admin.auth.admin.deleteUser(account.user.id);
  }
  if (files.length) await admin.storage.from("chat-audio").remove(files);
  for (const client of clients) await client.removeAllChannels();
  ws.close();
  writeFileSync(
    ".dist/voice-message-verification.json",
    JSON.stringify(
      { passed, checks, errors, network, fixturesRemoved: true },
      null,
      2,
    ),
  );
}
