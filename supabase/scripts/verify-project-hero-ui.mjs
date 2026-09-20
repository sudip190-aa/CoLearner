import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)(
  "../../CoLearner/node_modules/sharp",
);
const ref = "ghjdpcvnzclfvyosfhoz",
  origin = process.env.COLEARN_TEST_ORIGIN || "http://127.0.0.1:5176",
  tag = `hero-${Date.now()}`;
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
    if (!p) return;
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
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Browser command timed out: ${method}`));
    }, 15000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
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
      `[...document.querySelectorAll('button,[role=button],a')].some(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled)`,
    );
    await evaluate(
      `[...document.querySelectorAll('button,[role=button],a')].find(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled).click()`,
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
  // Distinct, deterministic uploaded images exercise landscape and portrait fitting.
  const wide = resolve(".dist/project-hero-wide.png");
  const portrait = resolve(".dist/project-hero-portrait.png");
  await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="600"><rect width="1440" height="600" fill="#e5ede8"/><rect x="64" y="60" width="1312" height="480" rx="24" fill="#fcfdf9"/><text x="112" y="150" fill="#264b3c" font-size="24" font-family="sans-serif" letter-spacing="5">FIELDNOTES</text><text x="112" y="260" fill="#183c2d" font-size="62" font-family="sans-serif">A little more outdoors.</text><text x="112" y="315" fill="#61756b" font-size="24" font-family="sans-serif">Discover the places worth slowing down for.</text><rect x="112" y="385" width="180" height="54" rx="27" fill="#264b3c"/><text x="144" y="419" fill="white" font-size="18" font-family="sans-serif">Explore trails</text><circle cx="1140" cy="300" r="162" fill="#d7e3ba"/><path d="M964 400 L1080 183 L1200 400Z" fill="#91ab89"/><path d="M1060 440 L1210 202 L1330 440Z" fill="#4a735f"/></svg>`,
    ),
  )
    .png()
    .toFile(wide);
  await sharp({
    create: { width: 600, height: 900, channels: 3, background: "#bfd6f0" },
  })
    .png()
    .toFile(portrait);

  const A = await page(accounts[0]);
  await A.navigate("/projects/new");
  await A.wait("!!document.querySelector('[name=title]')");
  await A.fill("[name=title]", "Fieldnotes — a shared trail journal");
  await A.fill(
    "[name=summary]",
    "A quieter way to discover local trails, save your favourite places, and plan your next walk together.",
    "HTMLTextAreaElement",
  );
  await A.fill("[name=category]", "Collaboration", "HTMLSelectElement");
  await A.upload("#project-cover", wide);
  await A.wait(
    "document.querySelector('img[alt=\"Project cover preview\"]')?.src.startsWith('data:')",
  );
  await A.click("Continue");
  await A.wait("!!document.querySelector('textarea[name=description]')");
  await A.fill(
    "textarea[name=description]",
    "We are building a shared field journal for everyday adventures. Help shape the map, bring local trails to life, and create something useful with a small, thoughtful team.",
    "HTMLTextAreaElement",
  );
  await A.click("React");
  await A.click("Frontend developer");
  await A.click("Continue");
  await A.click("Publish project");
  await A.wait(
    "!!document.querySelector('.project-banner img') && document.querySelector('h1')?.textContent.includes('Fieldnotes')",
  );
  const project = await ok(
    admin.from("projects").select("*").eq("owner_id", user.id).single(),
  );
  assert(
    project.cover && !project.cover.startsWith("data:"),
    "Image must persist in Storage",
  );
  const originalSrc = await A.evaluate(
    "document.querySelector('.project-banner img').src",
  );
  assert(originalSrc.includes("/storage/v1/"));
  await A.cmd("Page.reload");
  await A.wait(
    "document.querySelector('.project-banner img')?.naturalWidth===1440",
  );
  pass(
    "Actual create form uploads a cover to Storage and the large banner survives refresh",
  );

  for (const theme of ["light", "dark"]) {
    await A.evaluate(
      `document.documentElement.classList.toggle('dark',${theme === "dark"})`,
    );
    for (const width of [1440, 1280, 768, 390, 320]) {
      await A.cmd("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      await pause(150);
      const layout = await A.evaluate(`(()=>{
        const hero=document.querySelector('[aria-label="Project introduction"]'),banner=hero.querySelector('.project-banner'),img=banner.querySelector('img'),title=hero.querySelector('h1');
        const logo=[...document.querySelectorAll('img[alt=Colearn]')].find(i=>i.getBoundingClientRect().width>0);
        return {overflow:document.documentElement.scrollWidth>innerWidth+1,fit:getComputedStyle(img).objectFit,height:banner.clientHeight,width:banner.clientWidth,heroWidth:hero.clientWidth,imageBeforeTitle:banner.getBoundingClientRect().bottom<=title.getBoundingClientRect().top,duplicates:[...document.images].filter(i=>i.src===img.src).length,gradient:[hero,...hero.querySelectorAll('*')].some(e=>getComputedStyle(e).backgroundImage.includes('gradient')),logo:logo?.src,filter:getComputedStyle(logo).filter,logoRatio:logo.parentElement.clientWidth/logo.parentElement.clientHeight};
      })()`);
      assert(!layout.overflow, `${theme}/${width}: horizontal overflow`);
      assert.equal(layout.fit, "contain");
      assert(layout.height >= (width >= 1280 ? 400 : 219));
      assert(Math.abs(layout.width - layout.heroWidth) <= 2);
      assert(layout.imageBeforeTitle);
      assert.equal(layout.duplicates, 1);
      assert(!layout.gradient);
      assert(
        theme === "dark"
          ? layout.logo.startsWith("data:image/svg+xml;base64,") &&
              Buffer.from(layout.logo.split(",")[1], "base64")
                .toString("utf8")
                .replace(/\r\n/g, "\n") ===
                readFileSync(
                  new URL(
                    "../../CoLearner/src/assets/logo2.svg",
                    import.meta.url,
                  ),
                  "utf8",
                ).replace(/\r\n/g, "\n")
          : /\/(?:logo\.png|logo-[^/]+\.png)$/.test(layout.logo),
      );
      assert.equal(layout.filter, "none");
      assert(Math.abs(layout.logoRatio - 1716 / 773) < 0.04);
      if ([1440, 768, 390].includes(width))
        await A.screenshot(`project-hero-${theme}-${width}`);
    }
    for (const label of ["Team", "Updates", "Overview"]) {
      await A.evaluate(
        `[...document.querySelectorAll('[role=tab]')].find(el=>el.textContent.startsWith(${JSON.stringify(label)})).click()`,
      );
      await A.wait(
        `document.querySelector('[role=tab][aria-selected=true]')?.textContent.startsWith(${JSON.stringify(label)})`,
      );
      assert(await A.evaluate("!!document.querySelector('[role=tabpanel]')"));
    }
  }
  pass(
    "Large uncropped banner, metadata/actions, tabs and supplied theme logos at desktop/laptop/tablet/mobile widths",
  );
  await A.cmd("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await A.click("Open workspace");
  await A.wait(
    "[...document.querySelectorAll('[role=tab]')].some(t=>t.textContent==='Settings')",
  );
  await A.evaluate(
    "[...document.querySelectorAll('[role=tab]')].find(t=>t.textContent==='Settings').click()",
  );
  await A.wait(
    "!!document.querySelector('input[aria-label=\"Project cover\"]')",
  );
  await A.upload('input[aria-label="Project cover"]', portrait);
  await A.wait("document.body.innerText.includes('Cover updated')");
  const updated = await ok(
    admin.from("projects").select("cover").eq("id", project.id).single(),
  );
  assert.notEqual(updated.cover, project.cover);
  await A.navigate("/projects/" + project.slug);
  await A.wait(
    "document.querySelector('.project-banner img')?.naturalHeight===900",
  );
  assert.equal(
    await A.evaluate(
      "getComputedStyle(document.querySelector('.project-banner img')).objectFit",
    ),
    "contain",
  );
  await A.cmd("Page.reload");
  await A.wait(
    "document.querySelector('.project-banner img')?.naturalHeight===900",
  );
  pass(
    "Workspace cover replacement persists and portrait images remain uncropped after reload",
  );

  const second = await ok(
    admin
      .from("projects")
      .insert({
        owner_id: user.id,
        title: "Second project, its own identity",
        slug: tag + "-second",
        summary:
          "Different data and a gallery image, without a dedicated cover.",
        category: "Education",
      })
      .select()
      .single(),
  );
  const galleryPath = `${second.id}/gallery.png`;
  await ok(
    admin.storage
      .from("project-covers")
      .upload(galleryPath, readFileSync(wide), { contentType: "image/png" }),
  );
  await ok(
    admin
      .from("projects")
      .update({ gallery: [galleryPath] })
      .eq("id", second.id),
  );
  const empty = await ok(
    admin
      .from("projects")
      .insert({
        owner_id: user.id,
        title: "A project without an image",
        slug: tag + "-empty",
      })
      .select()
      .single(),
  );
  // Exercise client-side navigation in the same component, including reset of tabs and image failures.
  const go = async (slug) => {
    await A.evaluate(
      `(()=>{history.pushState({},'',${JSON.stringify("/projects/" + slug)});window.dispatchEvent(new PopStateEvent('popstate'))})()`,
    );
    await A.wait(
      `document.querySelector('h1')?.textContent===${JSON.stringify(slug === second.slug ? second.title : slug === empty.slug ? empty.title : project.title)}`,
    );
  };
  await go(second.slug);
  await A.wait(
    "document.querySelector('.project-banner img')?.naturalWidth===1440",
  );
  assert.equal(
    await A.evaluate(
      "document.querySelectorAll('main .project-detail img[src*=\"project-covers\"]').length",
    ),
    1,
  );
  assert(
    await A.evaluate(
      "!document.querySelector('[aria-label=\"Project gallery\"]')",
    ),
  );
  await go(empty.slug);
  assert(
    await A.evaluate(
      "!document.querySelector('.project-banner') && !document.querySelector('[aria-label=\"Project gallery\"]')",
    ),
  );
  assert(
    await A.evaluate("document.body.innerText.includes('Open workspace')"),
  );
  await A.screenshot("project-hero-no-image-dark");
  await go(project.slug);
  await A.wait(
    "document.querySelector('.project-banner img')?.naturalHeight===900",
  );
  await A.evaluate(
    "document.querySelector('.project-banner img').dispatchEvent(new Event('error'))",
  );
  await A.wait("!document.querySelector('.project-banner')");
  assert(
    await A.evaluate("document.body.innerText.includes('Open workspace')"),
  );
  await go(second.slug);
  await A.wait(
    "document.querySelector('.project-banner img')?.naturalWidth===1440",
  );
  pass(
    "Multiple projects keep their own data; first gallery image becomes the unique banner; missing/failed images leave a clean usable hero",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  for (const account of accounts) {
    const owned = await ok(
      admin.from("projects").select("id").eq("owner_id", account.user.id),
    );
    for (const project of owned) {
      const prefix = String(project.id);
      const objects = await ok(
        admin.storage.from("project-covers").list(prefix),
      );
      if (objects.length)
        await ok(
          admin.storage
            .from("project-covers")
            .remove(objects.map((x) => `${prefix}/${x.name}`)),
        );
    }
    await ok(admin.auth.admin.deleteUser(account.user.id));
  }
  ws.close();
  writeFileSync(
    ".dist/project-hero-verification.json",
    JSON.stringify(
      { origin, checks, errors, network, fixturesRemoved: true },
      null,
      2,
    ),
  );
}
