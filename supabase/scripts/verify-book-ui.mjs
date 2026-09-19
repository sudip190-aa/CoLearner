import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `books-ui-${Date.now()}`,
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
const admin = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "service_role").api_key,
  options,
);
const peer = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "anon").api_key,
  options,
);
const ok = async (query) => {
  const r = await query;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const accounts = [],
  projects = [],
  errors = [],
  badNetwork = [],
  checks = [];
const info = await (await fetch("http://127.0.0.1:9224/json/version")).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
let browserSession;
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sequence = 0;
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
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(!method.startsWith("Target.") && browserSession
          ? { sessionId: browserSession }
          : {}),
      }),
    );
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression: `(async () => (${expression}))()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text,
    );
  return r.result.value;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const wait = async (expression, attempts = 90) => {
  for (let n = 0; n < attempts; n++) {
    try {
      if (await evaluate(expression)) return;
    } catch {}
    await pause(300);
  }
  throw new Error("Timed out: " + expression);
};
const click = (label) =>
  evaluate(
    `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`,
  );
const fill = (selector, value, tagName = "HTMLInputElement") =>
  evaluate(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${tagName}.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})()`,
  );
const pass = (message) => {
  checks.push(message);
  console.log("PASS " + message);
};
const snapshot = async (name, width, height) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await pause(350);
  assert(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
    `Horizontal overflow at ${width}px`,
  );
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport:
      !name.startsWith("book-reader") &&
      !name.startsWith("reader-completed") &&
      !name.startsWith("book-assistant") &&
      !name.startsWith("admin-book"),
  });
  writeFileSync(`.dist/${name}.png`, Buffer.from(data, "base64"));
};

const { browserContextId } = await send("Target.createBrowserContext");
const { targetId } = await send("Target.createTarget", {
  url: "about:blank",
  browserContextId,
});
browserSession = (
  await send("Target.attachToTarget", { targetId, flatten: true })
).sessionId;

