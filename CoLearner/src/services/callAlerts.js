let registration
async function callWorker() {
  if (!('serviceWorker' in navigator)) return null
  registration ||= navigator.serviceWorker
    .register('/call-notifications-sw.js')
    .catch(() => {
      registration = null
      return null
    })
  const worker = await registration
  if (worker && !worker.active) await navigator.serviceWorker.ready
  return worker
}

export async function enableCallNotifications() {
  if (!('Notification' in window) || !window.isSecureContext)
    return 'Browser call alerts need a supported browser and HTTPS.'
  const permission = await window.Notification.requestPermission()
  if (permission !== 'granted')
    return 'Allow notifications in your browser site settings. In-app calls still work.'
  return (await callWorker())
    ? 'Browser call alerts are enabled while CoLearn is open.'
    : 'This browser supports in-app call alerts only.'
}

// An open tab receives calls through Realtime. This is deliberately not a push
// service: a closed/frozen browser cannot be promised incoming call delivery.
export class CallAlerts {
  constructor(user, action, blocked, soundEnabled = () => true) {
    this.user = user
    this.action = action
    this.blocked = blocked
    this.soundEnabled = soundEnabled
    this.nodes = new Set()
    this.device = crypto.randomUUID()
    this.unlock = () => {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext
        if (!Audio) return
        this.context ||= new Audio()
        void this.context
          .resume()
          .then(() => {
            if (this.incoming && this.owner) this.ring()
          })
          .catch(() => {
            if (this.incoming) this.blocked(true)
          })
      } catch {
        if (this.incoming) this.blocked(true)
      }
    }
    this.visibility = () => {
      if (this.incoming && this.owner) void this.notify(this.incoming)
    }
    this.message = ({ data }) => {
      if (
        data?.type !== 'colearn-call-action' ||
        data.user !== this.user ||
        data.tabId !== this.device ||
        data.callId !== this.incoming?.id
      )
        return
      if (Date.now() >= this.incoming.expiresAt) return this.stop()
      if (data.action === 'answer' || data.action === 'decline')
        this.action(data.action, data.callId)
    }
    document.addEventListener('pointerdown', this.unlock)
    document.addEventListener('keydown', this.unlock)
    document.addEventListener('visibilitychange', this.visibility)
    window.addEventListener('blur', this.visibility)
    navigator.serviceWorker?.addEventListener('message', this.message)
    if (window.Notification?.permission === 'granted') void callWorker()
  }
  sync(call) {
    if (call.phase !== 'incoming' || !call.id) return this.stop()
    if (this.incoming?.id === call.id) return
    this.stop()
    const incoming = { ...call }
    this.incoming = incoming
    this.title = document.title
    document.title = 'Incoming call · CoLearn'
    this.expiry = setTimeout(
      () => this.stop(),
      Math.max(0, call.expiresAt - Date.now()),
    )
    const own = () => {
      if (this.incoming !== incoming) return
      this.owner = true
      this.ring()
      void this.notify(incoming)
      this.loop = setInterval(() => this.ring(), 3000)
    }
    if (navigator.locks) {
      void navigator.locks
        .request(
          `colearn-call:${this.user}:${call.id}`,
          { ifAvailable: true },
          async (lock) => {
            if (!lock || this.incoming !== incoming) return
            await new Promise((resolve) => {
              this.release = resolve
              own()
            })
          },
        )
        .catch(() => {})
    } else {
      // Legacy browsers use a short lease and confirm ownership before sounding.
      this.leaseKey = `colearn:ring:${this.user}:${call.id}`
      const lease = () => {
        if (this.incoming !== incoming) return
        try {
          const stored = JSON.parse(
            localStorage.getItem(this.leaseKey) || 'null',
          )
          if (
            stored &&
            stored.until > Date.now() &&
            stored.owner !== this.device
          )
            return
          localStorage.setItem(
            this.leaseKey,
            JSON.stringify({ owner: this.device, until: Date.now() + 4500 }),
          )
          this.claim = setTimeout(() => {
            if (
              this.incoming === incoming &&
              JSON.parse(localStorage.getItem(this.leaseKey) || 'null')
                ?.owner === this.device &&
              !this.owner
            )
              own()
          }, 70)
        } catch {
          /* Storage disabled: preserve visual alerts without duplicate sound. */
        }
      }
      lease()
      this.lease = setInterval(lease, 2000)
    }
  }
  ring() {
    if (!this.incoming || !this.owner || !this.soundEnabled()) return
    if (this.context?.state !== 'running') return this.blocked(true)
    if (this.nodes.size) return
    this.blocked(false)
    const context = this.context
    for (const delay of [0, 0.45]) {
      const tone = context.createOscillator(),
        gain = context.createGain(),
        start = context.currentTime + delay
      tone.type = 'sine'
      tone.frequency.setValueAtTime(660, start)
      tone.frequency.setValueAtTime(880, start + 0.12)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.08, start + 0.025)
      gain.gain.setValueAtTime(0.08, start + 0.2)
      gain.gain.linearRampToValueAtTime(0, start + 0.28)
      tone.connect(gain)
      gain.connect(context.destination)
      const node = { tone, gain }
      this.nodes.add(node)
      tone.onended = () => {
        tone.disconnect()
        gain.disconnect()
        this.nodes.delete(node)
      }
      tone.start(start)
      tone.stop(start + 0.3)
    }
  }
  async notify(incoming) {
    if (
      incoming.notified ||
      incoming.notifying ||
      (!document.hidden && document.hasFocus()) ||
      window.Notification?.permission !== 'granted'
    )
      return
    incoming.notifying = true
    try {
      const worker = await callWorker()
      if (!worker || this.incoming !== incoming || !this.owner) return
      const tag = `colearn-call:${this.user}:${incoming.id}`
      const clientId = await new Promise((resolve) => {
        const channel = new window.MessageChannel()
        const timer = setTimeout(() => {
          channel.port1.close()
          resolve(null)
        }, 1500)
        channel.port1.onmessage = (event) => {
          clearTimeout(timer)
          channel.port1.close()
          resolve(event.data)
        }
        worker.active?.postMessage({ type: 'colearn-call-client' }, [
          channel.port2,
        ])
      })
      if (this.incoming !== incoming) return
      await worker.showNotification(`Incoming voice call · ${incoming.name}`, {
        body: 'Answer or decline this CoLearn call.',
        tag,
        renotify: false,
        silent: true,
        requireInteraction: true,
        icon: '/favicon-32.png',
        actions: [
          { action: 'answer', title: 'Answer' },
          { action: 'decline', title: 'Decline' },
        ],
        data: {
          callId: incoming.id,
          user: this.user,
          expiresAt: incoming.expiresAt,
          tabId: this.device,
          clientId,
        },
      })
      incoming.notified = true
      // A decline may have arrived while the browser was creating the alert.
      if (this.incoming !== incoming)
        for (const n of await worker.getNotifications({ tag })) n.close()
    } catch {
      /* The in-app dialog/title and ringtone remain available. */
    } finally {
      incoming.notifying = false
    }
  }
  stop() {
    const incoming = this.incoming
    this.incoming = null
    this.owner = false
    clearInterval(this.loop)
    clearInterval(this.lease)
    clearTimeout(this.expiry)
    clearTimeout(this.claim)
    for (const { tone, gain } of this.nodes) {
      try {
        tone.stop()
      } catch {
        /* Already ended. */
      }
      tone.disconnect()
      gain.disconnect()
    }
    this.nodes.clear()
    this.release?.()
    this.release = null
    if (incoming) {
      if (document.title === 'Incoming call · CoLearn')
        document.title = this.title
      if (registration)
        void Promise.resolve(registration)
          .then(async (worker) => {
            if (worker)
              for (const n of await worker.getNotifications({
                tag: `colearn-call:${this.user}:${incoming.id}`,
              }))
                n.close()
          })
          .catch(() => {})
      try {
        if (
          this.leaseKey &&
          JSON.parse(localStorage.getItem(this.leaseKey) || 'null')?.owner ===
            this.device
        )
          localStorage.removeItem(this.leaseKey)
      } catch {
        /* Unavailable storage. */
      }
    }
  }
  dispose() {
    this.stop()
    document.removeEventListener('pointerdown', this.unlock)
    document.removeEventListener('keydown', this.unlock)
    document.removeEventListener('visibilitychange', this.visibility)
    window.removeEventListener('blur', this.visibility)
    navigator.serviceWorker?.removeEventListener('message', this.message)
    void this.context?.close().catch(() => {})
  }
}
