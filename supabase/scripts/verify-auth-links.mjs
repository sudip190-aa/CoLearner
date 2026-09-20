// Verifies signup, recovery and confirmation links against the linked project.
// Requests one recovery email for a disposable example.com fixture; never real users.
import { createClient } from "../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const origin = process.env.COLEARN_TEST_ORIGIN || "http://127.0.0.1:5176";
const ref = "ghjdpcvnzclfvyosfhoz",
  tag = `links-${Date.now()}`,
  email = `${tag}@example.com`,
  password = `Verify!${randomUUID()}`;
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
  ),
  keys = Array.isArray(raw) ? raw : raw.api_keys || raw.keys;
const options = { auth: { persistSession: false, autoRefreshToken: false } },
  admin = createClient(
    `https://${ref}.supabase.co`,
    keys.find((k) => k.name === "service_role").api_key,
    options,
  ),
  anon = createClient(
    `https://${ref}.supabase.co`,
    keys.find((k) => k.name === "anon").api_key,
    options,
  );
const ok = async (p) => {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
let user, confirmationUser, recoveryResponse;
const info = await (await fetch("http://127.0.0.1:9224/json/version")).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
let browserSession;
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
  } else if (
    m.method === "Network.responseReceived" &&
    m.params.response.url.includes("/auth/v1/recover")
  ) {
    recoveryResponse = {
      requestId: m.params.requestId,
      status: m.params.response.status,
    };
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(
      JSON.stringify({
        id: n,
        method,
        params,
        ...(!method.startsWith("Target.") && browserSession
          ? { sessionId: browserSession }
          : {}),
      }),
    );
  });
