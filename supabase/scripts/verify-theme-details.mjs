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

const findings = [];
const audit = `(()=>{
 const rgb=value=>{const n=value.match(/[\\d.]+/g)?.map(Number)||[0,0,0];return [n[0],n[1],n[2],n[3]??1]};
 const blend=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
 const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const low=[],fonts=[];
 for(const el of document.querySelectorAll('body *')){
  if(['SCRIPT','STYLE','SVG','PATH'].includes(el.tagName)||el.closest('svg,pre,code,kbd,[aria-hidden=true]')||el.disabled)continue;
  const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(!text)continue;
  const r=el.getBoundingClientRect(),style=getComputedStyle(el);if(!r.width||!r.height||r.bottom<0||r.top>innerHeight||style.visibility==='hidden')continue;
  if(!style.fontFamily.includes('Poppins'))fonts.push({text:text.slice(0,45),font:style.fontFamily});
  const ancestors=[];for(let p=el;p;p=p.parentElement)ancestors.unshift(p);let bg=[255,255,255],skip=false;
  for(const p of ancestors){const s=getComputedStyle(p);if(s.backgroundImage!=='none'||Number(s.opacity)<.9||p.disabled){skip=true;break}bg=blend(rgb(s.backgroundColor),bg)}
  if(skip)continue;
  const fg=blend(rgb(style.color),bg),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const threshold=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700)?3:4.5;
  if(ratio<threshold-.05)low.push({text:text.slice(0,60),ratio:Math.round(ratio*100)/100,fg:style.color,bg,classes:el.className});
 }
 return {overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,scroll:document.documentElement.scrollWidth,fonts,low,theme:document.documentElement.dataset.theme,font:getComputedStyle(document.body).fontFamily};
})()`;

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
  const A = await page(accounts[0]),
    book = (
      await ok(
        admin.from("books").select("slug").eq("status", "APPROVED").limit(1),
      )
    )[0];
  for (const theme of ["dark", "light"])
    for (const [width, height] of [
      [1440, 1000],
      [390, 844],
    ]) {
      await A.cmd("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width === 390,
      });
      await A.navigate("/library");
      await A.wait(
        "!!document.querySelector('button[aria-label=\"Learning preferences\"]') && !document.querySelector('button[aria-label=\"Learning preferences\"]').disabled",
      );
      if (
        (await A.evaluate("document.documentElement.dataset.theme")) !== theme
      )
        await A.evaluate(
          `document.querySelector('[aria-label="Switch to ${theme} mode"]').click()`,
        );
      await pause(350);
      findings.push({
        name: "library",
        theme,
        width,
        ...(await A.evaluate(audit)),
      });
      await A.evaluate(
        "document.querySelector('button[aria-label=\"Learning preferences\"]').click()",
      );
      await A.wait("!!document.querySelector('[role=dialog]')");
      findings.push({
        name: "library-preferences",
        theme,
        width,
        ...(await A.evaluate(audit)),
      });
      await A.screenshot(`theme-${theme}-preferences-${width}`);
      await A.navigate(`/read/${book.slug}`);
      await A.wait("!!document.querySelector('article[aria-busy=false]')");
      await A.click("Ask this book");
      await A.wait(
        "document.querySelector('[role=dialog]')?.textContent.includes('not configured yet')",
      );
      findings.push({
        name: "assistant",
        theme,
        width,
        ...(await A.evaluate(audit)),
      });
      await A.screenshot(`theme-${theme}-assistant-${width}`);
      await A.navigate("/u/" + tag);
      await A.wait("document.body.innerText.includes('Add showcase')");
      await A.click("Add showcase");
      await A.wait("!!document.querySelector('[role=dialog] input')");
      findings.push({
        name: "showcase-editor",
        theme,
        width,
        ...(await A.evaluate(audit)),
      });
      await A.screenshot(`theme-${theme}-showcase-editor-${width}`);
      pass(`${theme} preferences, AI and showcase forms/dialogs at ${width}px`);
    }
  assert.deepEqual(
    findings.filter((f) => f.overflow),
    [],
  );
  assert.deepEqual(
    findings.flatMap((f) => f.fonts),
    [],
  );
  assert.deepEqual(
    findings.flatMap((f) => f.low),
    [],
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
    ".dist/theme-details-verification.json",
    JSON.stringify(
      { checks, findings, errors, network, fixturesRemoved: true },
      null,
      2,
    ),
  );
}
