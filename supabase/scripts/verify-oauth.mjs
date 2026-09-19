// Tests live provider handoffs; stops before credentials/consent, which need a real user.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const origin = "http://127.0.0.1:5176";
const ref = "ghjdpcvnzclfvyosfhoz";
const tabs = await (await fetch("http://127.0.0.1:9223/json")).json();
const ws = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
);
await new Promise((resolve) =>
  ws.addEventListener("open", resolve, { once: true }),
);
let id = 0;
const pending = new Map(),
  handoffs = [],
  exceptions = [];
ws.addEventListener("message", ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
  } else if (m.method === "Network.requestWillBeSent") {
    const u = new URL(m.params.request.url);
    if (
      u.hostname === "accounts.google.com" ||
      (u.hostname === "github.com" && u.pathname === "/login/oauth/authorize")
    )
      handoffs.push(u);
  } else if (m.method === "Runtime.exceptionThrown")
    exceptions.push(m.params.exceptionDetails.text);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};
const wait = async (predicate) => {
  for (let n = 0; n < 60; n++) {
    try {
      if (await evaluate(predicate)) return;
    } catch {
      /* navigation */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Browser did not reach expected state: " + predicate);
};
const report = {
  checkedAt: new Date().toISOString(),
  providers: {},
  endToEndConsent: "Requires interactive sign-in by the account owner",
};
try {
  await send("Page.enable");
  await send("Network.enable");
  await send("Runtime.enable");
  for (const [provider, label, host, clientId] of [
    [
      "google",
      "Google",
      "accounts.google.com",
      "958293032322-gl9246onnlgchck7jrrlgdgt7b5p3l5b.apps.googleusercontent.com",
    ],
    ["github", "GitHub", "github.com", "Ov23li0oBOl9CTu7KNzR"],
  ]) {
    await send("Page.navigate", { url: `${origin}/login` });
    await wait(
      "!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Google')",
    );
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`,
    );
    await wait(`location.hostname===${JSON.stringify(host)}`);
    const target = handoffs.find(
      (u) => u.hostname === host && u.searchParams.has("client_id"),
    );
    assert(target, `${provider} authorization handoff was not observed`);
    assert.equal(target.searchParams.get("client_id"), clientId);
    assert.equal(
      target.searchParams.get("redirect_uri"),
      `https://${ref}.supabase.co/auth/v1/callback`,
    );
    assert(target.searchParams.get("state"), "OAuth state is missing");
    await wait("document.readyState==='complete'");
    const page = await evaluate(
      "({title:document.title,body:document.body.innerText})",
    );
    const providerError = page.body.match(
      /redirect_uri_mismatch|invalid_client|OAuth application not found|The redirect_uri is not associated/i,
    )?.[0];
    report.providers[provider] = {
      handoff: "passed",
      callback: "passed",
      pageTitle: page.title,
      providerError: providerError || null,
    };
    console.log(
      `${providerError ? "BLOCKED" : "PASS"} ${label}: ${providerError || "button reaches provider with correct client, callback and OAuth state"}`,
    );
  }
  await send("Page.navigate", {
    url: `${origin}/auth/callback?error=access_denied&error_description=Sign-in%20was%20cancelled`,
  });
  await wait("document.body.innerText.includes('Unable to continue')");
  assert(
    await evaluate(
      "document.body.innerText.includes('Sign-in was cancelled') && !!document.querySelector('a[href=\"/login\"]')",
    ),
  );
  console.log("PASS cancelled OAuth shows an actionable error");
  await send("Page.navigate", { url: `${origin}/signup` });
  await wait("!!document.querySelector('input[name=terms]')");
  assert(
    await evaluate(
      "Array.from(document.querySelectorAll('button')).filter(b=>['Google','GitHub'].includes(b.textContent.trim())).every(b=>b.disabled)",
    ),
  );
  await evaluate("document.querySelector('input[name=terms]').click()");
  await wait(
    "Array.from(document.querySelectorAll('button')).filter(b=>['Google','GitHub'].includes(b.textContent.trim())).every(b=>!b.disabled)",
  );
  assert.equal(exceptions.length, 0, "Unexpected browser exceptions");
  console.log(
    "PASS signup policy acceptance enables OAuth; no browser exceptions",
  );
  writeFileSync(
    ".dist/oauth-verification.json",
    JSON.stringify(report, null, 2),
  );
  if (Object.values(report.providers).some((p) => p.providerError))
    process.exitCode = 1;
} finally {
  ws.close();
}
