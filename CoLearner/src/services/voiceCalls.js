import { supabase, result, mediaUrl } from './supabase/client'

const terminal = new Set(['ended', 'declined', 'unavailable', 'failed'])
const labels = {
  ended: 'Call ended',
  declined: 'Call declined',
  unavailable: 'User unavailable',
  failed: 'Connection failed',
}
export function microphoneError(error) {
  if (['NotAllowedError', 'SecurityError'].includes(error.name))
    return 'Microphone permission denied. Allow microphone access in your browser and try again.'
  if (['NotFoundError', 'DevicesNotFoundError'].includes(error.name))
    return 'No microphone found. Connect a microphone and try again.'
  if (['NotReadableError', 'TrackStartError'].includes(error.name))
    return 'Your microphone is busy or unavailable. Check other apps and try again.'
  return error.message || 'Connection failed. Please try again.'
}

// One controller per signed-in app. Device IDs are per page, not shared localStorage.
// The database arbitrates ownership across tabs, devices and simultaneous callers.
export class VoiceCalls {
  constructor(me, update) {
    this.me = me
    this.update = update
    this.device = crypto.randomUUID()
    this.current = null
    this.disposed = false
    this.audio = document.createElement('audio')
    this.audio.autoplay = true
    this.audio.playsInline = true
    this.state = {
      phase: 'idle',
      muted: false,
      audioBlocked: false,
      person: null,
      connectedAt: null,
    }
    this.leave = () => this.leavePage()
    this.offline = () =>
      this.finish('Connection failed. Check your internet connection.', 'fail')
  }

  emit(patch) {
    this.state = { ...this.state, ...patch }
    if (!this.disposed) this.update(this.state)
  }

