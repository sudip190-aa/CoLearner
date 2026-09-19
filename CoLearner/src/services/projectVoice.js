import { supabase, result } from './supabase/client'
import { microphoneError } from './voiceCalls'

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
    this.onLeave = () => void this.leave()
  }
  emit(patch) {
    this.state = { ...this.state, ...patch }
    if (!this.disposed) this.update(this.state)
  }
  async start() {
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
    this.heartbeat = setInterval(() => {
      if (this.session)
        void this.action('heartbeat').catch((e) => this.fail(e.message))
    }, 8000)
    window.addEventListener('pagehide', this.onLeave)
    window.addEventListener('offline', this.onLeave)
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
  async join() {
    if (this.session || this.state.phase === 'joining' || this.disposed) return
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
      if (this.disposed || this.state.phase !== 'joining') {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      this.stream = stream
      const session = crypto.randomUUID()
      await this.action('join', session)
      if (this.disposed || this.state.phase !== 'joining') {
        void this.action('leave', session)
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      this.session = session
      this.lastSignal = 0
      this.emit({ phase: 'joined' })
      await this.sync()
    } catch (e) {
      await this.fail(microphoneError(e))
    }
  }
  async signal(member, payload) {
    if (!this.session || this.disposed) return
    await result(
      supabase.from('project_voice_signals').insert({
        project_id: this.project,
        sender_id: this.me,
        recipient_id: member.user_id,
        from_session: this.session,
        to_session: member.session_id,
        payload,
      }),
    )
  }
  async peer(member) {
    const existing = this.peers.get(member.user_id)
    if (existing?.session === member.session_id) return existing
    if (existing) this.closePeer(member.user_id)
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
    const audio = document.createElement('audio')
    audio.autoplay = true
    audio.playsInline = true
    const peer = {
      pc,
      audio,
      session: member.session_id,
      candidates: [],
      serial: Promise.resolve(),
    }
    this.peers.set(member.user_id, peer)
    this.stream.getTracks().forEach((t) => pc.addTrack(t, this.stream))
    pc.onicecandidate = ({ candidate }) => {
      if (candidate)
        void this.signal(member, {
          type: 'ice',
          candidate: candidate.toJSON(),
        }).catch(() => {})
    }
    pc.ontrack = ({ streams }) => {
      audio.srcObject = streams[0]
      void audio.play().catch(() => this.emit({ audioBlocked: true }))
    }
    pc.onconnectionstatechange = () => {
      if (this.disposed || !this.session) return
      this.emit({
        connections: [...this.peers]
          .filter(([, p]) => p.pc.connectionState === 'connected')
          .map(([id]) => id),
      })
      if (pc.connectionState === 'failed')
        this.emit({
          error:
            'An audio connection failed. Leave and rejoin to try again. Text chat is still available.',
        })
    }
    if (this.me < member.user_id) {
      await pc.setLocalDescription(await pc.createOffer())
      await this.signal(member, { type: 'offer', sdp: pc.localDescription.sdp })
    }
    return peer
  }
  async receive(member, message) {
    const peer = this.peers.get(member.user_id)
    if (!peer || peer.session !== message.from_session) return
    const { pc } = peer,
      payload = message.payload
    if (payload.type === 'ice') {
      if (pc.remoteDescription) await pc.addIceCandidate(payload.candidate)
      else peer.candidates.push(payload.candidate)
    } else {
      await pc.setRemoteDescription({ type: payload.type, sdp: payload.sdp })
      for (const candidate of peer.candidates.splice(0))
        await pc.addIceCandidate(candidate)
      if (payload.type === 'offer') {
        await pc.setLocalDescription(await pc.createAnswer())
        await this.signal(member, {
          type: 'answer',
          sdp: pc.localDescription.sdp,
        })
      }
    }
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
          .gt('id', this.lastSignal)
          .order('id')
          .limit(500),
      )
      if (this.disposed || session !== this.session) return
      for (const message of signals) {
        this.lastSignal = message.id
        const member = members.find(
          (m) =>
            m.user_id === message.sender_id &&
            m.session_id === message.from_session,
        )
        if (member) await this.receive(member, message)
      }
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
  async play() {
    try {
      await Promise.all([...this.peers.values()].map((p) => p.audio.play()))
      this.emit({ audioBlocked: false })
    } catch {
      this.emit({ audioBlocked: true })
    }
  }
  closePeer(id) {
    const peer = this.peers.get(id)
    if (!peer) return
    this.peers.delete(id)
    peer.pc.onconnectionstatechange = null
    peer.pc.onicecandidate = null
    peer.pc.ontrack = null
    peer.pc.close()
    peer.audio.pause()
    peer.audio.srcObject = null
  }
  async leave() {
    const session = this.session
    this.session = null
    for (const id of [...this.peers.keys()]) this.closePeer(id)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.emit({
      phase: 'idle',
      muted: false,
      connections: [],
      audioBlocked: false,
    })
    if (session) await this.action('leave', session).catch(() => {})
  }
  async fail(error) {
    await this.leave()
    this.emit({ error })
  }
  dispose() {
    this.disposed = true
    clearInterval(this.poll)
    clearInterval(this.heartbeat)
    window.removeEventListener('pagehide', this.onLeave)
    window.removeEventListener('offline', this.onLeave)
    void this.leave()
    if (this.channel) void supabase.removeChannel(this.channel)
  }
}
