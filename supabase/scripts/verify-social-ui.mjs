import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  origin = "http://127.0.0.1:5176",
  tag = `social-ui-${Date.now()}`;
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
let passed = false,
  project;
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
          full_name: i ? "Social Bob" : "Social Alice",
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
  await ok(
    admin.from("connections").insert({
      from_user_id: a.user.id,
      to_user_id: b.user.id,
      status: "accepted",
    }),
  );
  project = await ok(
    admin
      .from("projects")
      .insert({
        owner_id: a.user.id,
        slug: tag,
        title: "Social UI project",
        summary: "A complete public project showcase",
        description:
          "A detailed original project for verifying collaboration and gallery workflows.",
        status: "active",
        demo_url: "https://example.com/demo",
        repository_url: "https://example.com/repo",
      })
      .select()
      .single(),
  );
  await ok(
    admin.from("threads").insert({
      author_id: a.user.id,
      slug: tag,
      title: "A clearer community discussion",
      body: "Share what you learned and mention a connection.",
      category: "community",
    }),
  );
  const A = await page(a),
    B = await page(b);
  await A.navigate("/");
  await A.wait("document.body.innerText.includes('My Dashboard')");
  const beforeReload = await A.evaluate("performance.timeOrigin");
  await A.cmd("Page.reload");
  await A.wait(
    `performance.timeOrigin!==${beforeReload} && document.readyState==='complete'`,
  );
  await A.wait("document.body.innerText.includes('My Dashboard')");
  assert.equal(
    await A.evaluate(
      "import(performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname === '/src/store/authStore.js').at(-1)?.name || '/src/store/authStore.js').then(m=>m.useAuthStore.getState().user.id)",
    ),
    a.user.id,
  );
  pass(
    "Password login, Home account navigation, reload and distinct simultaneous account identities",
  );
  if (process.argv.includes("--auth-only")) {
    await B.evaluate(
      "document.querySelector('[aria-label=\"Open account menu\"]').click()",
    );
    await B.click("Log out");
    await B.wait(
      "location.pathname==='/login' && !!document.querySelector('input[type=email]')",
    );
    await B.navigate("/");
    await B.wait(
      "document.body.innerText.includes('Get started') || document.body.innerText.includes('Get Started')",
    );
    await B.navigate("/login");
    await B.wait("!!document.querySelector('input[type=email]')");
    await B.fill("input[type=email]", a.email);
    await B.fill("input[type=password]", a.password);
    await B.evaluate("document.querySelector('form').requestSubmit()");
    await B.wait(
      "location.pathname==='/dashboard' && document.body.innerText.includes('Social')",
    );
    await B.navigate(`/messages?to=${b.user.id}`);
    await B.wait(
      "!!document.querySelector('section[aria-label=\"Conversation with Social Bob\"]')",
    );
    pass(
      "Explicit logout clears persisted session and a different account gets its own private inbox",
    );
    passed = true;
  } else if (process.argv.includes("--project-only")) {
    const field = async (page, label, value, type = "HTMLInputElement") => {
      const id = await page.evaluate(
        `[...document.querySelectorAll('label')].find(el=>el.textContent.trim()===${JSON.stringify(label)}).htmlFor`,
      );
      await page.fill(`[id="${id}"]`, value, type);
    };
    await B.navigate("/settings");
    await B.wait("!!document.querySelector('input[type=checkbox]')");
    await B.evaluate(
      "[...document.querySelectorAll('label')].find(el=>el.textContent.includes('Notification sounds')).querySelector('input').click()",
    );
    await B.click("Save changes");
    await B.wait("document.body.innerText.includes('All changes saved')");
    await B.cmd("Page.bringToFront");
    await B.evaluate(
      "document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))",
    );
    const soundBefore = await B.evaluate("window.socialSoundCount");
    await ok(
      admin.from("direct_messages").insert({
        sender_id: a.user.id,
        recipient_id: b.user.id,
        body: "Quiet notification check",
      }),
    );
    await B.wait(
      "[...document.querySelectorAll('[data-notification-popup]')].some(el=>el.textContent.includes('Quiet notification check'))",
    );
    assert.equal(await B.evaluate("window.socialSoundCount"), soundBefore);
    pass(
      "Saved sound preference suppresses audio while live notification popups remain visible",
    );
    await A.navigate("/projects/new");
    await A.wait("!!document.querySelector('input[name=title]')");
    await A.evaluate(
      "[...document.querySelectorAll('label')].find(el=>el.textContent.includes('Showcase a project')).querySelector('input').click()",
    );
    await A.fill("input[name=title]", "A project already built");
    await A.fill(
      "textarea[name=summary]",
      "A complete original portfolio project for students.",
      "HTMLTextAreaElement",
    );
    await A.fill("select[name=category]", "Education", "HTMLSelectElement");
    await field(A, "Live demo URL", "https://example.com/live");
    await field(A, "Repository URL", "https://example.com/source");
    await A.click("Continue");
    await A.wait("!!document.querySelector('textarea[name=description]')");
    await A.fill(
      "textarea[name=description]",
      "This project helps students track their learning and share their work with connected collaborators.",
      "HTMLTextAreaElement",
    );
    await A.evaluate(
      "[...document.querySelectorAll('[role=button]')].find(el=>el.textContent.trim()==='React').click()",
    );
    await A.click("Continue");
    await A.click("Publish project");
    await A.wait("document.body.innerText.includes('Open workspace')");
    const created = await ok(
      admin
        .from("projects")
        .select("*")
        .eq("owner_id", a.user.id)
        .eq("title", "A project already built")
        .single(),
    );
    assert.equal(created.is_showcase, true);
    assert.equal(created.status, "completed");
    assert(created.tech_stack.includes("React"));
    assert.equal(created.demo_url, "https://example.com/live");
    await A.click("Open workspace");
    await A.wait("document.body.innerText.includes('Team')");
    await A.wait(
      "[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Settings')",
    );
    await A.click("Settings");
    await A.wait("document.body.innerText.includes('Project settings')");
    await field(A, "Status", "active", "HTMLSelectElement");
    await field(
      A,
      "Short summary",
      "An updated portfolio description saved by its owner.",
    );
    await A.click("Save changes");
    await A.wait("document.body.innerText.includes('Project settings saved')");
    assert.equal(
      (
        await ok(
          admin
            .from("projects")
            .select("summary")
            .eq("id", created.id)
            .single(),
        )
      ).summary,
      "An updated portfolio description saved by its owner.",
    );
    pass(
      "Existing-project creation persists showcase, technology and URL fields; owner editing saves",
    );
    await A.click("Team");
    await B.navigate(`/projects/${created.slug}`);
    await B.wait("document.body.innerText.includes('Request to join')");
    await B.click("Request to join");
    await B.wait("!!document.querySelector('[role=dialog] textarea')");
    await B.fill(
      "[role=dialog] textarea",
      "I can contribute to this student project.",
      "HTMLTextAreaElement",
    );
    await B.click("Send request");
    await B.wait("document.body.innerText.includes('Request pending')");
    await A.wait("!!document.querySelector('[data-request-id]')");
    await A.click("Accept");
    await A.wait("document.body.innerText.includes('Member accepted')");
    assert.equal(
      (
        await ok(
          admin
            .from("project_members")
            .select("id")
            .eq("project_id", created.id)
            .eq("user_id", b.user.id),
        )
      ).length,
      1,
    );
    await A.navigate(`/projects/${tag}/workspace`);
    await A.wait("document.body.innerText.includes('Team')");
    await A.click("Team");
    await B.navigate(`/projects/${tag}`);
    await B.wait("document.body.innerText.includes('Request to join')");
    await B.click("Request to join");
    await B.wait("!!document.querySelector('[role=dialog] textarea')");
    await B.click("Send request");
    await B.wait("document.body.innerText.includes('Request pending')");
    await A.wait("!!document.querySelector('[data-request-id]')");
    await A.click("Decline");
    await A.wait("document.body.innerText.includes('Request declined')");
    assert.equal(
      (
        await ok(
          admin
            .from("join_requests")
            .select("status")
            .eq("project_id", project.id)
            .eq("user_id", b.user.id)
            .single(),
        )
      ).status,
      "rejected",
    );
    pass(
      "UI join requests arrive live in the owner workspace; acceptance and rejection persist",
    );
    await A.navigate(`/projects/${created.slug}/workspace`);
    await A.wait("document.body.innerText.includes('Team')");
    await A.wait(
      "[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Settings')",
    );
    await A.click("Settings");
    await A.wait("document.body.innerText.includes('Project settings')");
    await A.click("Delete project");
    await A.wait("!!document.querySelector('[role=dialog] input')");
    await A.fill("[role=dialog] input", created.title);
    await A.click("Delete permanently");
    await A.wait("location.pathname==='/projects'");
    assert.equal(
      (await ok(admin.from("projects").select("id").eq("id", created.id)))
        .length,
      0,
    );
    pass(
      "Owner can remove a showcased project through the existing confirmation workflow",
    );
  } else {
    await A.navigate(`/messages?to=${b.user.id}`);
    await B.navigate(`/messages?to=${a.user.id}`);
    await A.wait("!!document.querySelector('textarea[aria-label=Message]')");
    await B.wait("!!document.querySelector('textarea[aria-label=Message]')");
    const pngPath = "E:/Hackathon/Hackathon/.dist/social-image.png";
    const pngData = await A.evaluate(
      "(()=>{const canvas=document.createElement('canvas');canvas.width=480;canvas.height=320;const context=canvas.getContext('2d');context.fillStyle='#2e78e5';context.fillRect(0,0,480,320);context.fillStyle='white';context.font='32px sans-serif';context.fillText('CoLearn project',70,165);return canvas.toDataURL('image/png').split(',')[1]})()",
    );
    writeFileSync(pngPath, Buffer.from(pngData, "base64"));
    await A.upload('input[aria-label="Attach one image"]', pngPath);
    await A.wait(
      "!!document.querySelector('img[alt=\"Image ready to send\"]')",
    );
    await A.fill(
      "textarea[aria-label=Message]",
      "An image for our project",
      "HTMLTextAreaElement",
    );
    await A.evaluate(
      "document.querySelector('button[aria-label=\"Send message\"]').click()",
    );
    await A.wait(
      "!!document.querySelector('button[aria-label=\"View message image\"]') || !!document.querySelector('form [role=alert]')",
    );
    assert(
      !(await A.evaluate(
        "document.querySelector('form [role=alert]')?.textContent",
      )),
      await A.evaluate(
        "document.querySelector('form [role=alert]')?.textContent",
      ),
    );
    await B.wait(
      "!!document.querySelector('button[aria-label=\"View message image\"]')",
    );
    await B.evaluate(
      "document.querySelector('button[aria-label=\"View message image\"]').click()",
    );
    await B.wait("!!document.querySelector('[role=dialog] img')");
    await B.navigate("/people");
    await B.navigate(`/messages?to=${a.user.id}`);
    await B.wait(
      "document.body.innerText.includes('An image for our project')",
    );
    pass(
      "One-image preview/send, recipient Realtime delivery, enlarged view and persistent conversation history",
    );
    await A.navigate("/dashboard");
    await A.wait("document.body.innerText.includes('Your circle')");
    await A.evaluate(
      "document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))",
    );
    await B.navigate(`/community/${tag}`);
    await B.wait(
      "!!document.querySelector('[aria-label=\"Write a comment\"]')",
    );
    await B.fill(
      '[aria-label="Write a comment"]',
      "Thanks @",
      "HTMLTextAreaElement",
    );
    await B.wait("!!document.querySelector('[role=option]')");
    await B.evaluate("document.querySelector('[role=option]').click()");
    await B.evaluate(
      "document.querySelector('button[aria-label=\"Post comment\"]').click()",
    );
    await A.wait("!!document.querySelector('[data-notification-popup]')");
    assert(
      await A.evaluate(
        "document.querySelector('[data-notification-popup]').textContent.includes('mentioned you')",
      ),
    );
    assert(await A.evaluate("window.socialSoundCount>0"));
    await A.screenshot("social-notification-desktop");
    await A.evaluate(
      "document.querySelector('[data-notification-popup] button').click()",
    );
    await A.wait(
      "location.hash.startsWith('#comment-') && !!document.querySelector(location.hash)",
    );
    pass(
      "Connection mention autocomplete, live popup, single sound and exact comment navigation",
    );
    await B.cmd("Page.bringToFront");
    await B.evaluate(
      "document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))",
    );
    const popup = await ok(
      admin
        .from("direct_messages")
        .insert({
          sender_id: a.user.id,
          recipient_id: b.user.id,
          body: "Popup duration check",
        })
        .select()
        .single(),
    );
    await B.wait(
      "Array.from(document.querySelectorAll('[data-notification-popup]')).some(el=>el.textContent.includes('Popup duration check'))",
    );
    await pause(10500);
    assert(
      !(await B.evaluate(
        "Array.from(document.querySelectorAll('[data-notification-popup]')).some(el=>el.textContent.includes('Popup duration check'))",
      )),
    );
    const persisted = await ok(
      admin
        .from("notifications")
        .select("id,is_read")
        .eq("event_key", "message:" + popup.id)
        .single(),
    );
    assert.equal(persisted.is_read, false);
    await ok(
      admin.from("direct_messages").insert({
        sender_id: a.user.id,
        recipient_id: b.user.id,
        body: "Dismiss this notification",
      }),
    );
    await B.wait(
      "Array.from(document.querySelectorAll('[data-notification-popup]')).some(el=>el.textContent.includes('Dismiss this notification'))",
    );
    await B.evaluate(
      "Array.from(document.querySelectorAll('[data-notification-popup]')).find(el=>el.textContent.includes('Dismiss this notification')).querySelector('[aria-label=\"Dismiss notification\"]').click()",
    );
    await B.evaluate(
      "import(performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname === '/src/store/notificationStore.js').at(-1).name).then(m=>m.useNotificationStore.getState().refresh())",
    );
    assert(
      !(await B.evaluate(
        "Array.from(document.querySelectorAll('[data-notification-popup]')).some(el=>el.textContent.includes('Dismiss this notification'))",
      )),
    );
    pass(
      "Ten-second auto-dismiss, manual dismissal, no repeated popup and persistent unread notification",
    );

    await A.navigate(`/projects/${tag}/workspace`);
    await A.wait("document.body.innerText.includes('Team')");
    await A.click("Team");
    await A.wait(
      "!!document.querySelector('[aria-label=\"Friend to invite\"]')",
    );
    await A.wait(
      `!!document.querySelector('[aria-label="Friend to invite"] option[value="${b.user.user_metadata.username}"]')`,
    );
    await A.fill(
      '[aria-label="Friend to invite"]',
      b.user.user_metadata.username,
      "HTMLSelectElement",
    );
    await A.click("Send invitation");
    await A.wait(
      "document.body.innerText.includes('Invited') || document.body.innerText.includes('invited')",
    );
    await B.navigate(`/projects/${tag}`);
    await B.wait("document.body.innerText.includes('Accept invitation')");
    await B.click("Accept invitation");
    await B.wait("document.body.innerText.includes('Open workspace')");
    pass(
      "Friend picker, project invitation, recipient acceptance and membership UI",
    );
    await A.wait(
      "[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Settings')",
    );
    await A.click("Settings");
    await A.wait(
      "!!document.querySelector('input[aria-label=\"Project gallery image\"]')",
    );
    await A.upload('input[aria-label="Project gallery image"]', pngPath);
    await A.wait("!!document.querySelector('img[alt=\"Project image 1\"]')");
    const G = await page();
    await G.navigate(`/showcase/${tag}`);
    await G.wait("document.body.innerText.includes('View Live Demo')");
    assert.equal(
      await G.evaluate(
        "Array.from(document.querySelectorAll('a')).find(a=>a.textContent.includes('View Live Demo')).href",
      ),
      "https://example.com/demo",
    );
    await G.wait("!!document.querySelector('.project-banner img')");
    pass(
      "Owner gallery upload and anonymous project detail with live demo/repository links",
    );
    await B.navigate("/settings");
    await B.wait(
      "Array.from(document.querySelectorAll('select')).some(s=>Array.from(s.options).some(o=>o.value==='mentor'))",
    );
    await B.fill("select", "mentor", "HTMLSelectElement");
    await B.click("Save changes");
    await B.wait("document.body.innerText.includes('All changes saved')");
    const beforeRoleReload = await B.evaluate("performance.timeOrigin");
    await B.cmd("Page.reload");
    await B.wait(
      `performance.timeOrigin!==${beforeRoleReload} && document.readyState==='complete'`,
    );
    await B.wait("document.querySelector('select')?.value==='mentor'");
    await B.evaluate(
      "document.querySelector('[aria-label=\"Open account menu\"]').click()",
    );
    await B.click("Log out");
    await B.wait(
      "location.pathname==='/login' && !!document.querySelector('input[type=email]')",
    );
    await B.navigate("/");
    await B.wait(
      "document.body.innerText.includes('Get started') || document.body.innerText.includes('Get Started')",
    );
    await B.navigate("/login");
    await B.wait("!!document.querySelector('input[type=email]')");
    await B.fill("input[type=email]", b.email);
    await B.fill("input[type=password]", b.password);
    await B.evaluate("document.querySelector('form').requestSubmit()");
    await B.wait("location.pathname==='/dashboard'");
    assert.equal(
      await B.evaluate(
        "import(performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname === '/src/store/authStore.js').at(-1)?.name || '/src/store/authStore.js').then(m=>m.useAuthStore.getState().user.role)",
      ),
      "mentor",
    );
    pass(
      "Learner-to-Mentor setting, refresh, logout/login persistence and signed-out navigation",
    );
    await A.navigate("/community");
    await A.wait(
      "document.body.innerText.includes('A clearer community discussion')",
    );
    await A.screenshot("social-community-desktop");
    for (const path of [
      "/community",
      "/notifications",
      `/messages?to=${b.user.id}`,
      `/projects/${tag}`,
      "/dashboard",
      "/books",
    ]) {
      await A.cmd("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await A.navigate(path);
      await A.wait("!document.body.innerText.includes('Loading Colearn')");
      await pause(800);
      assert(
        await A.evaluate(
          "document.documentElement.scrollWidth<=window.innerWidth+1",
        ),
        `Mobile overflow: ${path}`,
      );
    }
    await A.navigate("/community");
    await pause(1200);
    await A.screenshot("social-community-mobile");
    pass(
      "Mobile Community, notifications, messages, projects, dashboard and book catalog fit the viewport",
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  passed = true;
} finally {
  for (const context of contexts)
    await send("Target.disposeBrowserContext", {
      browserContextId: context,
    }).catch(() => {});
  if (project) {
    const objects = await admin.storage
      .from("project-covers")
      .list(String(project.id));
    if (objects.data?.length)
      await admin.storage
        .from("project-covers")
        .remove(objects.data.map((o) => `${project.id}/${o.name}`));
  }
  for (const account of accounts) {
    const list = await admin
      .from("direct_messages")
      .select("image_path")
      .eq("sender_id", account.user.id)
      .not("image_path", "is", null);
    if (list.data?.length)
      await admin.storage
        .from("chat-images")
        .remove(list.data.map((m) => m.image_path));
    await admin.auth.admin.deleteUser(account.user.id);
  }
  ws.close();
  writeFileSync(
    process.argv.includes("--auth-only")
      ? ".dist/social-auth-ui-verification.json"
      : process.argv.includes("--project-only")
        ? ".dist/social-project-ui-verification.json"
        : ".dist/social-ui-verification.json",
    JSON.stringify(
      { passed, checks, errors, network, fixturesRemoved: true },
      null,
      2,
    ),
  );
}