  async start() {
    const { data } = await supabase.auth.getSession()
    if (this.disposed) return
    this.token = data.session?.access_token
    this.authSubscription = supabase.auth.onAuthStateChange(
      (_event, session) => {
        this.token = session?.access_token
      },
    ).data.subscription
    this.inbox = supabase
      .channel(`voice-inbox:${this.me}:${this.device}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_calls',
          filter: `caller_id=eq.${this.me}`,
        },
        () => void this.sync(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_calls',
          filter: `receiver_id=eq.${this.me}`,
        },
        () => void this.sync(),
      )
      .subscribe(() => void this.sync())
    this.poll = setInterval(() => void this.sync(), 5000)
    window.addEventListener('pagehide', this.leave)
    window.addEventListener('offline', this.offline)
    await this.sync()
  }

  async sync() {
    if (this.disposed || this.syncing) return
    this.syncing = true
    const active = this.current
    try {
      if (active?.id) {
        const row = await result(
          supabase
            .from('voice_calls')
            .select('*')
            .eq('id', active.id)
            .maybeSingle(),
        )
        if (this.current !== active) return
        if (!row) return this.finish('Call ended')
        if (terminal.has(row.status)) return this.finish(labels[row.status])
        const device =
          this.me === row.caller_id ? row.caller_device : row.receiver_device
        if (device && device !== this.device)
          return this.finish('Call handled on another tab or device')
        if (
          Date.now() - Date.parse(row.caller_seen_at) > 45000 ||
          (row.status === 'ringing' &&
            Date.now() - Date.parse(row.created_at) > 45000) ||
          (row.status === 'accepted' &&
            Date.now() - Date.parse(row.receiver_seen_at) > 45000)
        )
          return this.finish('User unavailable', 'end')
        if (row.status === 'accepted' && this.state.phase === 'ringing') {
          this.emit({ phase: 'connecting' })
          this.connectionTimeout(active)
        }
      } else if (!active) {
        const rows = await result(
          supabase
            .from('voice_calls')
            .select('*')
            .eq('receiver_id', this.me)
            .eq('status', 'ringing')
            .gt('created_at', new Date(Date.now() - 45000).toISOString())
            .order('created_at', { ascending: false })
            .limit(1),
        )
        if (!rows.length || this.current || this.disposed) return
        const row = rows[0]
        const profile = await result(
          supabase
            .from('profiles')
            .select('id,full_name,username,avatar')
            .eq('id', row.caller_id)
            .single(),
        )
        profile.avatar = await mediaUrl('avatars', profile.avatar)
        if (this.current || this.disposed) return
        this.current = {
          id: row.id,
          peer: row.caller_id,
          incoming: true,
          timers: [],
          channels: [],
        }
        this.emit({
          phase: 'incoming',
          person: profile,
          message: '',
          muted: false,
          connectedAt: null,
          audioBlocked: false,
        })
      }
    } catch {
      // Transient fetch failures retry; a live call also has a bounded heartbeat lease.
    } finally {
      this.syncing = false
    }
  }

  async microphone(call) {
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.RTCPeerConnection
    )
      throw new Error(
        'Voice calls require a supported browser on HTTPS or localhost.',
      )
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    if (this.current !== call || this.disposed) {
      stream.getTracks().forEach((track) => track.stop())
      return false
    }
    call.stream = stream
    stream.getAudioTracks().forEach((track) => {
      track.onended = () => this.finish('Microphone disconnected.', 'fail')
    })
    return true
  }

  async call(person) {
    if (this.current || this.disposed) return
    const call = { peer: person.id, timers: [], channels: [] }
    this.current = call
    this.emit({
      phase: 'calling',
      person,
      message: '',
      muted: false,
      connectedAt: null,
      audioBlocked: false,
    })
    try {
      if (!(await this.microphone(call))) return
      const row = await result(
        supabase.rpc('colearn_start_call', {
          peer: person.id,
          device_id: this.device,
        }),
      )
      call.id = row.id
      if (this.current !== call) {
        void this.action(call, 'end').catch(() => {})
        return
      }
      this.heartbeat(call)
      await this.connect(call)
      if (this.current !== call) return
      await call.pc.setLocalDescription(await call.pc.createOffer())
      if (this.current !== call) return
      this.emit({ phase: 'ringing' })
      this.repeat(
        call,
        () => {
          if (!call.pc.remoteDescription)
            void this.signal(call, {
              kind: 'offer',
              description: call.pc.localDescription.toJSON(),
            })
        },
        2000,
      )
      call.timers.push(
        setTimeout(() => {
          if (this.current === call && !call.pc.remoteDescription)
            this.finish('User unavailable', 'end')
        }, 45000),
      )
    } catch (error) {
      if (this.current === call) this.finish(microphoneError(error), 'fail')
    }
  }

  async accept() {
    const call = this.current
    if (!call || this.state.phase !== 'incoming') return
    this.emit({ phase: 'connecting' })
    // Unlock the output element during the user's Accept gesture where supported.
    void this.audio.play().catch(() => {})
    try {
      if (!(await this.microphone(call))) return
      const row = await this.action(call, 'accept')
      call.accepted =
        row.status === 'accepted' && row.receiver_device === this.device
      if (this.current !== call) {
        if (row.receiver_device === this.device)
          void this.action(call, 'end').catch(() => {})
        return
      }
      if (row.status !== 'accepted')
        return this.finish(labels[row.status] || 'Call ended')
      this.heartbeat(call)
      await this.connect(call)
      if (this.current !== call) return
      this.connectionTimeout(call)
      this.repeat(
        call,
        () => {
          if (!call.pc.remoteDescription)
            void this.signal(call, { kind: 'ready' })
        },
        2000,
      )
    } catch (error) {
      if (this.current === call)
        this.finish(microphoneError(error), call.accepted ? 'fail' : 'decline')
    }
  }

  action(call, operation) {
    return result(
      supabase.rpc('colearn_call_action', {
        call_id: call.id,
        operation,
        device_id: this.device,
      }),
    )
  }

  repeat(call, fn, ms) {
    fn()
    call.timers.push(setInterval(fn, ms))
  }

  heartbeat(call) {
    let lastSuccess = Date.now()
    let pending = false
    this.repeat(
      call,
      async () => {
        if (this.current !== call) return
        if (Date.now() - lastSuccess > 35000)
          return this.finish('Connection failed. Please try again.', 'fail')
        if (pending) return
        pending = true
        try {
          const row = await this.action(call, 'heartbeat')
          lastSuccess = Date.now()
          if (this.current === call && terminal.has(row.status))
            this.finish(labels[row.status])
        } catch (error) {
          if (this.current === call && error.code === '42501')
            this.finish(error.message)
        } finally {
          pending = false
        }
      },
      10000,
    )
  }

  connectionTimeout(call) {
    if (call.connectTimer) return
    call.connectTimer = setTimeout(() => {
      if (this.current === call && call.pc?.connectionState !== 'connected')
        this.finish(
          'Connection failed. Try another network; this network may need a relay server.',
          'fail',
        )
    }, 35000)
    call.timers.push(call.connectTimer)
  }

  async connect(call) {
    const pc = new window.RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
          ],
        },
      ],
    })
    call.pc = pc
    call.candidates = []
    call.serial = Promise.resolve()
    call.stream.getTracks().forEach((track) => pc.addTrack(track, call.stream))
    pc.onicecandidate = ({ candidate }) => {
      if (candidate)
        void this.signal(call, { kind: 'ice', candidate: candidate.toJSON() })
    }
    pc.ontrack = ({ streams }) => {
      if (this.current !== call) return
      this.audio.srcObject = streams[0]
      void this.playAudio()
    }
    pc.onconnectionstatechange = () => {
      if (this.current !== call) return
      if (pc.connectionState === 'connected') {
        clearTimeout(call.disconnectTimer)
        this.emit({
          phase: 'connected',
          connectedAt: this.state.connectedAt || Date.now(),
        })
      } else if (pc.connectionState === 'failed')
        this.finish(
          'Connection failed. Try another network; this network may need a relay server.',
          'fail',
        )
      else if (pc.connectionState === 'disconnected') {
        this.emit({ phase: 'reconnecting' })
        clearTimeout(call.disconnectTimer)
        call.disconnectTimer = setTimeout(
          () =>
            this.current === call &&
            this.finish(
              'Connection failed. Your connection was interrupted.',
              'fail',
            ),
          12000,
        )
        call.timers.push(call.disconnectTimer)
      }
    }
    await supabase.realtime.setAuth()
    if (this.current !== call) return
    await Promise.all(
      [this.me, call.peer].map(
        (sender) =>
          new Promise((resolve, reject) => {
            const channel = supabase.channel(`voice:${call.id}:${sender}`, {
              config: { private: true, broadcast: { ack: true } },
            })
            call.channels.push(channel)
            if (sender === this.me) call.out = channel
            else
              channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
                // Sequential processing handles offer/candidate races and duplicate deliveries.
                call.serial = call.serial
                  .then(() => this.receive(call, payload))
                  .catch(() => {
                    if (this.current === call)
                      this.finish(
                        'Connection failed. Please try again.',
                        'fail',
                      )
                  })
              })
            const timeout = setTimeout(
              () =>
                reject(new Error('Calling is unavailable. Please try again.')),
              12000,
            )
            call.timers.push(timeout)
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                clearTimeout(timeout)
                resolve()
              } else if (
                ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)
              ) {
                clearTimeout(timeout)
                reject(new Error('Calling is unavailable. Please try again.'))
                if (this.current === call)
                  this.finish(
                    'Connection failed. Signaling disconnected.',
                    'fail',
                  )
              }
            })
          }),
      ),
    )
  }

  async signal(call, payload) {
    if (this.current !== call || !call.out || call.out.state !== 'joined')
      return
    // Repeated offers/answers include gathered candidates; no SDP/ICE persistence.
    try {
      await call.out.send({ type: 'broadcast', event: 'signal', payload })
    } catch {
      /* heartbeat bounds disconnects */
    }
  }

  async receive(call, message) {
    if (this.current !== call || !message || !call.pc) return
    const pc = call.pc
    if (message.kind === 'ready' && !call.incoming && pc.localDescription) {
      await this.signal(call, {
        kind: 'offer',
        description: pc.localDescription.toJSON(),
      })
    } else if (
      message.kind === 'offer' &&
      call.incoming &&
      message.description?.type === 'offer'
    ) {
      if (!pc.remoteDescription) {
        await pc.setRemoteDescription(message.description)
        for (const candidate of call.candidates.splice(0))
          await pc.addIceCandidate(candidate)
        await pc.setLocalDescription(await pc.createAnswer())
      }
      await this.signal(call, {
        kind: 'answer',
        description: pc.localDescription.toJSON(),
      })
    } else if (
      message.kind === 'answer' &&
      !call.incoming &&
      message.description?.type === 'answer' &&
      !pc.remoteDescription
    ) {
      await pc.setRemoteDescription(message.description)
      for (const candidate of call.candidates.splice(0))
        await pc.addIceCandidate(candidate)
      if (this.current !== call) return
      if (pc.connectionState !== 'connected') this.emit({ phase: 'connecting' })
      this.connectionTimeout(call)
    } else if (message.kind === 'ice' && message.candidate) {
      if (pc.remoteDescription) await pc.addIceCandidate(message.candidate)
      else if (call.candidates.length < 100)
        call.candidates.push(message.candidate)
    } else if (message.kind === 'end') {
      // End is best effort for speed; authoritative status also arrives through DB Realtime.
      this.finish('Call ended')
    }
  }

  async playAudio() {
    try {
      await this.audio.play()
      this.emit({ audioBlocked: false })
    } catch {
      if (this.current) this.emit({ audioBlocked: true })
    }
  }

  mute() {
    const muted = !this.state.muted
    this.current?.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
    this.emit({ muted })
  }

  finish(message = 'Call ended', operation) {
    const call = this.current
    if (call) {
      if (operation && call.incoming && !call.accepted) operation = 'decline'
      if (operation && call.id) {
        void this.action(call, operation).catch(() => {})
        if (operation !== 'decline') void this.signal(call, { kind: 'end' })
      }
      this.current = null
      call.timers.forEach((timer) => clearTimeout(timer))
      if (call.pc) {
        call.pc.ontrack =
          call.pc.onicecandidate =
          call.pc.onconnectionstatechange =
            null
        call.pc.close()
      }
      call.stream?.getTracks().forEach((track) => {
        track.onended = null
        track.stop()
      })
      call.channels.forEach((channel) => void supabase.removeChannel(channel))
    }
    this.audio.pause()
    this.audio.srcObject = null
    this.emit({
      phase: 'finished',
      message,
      connectedAt: null,
      muted: false,
      audioBlocked: false,
    })
  }

  leavePage() {
    const call = this.current
    if (call?.id && this.token) {
      // Keepalive survives ordinary refresh/navigation; expired leases cover crashes/offline.
      const operation = call.incoming && !call.accepted ? 'decline' : 'end'
      void fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/colearn_call_action`,
        {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            call_id: call.id,
            operation,
            device_id: this.device,
          }),
        },
      ).catch(() => {})
    }
    this.finish('Call ended')
  }

  dispose() {
    this.leavePage()
    this.disposed = true
    clearInterval(this.poll)
    this.authSubscription?.unsubscribe()
    if (this.inbox) void supabase.removeChannel(this.inbox)
    window.removeEventListener('pagehide', this.leave)
    window.removeEventListener('offline', this.offline)
  }
}
