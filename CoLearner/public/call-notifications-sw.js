// Call notifications only. No fetch handler, offline cache or stored credentials.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'colearn-call-client')
    event.ports[0]?.postMessage(event.source.id)
})
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data
  event.notification.close()
  if (!data?.callId || Date.now() >= data.expiresAt) return
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const client =
        windows.find((window) => window.id === data.clientId) ||
        windows.find(
          (window) => new URL(window.url).origin === self.location.origin,
        )
      if (client) {
        await client.focus()
        // Every open tab validates the current user and call before acting.
        for (const window of windows)
          window.postMessage({
            type: 'colearn-call-action',
            ...data,
            action: event.action,
          })
      } else await self.clients.openWindow('/messages')
    })(),
  )
})
