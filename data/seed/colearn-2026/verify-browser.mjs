import { createClient } from "../../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `workspace-${Date.now()}`,
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
    captureBeyondViewport: !name.startsWith('navbar'),
  });
  writeFileSync(`.dist/${name}.png`, Buffer.from(data, "base64"));
};
const dataset = JSON.parse(readFileSync('.dist/data-generated.json', 'utf8'));
const viewedThreads = new Map();
let fixture;
let completed = false;
try {
  const email = `${tag}@colearn.example`, password = `Verify!${randomUUID()}`;
  const { user } = await ok(admin.auth.admin.createUser({email,password,email_confirm:true,
    user_metadata:{username:tag,full_name:'Data verification fixture'},app_metadata:{verification_fixture:true}}));
  fixture = user;
  await ok(admin.from('profiles').update({onboarding_completed:true,headline:'Temporary verification account'}).eq('id', user.id));
  await ok(admin.from('user_skills').insert({user_id:user.id,skill_id:dataset.user_skills[0].skill_id,level:'beginner'}));
  const project = await ok(admin.from('projects').insert({owner_id:user.id,slug:tag,title:'Data verification workspace',summary:'Temporary test fixture; removed after verification.',status:'active',is_public:false}).select().single());
  projects.push(project);
  await ok(admin.from('tasks').insert({project_id:project.id,assignee_id:user.id,title:'Review the imported dataset',status:'todo',priority:'high'}));
  const samples = dataset.notifications.filter(n=>n.actor_id && n.target_type==='project').slice(0,3);
  await ok(admin.from('notifications').insert(samples.map(({id,...n})=>({...n,user_id:user.id,is_read:false}))));
  await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  const clear=await send('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear()'});
  await send('Page.navigate',{url:origin+'/login'});
  await wait("!!document.querySelector('input[type=email]')");
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:clear.identifier});
  await fill('input[type=email]',email);await fill('input[type=password]',password);
  await evaluate("document.querySelector('form').requestSubmit()");
  await wait("!!document.querySelector('[data-dashboard=workspace]') && document.body.innerText.includes('Review the imported dataset')");
  pass('Dashboard loads with actual membership/task data and existing recommendation queries');
  await snapshot('data-dashboard',1440,1100);
  await evaluate("window.seedApi = await import('/src/services/api.js')");
  const people=await evaluate("(await window.seedApi.users.getUsers()).items.map(p=>({username:p.username,name:p.fullName,skills:p.skills.length}))");
  assert(dataset.profiles.every(p=>people.some(u=>u.username===p.username&&u.name===p.full_name&&u.skills>0)));
  pass('All 215 international profiles normalize with names and linked skills');
  const filtered=await evaluate("(await window.seedApi.users.getUsers({location:'Nepal'})).items.map(p=>p.location)");
  assert(filtered.length>=5);assert(filtered.every(l=>l.includes('Nepal')));
  const skill=await evaluate("(await window.seedApi.users.getUsers({skills:['React']})).items.map(p=>p.skills.map(s=>s.name))");
  assert(skill.length>0&&skill.every(s=>s.includes('React')));
  pass('People country and skill filters use the imported relationships');
  await send('Page.navigate',{url:origin+'/people'});
  await wait("!!document.querySelector('input[placeholder]') && document.body.innerText.includes('Filter people')");
  await fill('input[placeholder="Search by name or headline..."]',dataset.profiles[0].full_name);
  await wait(`document.body.innerText.includes(${JSON.stringify(dataset.profiles[0].full_name)}) && !document.body.innerText.includes('Loading Colearn...')`);
  await snapshot('data-people',1440,1100);
  pass('People search renders a named fictional profile');
  await send('Page.navigate',{url:origin+'/projects'});
  await wait("!!document.querySelector('input[placeholder=\"Search projects...\"]')");
  await fill('input[placeholder="Search projects..."]','Quiet-seat');
  await wait("document.body.innerText.includes('Quiet-seat map')");
  await snapshot('data-projects',1440,1100);
  await evaluate("window.seedApi = await import('/src/services/api.js')");
  const matchedProjects=await evaluate("(await window.seedApi.projects.getProjects({status:'active',tech:['React']})).projects.map(p=>({status:p.status,stack:p.techStack}))");
  assert(matchedProjects.length>0&&matchedProjects.every(p=>p.status==='active'&&p.stack.includes('React')));
  pass('Project search, status and technology filters match the new dataset');
  await send('Page.navigate',{url:origin+'/projects/'+dataset.projects[0].slug});
  await wait(`document.body.innerText.includes(${JSON.stringify(dataset.projects[0].title)}) && document.body.innerText.includes('Fictional student project')`);
  pass('Project detail renders coherent scope, owner and team data');
  await send('Page.navigate',{url:origin+'/community'});
  await wait("!!document.querySelector('input[placeholder=\"Search discussions...\"]')");
  await fill('input[placeholder="Search discussions..."]','two-week student prototype');
  await wait("document.body.innerText.includes('What goes into a brief')");
  await snapshot('data-community',1440,1100);
  await evaluate("window.seedApi = await import('/src/services/api.js')");
  const unanswered=await evaluate("(await window.seedApi.community.getThreads({ordering:'unanswered'})).threads.map(t=>t.commentCount)");
  assert(unanswered.length>0&&unanswered.every(n=>n===0));
  pass('Community search and unanswered filter use actual comment counts');
  const thread=dataset.threads.at(-1);
  viewedThreads.set(thread.id,await ok(admin.from('threads').select('*').eq('id',thread.id).single()));
  await send('Page.navigate',{url:origin+'/community/'+thread.slug});
  await wait("document.body.innerText.includes('A setup guide') || document.body.innerText.includes('We tried a five-line brief')");
  await snapshot('data-thread',1440,1100);
  pass('Long thread renders nested replies and linked fictional authors');
  await send('Page.navigate',{url:origin+'/leaderboard'});
  await wait("document.body.innerText.includes('Leaderboard') && !document.body.innerText.includes('Loading Colearn...')");
  await evaluate("window.seedApi = await import('/src/services/api.js')");
  for(const period of ['all','week','month']){
    const entries=await evaluate(`(await window.seedApi.game.getLeaderboard({period:${JSON.stringify(period)},limit:100})).entries`);
    assert(entries.length>20);assert(entries.some(e=>JSON.stringify(e).includes('.demo')));
  }
  await snapshot('data-leaderboard',1440,1100);
  pass('All-time, weekly and monthly leaderboards load dated imported activity');
  const top=dataset.profiles.reduce((a,b)=>a.xp>b.xp?a:b);
  await send('Page.navigate',{url:origin+'/u/'+top.username});
  await wait(`document.body.innerText.includes(${JSON.stringify(top.full_name)}) && document.body.innerText.includes('Fictional demo profile')`);
  await snapshot('data-profile',1440,1100);
  pass('Public profile and portfolio display skills, projects, achievements and activity');
  await send('Page.navigate',{url:origin+'/notifications'});
  await wait("document.querySelectorAll('[data-notification-id]').length>0");
  await snapshot('data-notifications',1440,1100);
  pass('Notification actor names, supported verbs and target labels render');
  await send('Page.navigate',{url:origin+'/library'});
  await wait("document.body.innerText.includes('Designing Data-Intensive Applications')");
  pass('Existing library still loads its original titles');
  const badText=await evaluate("/\\b(undefined|NaN)\\b/.test(document.body.innerText)");
  assert(!badText);
  assert.equal((await evaluate("Array.from(document.images).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)")).length,0);
  assert.deepEqual(errors,[]);assert.deepEqual(badNetwork,[]);
  pass('No browser exceptions, error responses, invalid text or broken rendered images');
  completed = true;
} finally {
  // Remove the fixture's visits and decrement only those counts, retaining any
  // other visitor's concurrent activity. Restore the original timestamp when
  // the fixture was the only new visit.
  if(fixture){
    const visits=await ok(admin.from('thread_views').select('*').eq('user_id',fixture.id));
    await ok(admin.auth.admin.deleteUser(fixture.id));
    if(visits.length){
      let sql='BEGIN; ALTER TABLE public.threads DISABLE TRIGGER USER;\n';
      for(const [id,original] of viewedThreads){
        const n=visits.filter(v=>v.thread_id===id).length;
        if(n)sql+=`UPDATE public.threads SET views=views-${n}, updated_at=CASE WHEN views=${original.views+n} THEN '${original.updated_at}'::timestamptz ELSE updated_at END WHERE id=${id} AND views>=${original.views+n};\n`;
      }
      sql+='ALTER TABLE public.threads ENABLE TRIGGER USER; COMMIT;';
      writeFileSync('.dist/data-browser-cleanup.sql',sql);
      execFileSync('supabase.cmd',['db','query','--linked','--file','.dist/data-browser-cleanup.sql'],{shell:true,encoding:'utf8'});
    }
  }
  writeFileSync('data/seed/colearn-2026/browser-verification.json',JSON.stringify({checked_at:new Date().toISOString(),status:completed?'passed':'failed',checks,errors,badNetwork},null,2)+'\n');
  ws.close();
}
