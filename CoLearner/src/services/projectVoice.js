import { supabase, result } from './supabase/client'
import { microphoneError } from './voiceCalls'
import { CallAudio } from './callAudio'
import { voiceIce } from './voiceIce'

// Small-group audio mesh. Signaling is addressed and stored behind membership
// RLS, so reconnection can replay signals and removal immediately revokes access.
export class ProjectVoice {
  constructor(project, me, update) {
    this.project = Number(project)
    this.me = me
    this.update = update
    this.device = crypto.randomUUID()
    this.peers = new Map()
    this.state = {
      phase: 'idle',
      members: [],
      muted: false,
      error: '',
      audioBlocked: false,
    }
    this.output = new CallAudio((blocked) => {
      if (this.session || this.joinAttempt) this.emit({ audioBlocked: blocked })
    })
    this.onLeave = () => this.leavePage()
    this.onOffline = () =>
      void this.fail(
        'You are offline. Rejoin the call when your connection returns.',
      )
    this.onVisible = () => void this.sync()
  }
  emit(patch) {
    this.state = { ...this.state, ...patch }
    if (!this.disposed) this.update(this.state)
  }
  async start() {
    this.token = (await supabase.auth.getSession()).data.session?.access_token
    if (this.disposed) return
    this.authSubscription = supabase.auth.onAuthStateChange(
      (_event, session) => {
        this.token = session?.access_token
      },
    ).data.subscription
    this.channel = supabase.channel(
      `project-voice:${this.project}:${this.device}`,
    )
    for (const table of [
      'project_voice_members',
      'project_voice_signals',
      'project_members',
    ])
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `project_id=eq.${this.project}`,
        },
        () => void this.sync(),
      )
    this.channel.subscribe(() => void this.sync())
    this.poll = setInterval(() => void this.sync(), 1500)
    this.heartbeat = setInterval(() => void this.keepAlive(), 8000)
    this.meter = setInterval(() => {
      this.checkHealth()
      if (this.session)
        this.emit({
          levels: Object.fromEntries(
            [...this.peers.keys()].map((id) => [id, this.output.level(id)]),
          ),
        })
    }, 250)
    window.addEventListener('pagehide', this.onLeave)
    window.addEventListener('offline', this.onOffline)
    window.addEventListener('focus', this.onVisible)
    await this.sync()
  }
  action(operation, session = this.session) {
    return result(
      supabase.rpc('colearn_project_voice', {
        project: this.project,
        operation,
        device: this.device,
        session,
      }),
    )
  }
  checkHealth() {
    if (!this.session) return
    if (
      Date.now() - this.lastHeartbeat > 35000 ||
      [...this.peers.values()].some(
        (peer) => peer.deadline && Date.now() > peer.deadline,
      )
    ) {
      void this.fail(
        'Audio could not connect. Rejoin or try another network. Text chat is still available.',
      )
    }
  }
  async keepAlive() {
    if (!this.session || this.heartbeating) return
    const session = this.session
    this.heartbeating = true
    try {
      await this.action('heartbeat', session)
      if (session === this.session) this.lastHeartbeat = Date.now()
      if (session === this.session) await this.refreshIce(session)
    } catch (e) {
      if (
        session === this.session &&
        (e.code === '42501' || Date.now() - this.lastHeartbeat > 35000)
      )
        await this.fail('Your call connection ended. Please rejoin.')
    } finally {
      this.heartbeating = false
    }
  }
  async join() {
    if (this.session || this.state.phase === 'joining' || this.disposed) return
    const attempt = {}
    this.joinAttempt = attempt
    void this.output.unlock()
    this.emit({ phase: 'joining', error: '', muted: false })
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection)
        throw new Error(
          'Voice calls need microphone access on HTTPS or localhost.',
        )
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      })
      if (this.disposed || this.joinAttempt !== attempt) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      this.stream = stream
      stream.getAudioTracks().forEach((track) => {
        track.onended = () =>
          void this.fail(
            'Microphone disconnected. Reconnect it and rejoin the call.',
          )
      })
      this.configuration = await voiceIce({ projectId: this.project })
      if (this.disposed || this.joinAttempt !== attempt) return
      const session = crypto.randomUUID()
      await this.action('join', session)
      if (this.disposed || this.joinAttempt !== attempt) {
        void this.action('leave', session)
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      this.session = session
      this.processed = new Set()
      this.lastHeartbeat = Date.now()
      this.joinAttempt = null
      this.emit({ phase: 'joined' })
      await this.sync()
    } catch (e) {
      if (this.joinAttempt === attempt) await this.fail(microphoneError(e))
    }
  }
  async refreshIce(session) {
    if (
      !this.configuration?.relayAvailable ||
      Date.now() < this.configuration.expiresAt - 120000
    )
      return
    try {
      const configuration = await voiceIce({ projectId: this.project })
      if (this.session !== session) return
      this.configuration = configuration
      for (const peer of this.peers.values()) {
        peer.pc.setConfiguration({ iceServers: configuration.iceServers })
        if (this.me < peer.member.user_id) await this.offer(peer, true)
      }
    } catch {
      if (
        this.session === session &&
        Date.now() >= this.configuration.expiresAt
      )
        await this.fail(
          'The audio relay could not renew this call. Please rejoin.',
        )
    }
  }
  queue(peer, payload) {
    if (
      !this.session ||
      this.disposed ||
      this.peers.get(peer.member.user_id) !== peer
    )
      return
    const key = JSON.stringify(payload)
    if (!peer.outbox.some((item) => item.key === key))
      peer.outbox.push({ key, payload })
    void this.flush(peer)
  }
  async flush(peer) {
    if (peer.sending) return
    peer.sending = true
    try {
      while (
        peer.outbox.length &&
        this.session &&
        this.peers.get(peer.member.user_id) === peer
      ) {
        await result(
          supabase.from('project_voice_signals').insert({
            project_id: this.project,
            sender_id: this.me,
            recipient_id: peer.member.user_id,
            from_session: this.session,
            to_session: peer.session,
            payload: peer.outbox[0].payload,
          }),
        )
        peer.outbox.shift()
      }
    } catch {
      // Keep the unsent signal. The next sync checks current membership and retries.
    } finally {
      peer.sending = false
    }
  }
  async offer(peer, restart = false) {
    if (peer.pc.signalingState !== 'stable') return
    peer.generation++
    await peer.pc.setLocalDescription(
      await peer.pc.createOffer({ iceRestart: restart }),
    )
    this.queue(peer, {
      type: 'offer',
      generation: peer.generation,
      sdp: peer.pc.localDescription.sdp,
    })
    peer.lastOffer = Date.now()
  }
  async peer(member) {
    const existing = this.peers.get(member.user_id)
    if (existing?.session === member.session_id) return existing
    if (existing) this.closePeer(member.user_id)
    const pc = new window.RTCPeerConnection({
      iceServers: this.configuration.iceServers,
    })
    const peer = {
      pc,
      member,
      session: member.session_id,
      generation: 0,
      candidates: [],
      seenCandidates: new Set(),
      outbox: [],
      deadline: Date.now() + 35000,
    }
    this.peers.set(member.user_id, peer)
    this.stream.getTracks().forEach((track) => pc.addTrack(track, this.stream))
    pc.onicecandidate = ({ candidate }) => {
      if (candidate)
        this.queue(peer, {
          type: 'ice',
          generation: peer.generation,
          candidate: candidate.toJSON(),
        })
    }
    pc.ontrack = ({ track }) => {
      if (this.peers.get(member.user_id) === peer)
        this.output.add(member.user_id, track)
    }
    pc.onconnectionstatechange = () => {
      if (this.peers.get(member.user_id) !== peer) return
      if (pc.connectionState === 'connected') {
        peer.deadline = null
        this.emit({ error: '' })
      } else if (['failed', 'disconnected'].includes(pc.connectionState)) {
        peer.deadline ||= Date.now() + 35000
        peer.disconnectedAt ||= Date.now()
      }
      this.publishConnections()
    }
    if (this.me < member.user_id) await this.offer(peer)
    return peer
  }
  publishConnections() {
    this.emit({
      connections: [...this.peers]
        .filter(([, peer]) => peer.pc.connectionState === 'connected')
        .map(([id]) => id),
    })
  }
  async receive(member, message) {
    const peer = this.peers.get(member.user_id)
    if (!peer || peer.session !== message.from_session) return
    const { pc } = peer,
      payload = message.payload,
      generation = payload.generation || 1
    if (payload.type === 'restart') {
      if (this.me < member.user_id && generation === peer.generation)
        await this.offer(peer, true)
      return
    }
    if (generation < peer.generation) return
    if (payload.type === 'ice') {
      const key = JSON.stringify(payload.candidate)
      if (peer.seenCandidates.has(key)) return
      peer.seenCandidates.add(key)
      if (pc.remoteDescription && generation === peer.generation) {
        const fragment = payload.candidate.usernameFragment
        if (
          !fragment ||
          pc.remoteDescription.sdp.includes(`a=ice-ufrag:${fragment}`)
        )
          await pc.addIceCandidate(payload.candidate)
      } else if (peer.candidates.length < 100)
        peer.candidates.push({ generation, candidate: payload.candidate })
      return
    }
    if (payload.type === 'offer' && this.me > member.user_id) {
      if (generation !== peer.generation || !pc.remoteDescription) {
        peer.generation = generation
        await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
        await this.applyCandidates(peer)
        await pc.setLocalDescription(await pc.createAnswer())
      }
      this.queue(peer, {
        type: 'answer',
        generation,
        sdp: pc.localDescription.sdp,
      })
    } else if (
      payload.type === 'answer' &&
      generation === peer.generation &&
      pc.signalingState === 'have-local-offer'
    ) {
      await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
      await this.applyCandidates(peer)
    }
  }
  async applyCandidates(peer) {
    const pending = peer.candidates.splice(0)
    for (const item of pending) {
      if (item.generation > peer.generation) peer.candidates.push(item)
      else if (item.generation === peer.generation) {
        const fragment = item.candidate.usernameFragment
        if (
          !fragment ||
          peer.pc.remoteDescription.sdp.includes(`a=ice-ufrag:${fragment}`)
        )
          await peer.pc.addIceCandidate(item.candidate)
      }
    }
  }
  async recover(peer) {
    if (peer.deadline && Date.now() > peer.deadline) {
      await this.fail(
        'Audio could not connect. Rejoin or try another network. Text chat is still available.',
      )
      return
    }
    if (
      peer.pc.signalingState === 'have-local-offer' &&
      Date.now() - peer.lastOffer > 2500
    ) {
      this.queue(peer, {
        type: 'offer',
        generation: peer.generation,
        sdp: peer.pc.localDescription.sdp,
      })
      peer.lastOffer = Date.now()
    } else if (
      ['disconnected', 'failed'].includes(peer.pc.connectionState) &&
      Date.now() - (peer.disconnectedAt || 0) > 2500
    ) {
      peer.disconnectedAt = Date.now()
      if (this.me < peer.member.user_id) await this.offer(peer, true)
      else this.queue(peer, { type: 'restart', generation: peer.generation })
    }
    void this.flush(peer)
  }
  async sync() {
    if (this.disposed || this.syncing) return
    this.syncing = true
    const session = this.session
    try {
      const members = await result(
        supabase
          .from('project_voice_members')
          .select('*,person:profiles(id,full_name,username)')
          .eq('project_id', this.project)
          .gt('last_seen_at', new Date(Date.now() - 45000).toISOString()),
      )
      if (this.disposed || session !== this.session) return
      this.emit({ members })
      if (!session) return
      if (
        !members.some((m) => m.user_id === this.me && m.session_id === session)
      ) {
        await this.fail('Your call has ended or your project access changed.')
        return
      }
      for (const [id, peer] of this.peers)
        if (
          !members.some(
            (m) => m.user_id === id && m.session_id === peer.session,
          )
        )
          this.closePeer(id)
      for (const member of members.filter((m) => m.user_id !== this.me)) {
        if (!this.session || this.disposed) return
        await this.peer(member)
      }
      const signals = await result(
        supabase
          .from('project_voice_signals')
          .select('*')
          .eq('project_id', this.project)
          .eq('recipient_id', this.me)
          .eq('to_session', session)
          .gt('created_at', new Date(Date.now() - 120000).toISOString())
          .order('id', { ascending: false })
          .limit(500),
      )
      if (this.disposed || session !== this.session) return
      // Identity values are allocated before commit. Replay a bounded window so
      // a delayed commit or failed signal is never skipped by a high-water mark.
      const available = new Set(signals.map((message) => message.id))
      this.processed = new Set(
        [...this.processed].filter((id) => available.has(id)),
      )
      for (const message of signals.reverse()) {
        if (this.processed.has(message.id)) continue
        const member = members.find(
          (m) =>
            m.user_id === message.sender_id &&
            m.session_id === message.from_session,
        )
        if (member) {
          await this.receive(member, message)
          this.processed.add(message.id)
        }
      }
      for (const peer of this.peers.values()) await this.recover(peer)
    } catch (e) {
      if (this.session && e.code === '42501')
        await this.fail('Project call access ended.')
      else if (this.session)
        this.emit({
          error:
            'Reconnecting audio. Your text conversation is still available.',
        })
    } finally {
      this.syncing = false
    }
  }
  mute() {
    const muted = !this.state.muted
    this.stream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted
    })
    this.emit({ muted })
  }
  play() {
    return this.output.unlock()
  }
  closePeer(id) {
    const peer = this.peers.get(id)
    if (!peer) return
    this.peers.delete(id)
    peer.pc.onconnectionstatechange = null
    peer.pc.onicecandidate = null
    peer.pc.ontrack = null
    peer.pc.close()
    this.output.remove(id)
    this.publishConnections()
  }
  async leave() {
    const session = this.session
    this.session = null
    this.joinAttempt = null
    for (const id of [...this.peers.keys()]) this.closePeer(id)
    this.stream?.getTracks().forEach((t) => {
      t.onended = null
      t.stop()
    })
    this.output.close()
    this.stream = null
    this.emit({
      phase: 'idle',
      muted: false,
      connections: [],
      levels: {},
      audioBlocked: false,
    })
    if (session) await this.action('leave', session).catch(() => {})
  }
  async fail(error) {
    await this.leave()
    this.emit({ error })
  }
  leavePage() {
    if (this.session && this.token)
      void fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/colearn_project_voice`,
        {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            project: this.project,
            operation: 'leave',
            device: this.device,
            session: this.session,
          }),
        },
      ).catch(() => {})
    void this.leave()
  }
  dispose() {
    this.disposed = true
    clearInterval(this.poll)
    clearInterval(this.heartbeat)
    clearInterval(this.meter)
    this.authSubscription?.unsubscribe()
    window.removeEventListener('pagehide', this.onLeave)
    window.removeEventListener('offline', this.onOffline)
    window.removeEventListener('focus', this.onVisible)
    void this.leave()
    if (this.channel) void supabase.removeChannel(this.channel)
  }
}