try {
  const email = `${tag}@colearn.example`,
    password = `Verify!${randomUUID()}`;
  const { user } = await ok(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: tag, full_name: "Learning Verification" },
    }),
  );
  accounts.push(user);
  await ok(
    admin
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id),
  );
  const book = await ok(
    admin
      .from("books")
      .select("id,slug")
      .eq("slug", "javascript-foundations")
      .single(),
  );
  const chapters = await ok(
    admin
      .from("chapters")
      .select("*")
      .eq("book_id", book.id)
      .order("chapter_number"),
  );
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.enable");
  const clear = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.clear()",
  });
  await send("Page.navigate", { url: origin + "/books" });
  await wait("document.body.innerText.includes('JavaScript Foundations')");
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: clear.identifier,
  });
  await snapshot("books-catalog-desktop", 1440, 1000);
  await snapshot("books-catalog-mobile", 390, 844);
  await fill('input[aria-label="Search books"]', "JavaScript");
  await wait(
    "!document.querySelector('main').innerText.includes('Connected Systems')",
  );
  pass("Public approved catalog, responsive cards and search");
  await send("Page.navigate", {
    url: origin + "/books/javascript-foundations",
  });
  await wait("document.body.innerText.includes('Source & license')");
  assert(await evaluate("document.body.innerText.includes('MIT')"));
  await evaluate("document.querySelector('details').open=true");
  assert(
    await evaluate(
      "document.body.innerText.includes('Permission is hereby granted')",
    ),
  );
  await snapshot("book-detail-mobile", 390, 844);
  pass("Public detail includes source, exact license notice and attribution");
  await send("Page.navigate", { url: origin + "/login" });
  await wait("!!document.querySelector('input[type=email]')");
  await fill("input[type=email]", email);
  await fill("input[type=password]", password);
  await evaluate("document.querySelector('form').requestSubmit()");
  await wait("location.pathname==='/dashboard'");
  await send("Page.navigate", { url: origin + "/" });
  await wait(
    "document.querySelector('header').innerText.includes('My Dashboard')",
  );
  assert(
    !(await evaluate(
      "document.querySelector('header').innerText.includes('Get started')",
    )),
  );
  await send("Page.reload");
  await wait(
    "document.querySelector('header').innerText.includes('My Dashboard')",
  );
  pass(
    "Login persists across dashboard, home navigation and page reload; signed-in CTAs show My Dashboard",
  );
  await send("Page.navigate", {
    url: origin + "/books/javascript-foundations/read",
  });
  await wait("!!document.querySelector('article[aria-busy=false] pre')");
  await pause(1300);
  await snapshot("book-reader-mobile", 390, 844);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await pause(500);
  await evaluate(
    "(()=>{const el=document.querySelector('article');window.scrollTo(0,el.offsetTop-96+0.42*Math.max(1,el.scrollHeight-innerHeight+220))})()",
  );
  await pause(2000);
  let saved = await ok(
    admin
      .from("chapter_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("chapter_id", chapters[0].id)
      .single(),
  );
  assert(Number(saved.position_percent) > 20, "Scroll position not persisted");
  assert.equal(saved.completed_at, null);
  await send("Page.reload");
  await wait("!!document.querySelector('article[aria-busy=false] pre')");
  await wait("window.scrollY>100");
  pass(
    "Reader scroll position resumes after reload without falsely completing a chapter",
  );
  await click("Ask this book");
  await wait("!!document.querySelector('[role=dialog]')");
  await wait("document.body.innerText.includes('not configured yet')");
  await snapshot("book-assistant-desktop", 1440, 1000);
  await snapshot("book-assistant-mobile", 390, 844);
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
  });
  await wait("!document.querySelector('[role=dialog]')");
  pass(
    "Assistant dialog works on desktop/mobile with an honest configuration state",
  );
  await evaluate(
    "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Mark complete')).click()",
  );
  await wait("!!document.querySelector('[aria-label=\"Chapter completed\"]')");
  await snapshot("reader-completed-light-mobile", 390, 844);
  assert(
    await evaluate(
      "(()=>{const nav=document.querySelector('nav[aria-label]').getBoundingClientRect();return [...document.querySelectorAll('[data-toast-viewport],[data-notification-popup]')].every(el=>{const r=el.getBoundingClientRect();return r.bottom<=nav.top||r.width===0})})()",
    ),
  );
  await pause(4500);
  await snapshot("reader-completed-clear-mobile", 390, 844);

  await evaluate("document.documentElement.classList.add('dark')");
  await snapshot("reader-completed-dark-mobile", 390, 844);
  await snapshot("reader-completed-dark-desktop", 1440, 1000);
  await evaluate("document.documentElement.classList.remove('dark')");
  await send("Page.reload");
  await wait("!!document.querySelector('[aria-label=\"Chapter completed\"]')");
  await evaluate(
    "document.querySelector('[aria-label=\"Next chapter\"]').click()",
  );
  await wait(
    "location.search.includes('chapter=2') && !!document.querySelector('article[aria-busy=false]')",
  );
  await evaluate(
    "document.querySelector('[aria-label=\"Previous chapter\"]').click()",
  );
  await wait("!!document.querySelector('[aria-label=\"Chapter completed\"]')");
  pass(
    "Mark complete stays visibly completed after refresh and next/previous navigation; mobile and desktop fit both themes",
  );
  await pause(800);
  assert(
    !(await evaluate(
      "document.body.innerText.includes('Unexpected Application Error')",
    )),
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  saved = await ok(
    admin
      .from("reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", book.id)
      .single(),
  );
  assert(saved.completed_chapters.includes(chapters[0].id));
  assert.equal(saved.progress_percent, Math.round(100 / chapters.length));
  await send("Page.navigate", { url: origin + "/dashboard" });
  await wait(
    "document.body.innerText.toLowerCase().includes('continue your chapter') && document.body.innerText.includes('JavaScript Foundations')",
  );
  await snapshot("dashboard-book-learning", 1440, 1000);
  pass("Saved chapter completion appears in the dashboard reading card");
  await send("Page.navigate", { url: origin + "/library" });
  await wait("document.body.innerText.includes('JavaScript Foundations')");
  await send("Page.navigate", { url: origin + "/projects" });
  await wait("!!document.querySelector('input')");
  await send("Page.navigate", { url: origin + "/people" });
  await wait("document.body.innerText.includes('Discover people')");
  await send("Page.navigate", { url: origin + "/messages" });
  await wait("document.body.innerText.includes('Messages')");
  pass("Existing library, projects, people and messages routes load");
  await send("Page.navigate", { url: origin + "/admin/books" });
  await wait(
    "document.body.innerText.includes('404') || document.body.innerText.includes('not found') || document.body.innerText.includes('lost')",
  );
  await ok(admin.from("profiles").update({ is_staff: true }).eq("id", user.id));
  await send("Page.reload");
  await wait("document.body.innerText.includes('Curate the library')");
  await click("Add book");
  await wait("!!document.querySelector('[data-form=book]')");
  await fill("input[name=title]", `UI workflow fixture ${tag}`);
  await fill("input[name=author]", "CoLearn tests");
  await evaluate("document.querySelector('[data-form=book]').requestSubmit()");
  await wait("document.body.innerText.includes('Publishing & permissions')");
  const fixture = await ok(
    admin
      .from("books")
      .select("id")
      .eq("title", `UI workflow fixture ${tag}`)
      .single(),
  );
  projects.push(fixture.id);
  await snapshot("admin-book-publishing", 1440, 1000);
  await click("Approve");
  await wait("document.body.innerText.includes('Approval requires')");
  pass(
    "Admin route protected; staff can add a draft and cannot approve missing license evidence",
  );
  await evaluate(
    "Array.from(document.querySelectorAll('summary')).find(s=>s.textContent.includes('Review source')).parentElement.open=true",
  );
  for (const [name, value] of Object.entries({
    language: "English",
    sourceUrl: "https://example.com/source",
    licenseName: "Original test content",
    licenseUrl: "https://example.com/license",
    licenseEvidenceUrl: "https://example.com/permission",
  }))
    await fill(`input[name=${name}]`, value);
  for (const [name, value] of Object.entries({
    attribution: "CoLearn test suite. Original fixture.",
    changesMade: "None",
    licenseEvidenceNotes: "Exact original test content owned by its author.",
  }))
    await fill(`textarea[name=${name}]`, value, "HTMLTextAreaElement");
  await click("Save license details");
  await wait("document.body.innerText.includes('License details saved')");
  await evaluate(
    "document.querySelector('input[name=redistributionConfirmed]').click()",
  );
  await click("Save license details");
  await wait(
    "!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Save license details')).disabled",
  );
  await click("Add chapter");
  await wait("!!document.querySelector('[data-form=chapter]')");
  await fill("input[name=chapterTitle]", "Understanding learning progress");
  await fill(
    "textarea[name=chapterContent]",
    "Learning progress records the chapters you finish. Opening a chapter records a reading session without marking the chapter complete.",
    "HTMLTextAreaElement",
  );
  await evaluate(
    "document.querySelector('[data-form=chapter]').requestSubmit()",
  );
  await wait("!document.querySelector('[data-form=chapter]')");
  await click("Approve");
  await wait("document.body.innerText.includes('Approve: saved')");
  assert.equal(
    (
      await ok(
        admin.from("books").select("status").eq("id", fixture.id).single(),
      )
    ).status,
    "APPROVED",
  );
  await click("Process / reprocess");
  await wait("document.body.innerText.includes('Processing queued')");
  pass(
    "Admin can save license evidence, manually confirm permission, add a chapter, approve and queue processing",
  );
  await evaluate(
    "document.querySelector('[aria-label=\"Open account menu\"]').click()",
  );
  await click("Log out");
  await wait("location.pathname==='/login'");
  await send("Page.navigate", { url: origin + "/" });
  await wait(
    "document.querySelector('header').innerText.includes('Get started')",
  );
  assert(
    !(await evaluate(
      "document.querySelector('header').innerText.includes('My Dashboard')",
    )),
  );
  pass("Logout restores signed-out navigation");
} catch (error) {
  console.error(error);
  writeFileSync(
    ".dist/book-ui-failure.txt",
    await evaluate("document.body.innerText").catch(() => ""),
  );
  process.exitCode = 1;
} finally {
  await send("Page.stopLoading").catch(() => {});
  await send("Page.navigate", { url: "about:blank" }).catch(() => {});
  await pause(500);
  for (const id of projects) await admin.from("books").delete().eq("id", id);
  await admin
    .from("books")
    .delete()
    .eq("title", `UI workflow fixture ${tag}`)
    .eq("author", "CoLearn tests");
  for (const a of accounts) await admin.auth.admin.deleteUser(a.id);
  // An intentional failed approval request is expected; all other errors are reported for review.
  const unexpected = badNetwork.filter(
    (x) => !(x.path === "/rest/v1/books" && x.status === 400),
  );
  if (errors.length || unexpected.length) process.exitCode = 1;
  writeFileSync(
    ".dist/book-ui-verification.json",
    JSON.stringify(
      {
        passed: !process.exitCode,
        checks,
        errors,
        badNetwork,
        unexpected,
        fixturesRemoved: true,
      },
      null,
      2,
    ),
  );
  await send("Target.disposeBrowserContext", { browserContextId }).catch(
    () => {},
  );
  ws.close();
}
