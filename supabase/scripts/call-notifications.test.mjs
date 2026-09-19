import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source = readFileSync(
  "CoLearner/public/call-notifications-sw.js",
  "utf8",
);
function worker() {
  const handlers = {},
    posted = [],
    focused = [],
    opened = [];
  const clients = [
    {
      id: "other",
      url: "https://colearn.example/messages",
      focus: async () => focused.push("other"),
      postMessage: (m) => posted.push(m),
    },
    {
      id: "owner",
      url: "https://colearn.example/library",
      focus: async () => focused.push("owner"),
      postMessage: (m) => posted.push(m),
    },
  ];
  const self = {
    location: { origin: "https://colearn.example" },
    addEventListener: (name, fn) => (handlers[name] = fn),
    clients: {
      matchAll: async () => clients,
      openWindow: async (url) => opened.push(url),
    },
  };
  runInNewContext(source, { self, URL, Date });
  return { handlers, posted, focused, opened, clients };
}
test("Notification action focuses the owning tab and forwards the exact user/call identity", async () => {
  const w = worker();
  let task,
    closed = false;
  const data = {
    callId: "call-one",
    user: "alice",
    tabId: "alice-tab",
    clientId: "owner",
    expiresAt: Date.now() + 45000,
  };
  w.handlers.notificationclick({
    action: "answer",
    notification: { data, close: () => (closed = true) },
    waitUntil: (p) => (task = p),
  });
  await task;
  assert(closed);
  assert.deepEqual(w.focused, ["owner"]);
  assert.equal(w.opened.length, 0);
  assert(
    w.posted.every(
      (m) =>
        m.action === "answer" &&
        m.user === "alice" &&
        m.callId === "call-one" &&
        m.tabId === "alice-tab",
    ),
  );
});
test("Expired notification cannot answer, reopen or focus a stale call", () => {
  const w = worker();
  let waited = false,
    closed = false;
  w.handlers.notificationclick({
    action: "answer",
    notification: {
      data: { callId: "old", expiresAt: Date.now() - 1 },
      close: () => (closed = true),
    },
    waitUntil: () => (waited = true),
  });
  assert(closed);
  assert(!waited);
  assert.equal(w.posted.length, 0);
});
test("Decline is forwarded; clicking after all windows closed opens the messages page", async () => {
  const w = worker();
  let task;
  const notification = {
    data: { callId: "active", expiresAt: Date.now() + 45000 },
    close: () => {},
  };
  w.handlers.notificationclick({
    action: "decline",
    notification,
    waitUntil: (p) => (task = p),
  });
  await task;
  assert(w.posted.every((m) => m.action === "decline"));
  w.clients.splice(0);
  w.handlers.notificationclick({
    action: "",
    notification,
    waitUntil: (p) => (task = p),
  });
  await task;
  assert.deepEqual(w.opened, ["/messages"]);
});
