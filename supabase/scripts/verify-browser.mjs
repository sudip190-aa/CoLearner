// Uses an existing local Chromium CDP endpoint; browser credentials never leave .dist.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `browser-${Date.now()}`;
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
const admin = createClient(
  `https://${ref}.supabase.co`,
  keys.find((k) => k.name === "service_role").api_key,
  { auth: { persistSession: false } },
);
const ok = async (p) => {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const email = `${tag}@example.com`,
  password = `Test!${randomUUID()}`;
const { user } = await ok(
  admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: tag, full_name: "Browser verification" },
  }),
);
await ok(
  admin
    .from("profiles")
    .update({ is_staff: true, is_superuser: true, onboarding_completed: true })
    .eq("id", user.id),
);
const tabs = await (await fetch("http://127.0.0.1:9223/json")).json();
const ws = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sequence = 0;
const pending = new Map(),
  errors = [],
  badNetwork = [];
ws.addEventListener("message", ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.reject(new Error(m.error.message));
    else p.resolve(m.result);
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
      url: m.params.response.url,
    });
  else if (
    m.method === "Network.requestWillBeSent" &&
    /:8000\//.test(m.params.request.url)
  )
    errors.push("Unexpected Django request: " + m.params.request.url);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
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
const waitFor = async (expression) => {
  for (let i = 0; i < 90; i++) {
    try {
      if (await evaluate(expression)) return;
    } catch {}
    await pause(500);
  }
  throw new Error("Timed out waiting for browser state: " + expression);
};
let projectSlug, threadSlug, bookId;
try {
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.enable");
  const clear = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.clear()",
  });
  await send("Page.navigate", { url: "http://127.0.0.1:5176/login" });
  await waitFor("!!document.querySelector('input[type=email]')");
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: clear.identifier,
  });
  errors.length = 0;
  badNetwork.length = 0;
  // Exercise the actual form and route guard, not just the Supabase SDK.
  await evaluate(
    `(()=>{const set=(el,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};set(document.querySelector('input[type=email]'),${JSON.stringify(email)});set(document.querySelector('input[type=password]'),${JSON.stringify(password)});document.querySelector('form').requestSubmit()})()`,
  );
  await waitFor(
    "location.pathname === '/dashboard' && document.body.innerText.includes('Good')",
  );
  console.log("PASS browser login form and protected dashboard");
  await evaluate("import('/src/services/api.js').then(m=>{window.api=m})");
  const reads = await evaluate(
    `(async()=>{const names=['library','projects','users','community','game','notifs','dashboard','search','admin'];const calls=[api.library.getBooks(),api.projects.getProjects(),api.users.getUsers(),api.community.getThreads(),api.game.getBadges(),api.notifs.getNotifications(),api.dashboard.getDashboard(),api.search.globalSearch('react'),api.admin.getAdminStats()];return Promise.all(calls.map(async(p,i)=>{try{await p;return names[i]+': ok'}catch(e){throw new Error(names[i]+': '+e.message)}}))})()`,
  );
  console.log("PASS frontend data loading:", reads.join(", "));
  const created = await evaluate(
    `(async()=>{const {project}=await api.projects.createProject({title:'${tag}',summary:'Browser integration check',description:'Temporary project',category:'Education',techStack:['React'],maxMembers:5,isPublic:true});window.testProject=project;return {slug:project.slug}})()`,
  );
  projectSlug = created.slug;
  await evaluate(
    `(async()=>{const {task}=await api.projects.createTask(testProject.slug,{title:'Browser task',assigneeId:${JSON.stringify(user.id)}});await api.projects.updateTask(task.id,{status:'done'});await api.projects.deleteTask(task.id);const {milestone}=await api.projects.createMilestone(testProject.slug,{title:'Browser milestone'});await api.projects.updateMilestone(milestone.id,{status:'done'});await api.projects.deleteMilestone(milestone.id);await api.projects.createUpdate(testProject.slug,'Browser project update');})()`,
  );
  console.log("PASS frontend project/task/milestone/update CRUD");
  const routeResults = [];
  for (const route of [
    "/library",
    "/projects",
    `/projects/${projectSlug}/workspace`,
    "/people",
    "/community",
    "/leaderboard",
    "/badges",
    "/notifications",
    "/settings",
    "/admin",
    "/admin/users",
    "/admin/books",
    "/admin/projects",
    "/admin/reports",
    `/u/${tag}`,
  ]) {
    await send("Page.navigate", { url: `http://127.0.0.1:5176${route}` });
    await waitFor(
      "document.readyState==='complete' && !document.body.innerText.includes('Loading Colearn...')",
    );
    await pause(2200);
    const result = await evaluate(
      "({path:location.pathname,text:document.body.innerText})",
    );
    if (result.path !== route)
      throw new Error(`Route ${route} redirected to ${result.path}`);
    if (
      /Something went wrong|Could not load|couldn't load|Unable to load|Failed to load/i.test(
        result.text,
      )
    )
      throw new Error(`Page error at ${route}: ${result.text.slice(0, 900)}`);
    routeResults.push(route);
    console.log("PASS browser route", route);
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:5176/dashboard" });
  await waitFor(
    "document.body.innerText.includes('Good') && document.body.innerText.includes('Recent XP')",
  );
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  writeFileSync(
    ".dist/supabase-dashboard-mobile.png",
    Buffer.from(shot.data, "base64"),
  );
  await send("Emulation.clearDeviceMetricsOverride");
  if (errors.length || badNetwork.length)
    throw new Error(JSON.stringify({ errors, badNetwork }));
  writeFileSync(
    ".dist/browser-verification.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        routes: routeResults,
        errors,
        badNetwork,
      },
      null,
      2,
    ),
  );
  console.log("PASS browser console/network and mobile rendering");
} finally {
  if (projectSlug)
    await admin.from("projects").delete().eq("slug", projectSlug);
  if (threadSlug) await admin.from("threads").delete().eq("slug", threadSlug);
  if (bookId) await admin.from("books").delete().eq("id", bookId);
  await admin.auth.admin.deleteUser(user.id);
  ws.close();
  console.log("Removed temporary browser test account and content.");
}
