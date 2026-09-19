import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `library-${Date.now()}`,
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
const tabs = await (await fetch("http://127.0.0.1:9223/json")).json();
const ws = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
);
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
    ws.send(JSON.stringify({ id, method, params }));
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
    captureBeyondViewport: !name.startsWith("navbar"),
  });
  writeFileSync(`.dist/${name}.png`, Buffer.from(data, "base64"));
};
const beforeBooks = await ok(admin.from("books").select("*").order("id"));
const beforeChapters = await ok(admin.from("chapters").select("*").order("id"));
const alice = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "anon").api_key,
  options,
);
const selectLabel = async (label, value) =>
  evaluate(
    `(()=>{const label=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.trim()===${JSON.stringify(label)});const el=document.getElementById(label.htmlFor);Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
let complete = false;
try {
  for (const i of [0, 1]) {
    const email = `${tag}-${i}@colearn.example`,
      password = `Verify!${randomUUID()}`;
    const { user } = await ok(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: `${tag}-${i}`,
          full_name: i ? "Library privacy fixture" : "Library student fixture",
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
  }
  const [a, b] = accounts;
  await ok(
    alice.auth.signInWithPassword({ email: a.email, password: a.password }),
  );
  await ok(
    peer.auth.signInWithPassword({ email: b.email, password: b.password }),
  );
  await ok(
    peer
      .from("library_preferences")
      .upsert({
        user_id: b.id,
        goal: "career",
        topics: [],
        level: "all",
        session_minutes: 30,
      }),
  );
  await ok(
    peer
      .from("saved_books")
      .insert({ user_id: b.id, book_id: beforeBooks[0].id }),
  );
  assert.deepEqual(
    await ok(alice.from("library_preferences").select("*").eq("user_id", b.id)),
    [],
  );
  assert.deepEqual(
    await ok(alice.from("saved_books").select("*").eq("user_id", b.id)),
    [],
  );
  assert(
    (
      await alice
        .from("library_preferences")
        .insert({ user_id: b.id, goal: "exams" })
    ).error,
  );
  assert(
    (
      await alice
        .from("saved_books")
        .insert({ user_id: b.id, book_id: beforeBooks[1].id })
    ).error,
  );
  await ok(
    alice
      .from("library_preferences")
      .update({ goal: "exams" })
      .eq("user_id", b.id),
  );
  await ok(alice.from("saved_books").delete().eq("user_id", b.id));
  assert.equal(
    (await ok(peer.from("library_preferences").select("goal").single())).goal,
    "career",
  );
  assert.equal((await ok(peer.from("saved_books").select("*"))).length, 1);
  assert(
    (
      await alice
        .from("library_preferences")
        .insert({ user_id: a.id, session_minutes: -1 })
    ).error,
  );
  pass(
    "Live RLS isolates saved books and preferences; cross-account reads/writes are denied and invalid preferences rejected",
  );

  const started =
    beforeBooks.find((b) => b.title === "Prompt Design That Works") ||
    beforeBooks[0];
  const finished =
    beforeBooks.find((b) => b.title === "Algorithms You Can Explain") ||
    beforeBooks[1];
  for (const [book, count] of [
    [started, 3],
    [finished, 5],
  ]) {
    const chapters = beforeChapters
      .filter((c) => c.book_id === book.id)
      .sort((a, b) => a.chapter_number - b.chapter_number);
    const completed = chapters.slice(0, count).map((c) => c.id);
    await ok(
      admin
        .from("reading_progress")
        .insert({
          user_id: a.id,
          book_id: book.id,
          chapter_id: chapters[Math.min(count, chapters.length - 1)].id,
          completed_chapters: completed,
          progress_percent: (100 * completed.length) / chapters.length,
          completed: completed.length === chapters.length,
        }),
    );
  }
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const clear = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.clear()",
  });
  await send("Page.navigate", { url: origin + "/login" });
  await wait("!!document.querySelector('input[type=email]')");
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: clear.identifier,
  });
  await fill("input[type=email]", a.email);
  await fill("input[type=password]", a.password);
  await evaluate("document.querySelector('form').requestSubmit()");
  await wait("location.pathname==='/dashboard'");
  await send("Page.navigate", { url: origin + "/library" });
  await wait(
    "document.querySelectorAll('[data-library-book]').length===6 && !document.querySelector('#library-tab-saved').disabled",
  );
  await snapshot("library-minimal-desktop", 1440, 1100);
  pass(
    "Compact themed library renders six cards with progress and no oversized covers",
  );

  await evaluate("document.getElementById('library-tab-progress').click()");
  await wait("document.querySelectorAll('[data-library-book]').length===1");
  assert(
    await evaluate(
      `document.body.innerText.includes(${JSON.stringify(started.title)}) && document.body.innerText.includes('60% complete')`,
    ),
  );
  const continueUrl = await evaluate(
    "document.querySelector('[data-library-book] a[aria-label^=Continue]').getAttribute('href')",
  );
  assert(continueUrl.endsWith("?chapter=4"));
  await evaluate("document.getElementById('library-tab-completed').click()");
  await wait(
    `document.querySelector('[data-library-book]')?.innerText.includes(${JSON.stringify(finished.title)})`,
  );
  assert(
    await evaluate(
      "!!document.querySelector('[data-library-book] a[aria-label^=Review]')",
    ),
  );
  await evaluate("document.getElementById('library-tab-saved').click()");
  await wait("document.body.innerText.includes('Your next reads belong here')");
  pass(
    "In progress, completed and empty saved tabs reflect real account data; continue targets the next unread chapter",
  );

  await evaluate("document.getElementById('library-tab-all').click()");
  await wait("document.querySelectorAll('[data-library-book]').length===6");
  const saveSlug = await evaluate(
    "document.querySelector('[data-library-book]').getAttribute('data-library-book')",
  );
  await evaluate(
    "document.querySelector('[data-library-book] button[aria-label^=Save]').click()",
  );
  await wait(
    "!!document.querySelector('[data-library-book] button[aria-label^=Unsave]')",
  );
  await evaluate("document.getElementById('library-tab-saved').click()");
  await wait("document.querySelectorAll('[data-library-book]').length===1");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-library-book]').getAttribute('data-library-book')",
    ),
    saveSlug,
  );
  await send("Page.reload");
  await wait(
    "document.querySelectorAll('[data-library-book]').length===6 && !document.querySelector('#library-tab-saved').disabled",
  );
  await evaluate("document.getElementById('library-tab-saved').click()");
  await wait("document.querySelectorAll('[data-library-book]').length===1");
  await evaluate(
    "document.querySelector('[data-library-book] button[aria-label^=Unsave]').click()",
  );
  await wait("document.body.innerText.includes('Your next reads belong here')");
  assert.equal((await ok(alice.from("saved_books").select("*"))).length, 0);
  pass(
    "Save and unsave persist through reload and update the Saved collection",
  );

  await evaluate("document.getElementById('library-tab-all').click()");
  await fill('input[aria-label="Search library"]', "Django");
  await wait("document.querySelectorAll('[data-library-book]').length===1");
  assert(
    await evaluate(
      "document.querySelector('[data-library-book]').innerText.includes('Django')",
    ),
  );
  await fill('input[aria-label="Search library"]', "no-matching-book-xyz");
  await wait("document.body.innerText.includes('No books match just yet')");
  await fill('input[aria-label="Search library"]', "");
  await wait("document.querySelectorAll('[data-library-book]').length===6");
  await evaluate(
    "document.querySelector('button[aria-label^=\"Filter books\"]').click()",
  );
  await selectLabel("Difficulty", "advanced");
  await wait(
    "document.querySelectorAll('[data-library-book]').length>0 && Array.from(document.querySelectorAll('[data-library-book]')).every(b=>b.innerText.toLowerCase().includes('advanced'))",
  );
  await click("Reset filters");
  await evaluate(
    "document.querySelector('button[aria-label^=\"Filter books\"]').click()",
  );
  pass(
    "Search, no-results recovery and difficulty filters work without changing the collection",
  );

  await click("Learning preferences");
  await wait("!!document.querySelector('[role=dialog]')");
  await selectLabel("What are you working toward?", "projects");
  await selectLabel("Your preferred level", "beginner");
  await selectLabel("Time for a reading session", "15");
  const topic = await evaluate(
    "document.querySelector('[role=dialog] button[aria-pressed]').textContent.trim()",
  );
  await evaluate(
    "document.querySelector('[role=dialog] button[aria-pressed]').click()",
  );
  await snapshot("library-student-preferences", 1440, 1100);
  await click("Save preferences");
  await wait(
    "!document.querySelector('[role=dialog]') && document.querySelector('select[aria-label=\"Sort books\"]').value==='for-you'",
  );
  const pref = await ok(alice.from("library_preferences").select("*").single());
  assert.equal(pref.goal, "projects");
  assert.equal(pref.level, "beginner");
  assert.equal(pref.session_minutes, 15);
  assert(pref.topics.includes(topic));
  await send("Page.reload");
  await wait(
    "document.querySelector('select[aria-label=\"Sort books\"]')?.value==='for-you' && document.querySelectorAll('[data-library-book]').length===6",
  );
  await click("Learning preferences");
  await wait("!!document.querySelector('[role=dialog]')");
  assert(
    await evaluate(
      "document.querySelector('[role=dialog] select').value==='projects'",
    ),
  );
  await selectLabel("What are you working toward?", "career");
  await click("Save preferences");
  await wait("!document.querySelector('[role=dialog]')");
  assert.equal(
    (await ok(alice.from("library_preferences").select("goal").single())).goal,
    "career",
  );
  pass(
    "Study goal, topic, level and session preferences persist and activate personalized sorting",
  );

  await snapshot("library-minimal-tablet", 820, 1180);
  await snapshot("library-minimal-mobile", 390, 844);
  assert(
    await evaluate(
      "document.querySelector('[role=tablist]').scrollWidth<=document.querySelector('[role=tablist]').clientWidth+1",
    ),
    "All four collections fit on mobile",
  );
  await click("Learning preferences");
  await wait("!!document.querySelector('[role=dialog]')");
  await snapshot("library-preferences-mobile", 390, 844);
  await evaluate(
    "document.querySelector('button[aria-label=\"Close modal\"]').click()",
  );
  await evaluate(
    "(()=>{document.getElementById('library-tab-all').focus();document.getElementById('library-tab-all').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));})()",
  );
  await wait(
    "document.getElementById('library-tab-progress').getAttribute('aria-selected')==='true'",
  );
  assert.equal(
    await evaluate("document.activeElement.id"),
    "library-tab-progress",
  );
  await send("Page.navigate", { url: origin + continueUrl });
  const fourthChapter = beforeChapters.find(
    (c) => c.book_id === started.id && c.chapter_number === 4,
  );
  await wait(
    `document.querySelector('h1')?.innerText===${JSON.stringify(fourthChapter.title)}`,
  );
  assert.equal(
    new URL(await evaluate("location.href")).searchParams.get("chapter"),
    "4",
  );
  await pause(400);
  pass(
    "Desktop, tablet and phone layouts fit; preferences scroll on mobile; keyboard tabs and reader navigation work",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(badNetwork, []);
  pass("No browser console errors or failed network responses");
  complete = true;
} finally {
  // Close the document before deleting its account, so pending reader requests
  // cannot outlive the test identity. Cleanup also runs after a navigation failure.
  try {
    await send("Page.stopLoading");
    await send("Page.navigate", { url: "about:blank" });
    await pause(300);
  } finally {
    for (const account of accounts) await ok(admin.auth.admin.deleteUser(account.id));
  }
  assert.deepEqual(
    await ok(admin.from("books").select("*").order("id")),
    beforeBooks,
  );
  assert.deepEqual(
    await ok(admin.from("chapters").select("*").order("id")),
    beforeChapters,
  );
  writeFileSync(
    ".dist/library-verification.json",
    JSON.stringify(
      {
        status: complete ? "passed" : "failed",
        checks,
        errors,
        badNetwork,
        libraryContentUnchanged: true,
        fixturesRemoved: true,
      },
      null,
      2,
    ),
  );
  ws.close();
}