const evalJS = async (expression) => {
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
const wait = async (predicate) => {
  for (let n = 0; n < 80; n++) {
    try {
      if (await evalJS(predicate)) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Auth browser state timed out: " + predicate);
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
  await send("Network.enable");
  const clear = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.clear(); sessionStorage.clear()",
  });
  await send("Page.navigate", { url: `${origin}/signup` });
  await wait("!!document.querySelector('input[name=terms]')");
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: clear.identifier,
  });
  await evalJS(
    `(()=>{const values=${JSON.stringify({ fullName: "Direct signup verification", email, username: tag, password })};for(const [name,value] of Object.entries(values)){const el=document.querySelector('input[name='+name+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('input[name=terms]').click()})()`,
  );
  await wait("!document.querySelector('button[type=submit]').disabled");
  await evalJS("document.querySelector('form').requestSubmit()");
  await wait(
    "location.pathname==='/onboarding' && document.body.innerText.includes('path')",
  );
  user = (await ok(admin.auth.admin.listUsers({ perPage: 1000 }))).users.find(
    (u) => u.email === email,
  );
  assert(user, "Signup did not create an account");
  assert(
    await evalJS(
      `(()=>{const session=JSON.parse(localStorage.getItem('sb-${ref}-auth-token')||'null');return !!session?.access_token&&session.user?.id===${JSON.stringify(user.id)}})()`,
    ),
    "Signup did not retain the session",
  );
  assert((await ok(anon.auth.signInWithPassword({ email, password }))).session);
  console.log(
    "PASS signup form immediately signs in and opens onboarding without confirmation email",
  );
  await send("Page.navigate", { url: `${origin}/forgot-password` });
  await wait("!!document.querySelector('input[name=email]')");
  await evalJS(
    `(()=>{const el=document.querySelector('input[name=email]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(email)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('form').requestSubmit()})()`,
  );
  await wait(
    "!!document.querySelector('[role=alert]') || document.body.innerText.includes('Check your inbox')",
  );
  assert(recoveryResponse, "Forgot-password form did not call Supabase");
  if (recoveryResponse.status >= 400) {
    const responseBody = JSON.parse(
      (
        await send("Network.getResponseBody", {
          requestId: recoveryResponse.requestId,
        })
      ).body,
    );
    assert(
      await evalJS("!!document.querySelector('[role=alert]')"),
      "Delivery error was hidden",
    );
    console.log(
      `LIMITATION recovery email service rejected the test recipient: ${responseBody.code || recoveryResponse.status}`,
    );
  } else
    console.log(
      "PASS forgot-password request accepted (inbox delivery is not verified)",
    );
  console.log(
    "PASS forgot-password form reports the actual email-service outcome",
  );
  // An abandoned provider login must not block a later password-recovery email.
  await evalJS(
    "sessionStorage.setItem('colearn:oauth-attempt',JSON.stringify({provider:'github',startedAt:Date.now()-3600000}))",
  );
  const recovery = await ok(
    admin.auth.admin.generateLink({ type: "recovery", email }),
  );
  await send("Page.navigate", {
    url: `${origin}/auth/callback?type=recovery&token_hash=${encodeURIComponent(recovery.properties.hashed_token)}`,
  });
  await wait(
    "location.pathname==='/reset-password' && document.querySelectorAll('input[type=password]').length===2",
  );
  const changed = `Changed!${randomUUID()}`;
  await evalJS(
    `(()=>{for(const el of document.querySelectorAll('input[type=password]')){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(changed)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('form').requestSubmit()})()`,
  );
  await wait("document.body.innerText.includes('Password updated')");
  assert(
    (await anon.auth.signInWithPassword({ email, password })).error,
    "Old password still accepted",
  );
  assert(
    (await ok(anon.auth.signInWithPassword({ email, password: changed })))
      .session,
  );
  console.log(
    "PASS recovery callback, password-reset form, old-password rejection, new-password login",
  );
  await send("Page.navigate", { url: `${origin}/dashboard` });
  await wait("location.pathname==='/login'");
  console.log("PASS sign-out and protected-route redirect");
  const confirmation = await ok(
    admin.auth.admin.generateLink({
      type: "signup",
      email: `confirm-${email}`,
      password,
      options: {
        data: {
          username: `confirm-${tag}`,
          full_name: "Confirmation verification",
          terms_accepted: true,
        },
      },
    }),
  );
  confirmationUser = confirmation.user;
  await send("Page.navigate", {
    url: `${origin}/auth/callback?type=signup&token_hash=${encodeURIComponent(confirmation.properties.hashed_token)}`,
  });
  await wait("location.pathname==='/onboarding'");
  assert(
    (await ok(admin.auth.admin.getUserById(confirmationUser.id))).user
      .email_confirmed_at,
  );
  console.log(
    "PASS email confirmation token creates a session and opens onboarding",
  );
  await send("Page.navigate", {
    url: `${origin}/auth/callback?type=signup&token_hash=${encodeURIComponent(confirmation.properties.hashed_token)}`,
  });
  await wait("document.body.innerText.includes('Unable to continue')");
  console.log(
    "PASS reused confirmation token is rejected even with an existing session",
  );
  await evalJS(
    "localStorage.removeItem('sb-ghjdpcvnzclfvyosfhoz-auth-token-code-verifier')",
  );
  await send("Page.navigate", {
    url: `${origin}/auth/callback?code=invalid-test-code`,
  });
  await wait(
    "document.body.innerText.includes('This sign-in link could not be verified')",
  );
  console.log(
    "PASS OAuth callback without its PKCE verifier cannot reuse an older session",
  );
  await anon.auth.signOut();
} finally {
  if (!user)
    user = (await ok(admin.auth.admin.listUsers({ perPage: 1000 }))).users.find(
      (u) => u.email === email,
    );
  if (user) await admin.auth.admin.deleteUser(user.id);
  if (confirmationUser) await admin.auth.admin.deleteUser(confirmationUser.id);
  await send("Target.disposeBrowserContext", { browserContextId }).catch(
    () => {},
  );
  ws.close();
  console.log("Removed temporary Auth-link account.");
}
