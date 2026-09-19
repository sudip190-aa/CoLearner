// Open the output during the call/join gesture, before microphone/signaling awaits.
// A streamless RTC track is valid; always build our own remote MediaStream.
export class CallAudio {
  constructor(onBlocked) {
    this.onBlocked = onBlocked
    this.outputs = new Map()
  }

  async unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext
    try {
      if (Audio && (!this.context || this.context.state === 'closed')) {
        this.context = new Audio()
      }
      if (this.context) await this.context.resume()
      await Promise.all(
        [...this.outputs.values()].map((output) => this.play(output)),
      )
      if (!this.outputs.size) this.onBlocked(false)
    } catch {
      this.onBlocked(true)
    }
  }

  add(id, track) {
    if (track.kind !== 'audio') return
    if (this.outputs.get(id)?.track === track) return
    this.remove(id)
    const stream = new window.MediaStream([track])
    const output = { stream, track }
    this.outputs.set(id, output)
    // Native media playback participates in the browser's echo cancellation.
    // Web Audio measures decoded samples. A blocked media element asks for an
    // explicit click instead of claiming that an inaudible call is working.
    output.audio = document.createElement('audio')
    output.audio.autoplay = true
    output.audio.playsInline = true
    output.audio.hidden = true
    output.audio.srcObject = stream
    document.body.append(output.audio)
    if (this.context && this.context.state !== 'closed') {
      output.source = this.context.createMediaStreamSource(stream)
      output.analyser = this.context.createAnalyser()
      output.analyser.fftSize = 256
      output.samples = new Float32Array(output.analyser.fftSize)
      output.source.connect(output.analyser)
      output.gain = this.context.createGain()
      output.gain.gain.value = 0
      output.analyser.connect(output.gain)
      output.gain.connect(this.context.destination)
    }
    void this.play(output)
  }

  async play(output) {
    try {
      await output.audio.play()
      if ([...this.outputs.values()].includes(output)) {
        output.blocked = false
        this.reportBlocked()
      }
    } catch {
      if ([...this.outputs.values()].includes(output)) {
        output.blocked = true
        this.reportBlocked()
      }
    }
  }

  reportBlocked() {
    this.onBlocked([...this.outputs.values()].some((output) => output.blocked))
  }

  level(id) {
    const output = this.outputs.get(id)
    if (!output?.analyser || this.context.state !== 'running') return 0
    output.analyser.getFloatTimeDomainData(output.samples)
    return Math.min(
      1,
      Math.sqrt(
        output.samples.reduce((sum, x) => sum + x * x, 0) /
          output.samples.length,
      ) * 5,
    )
  }

  remove(id) {
    const output = this.outputs.get(id)
    if (!output) return
    output.source?.disconnect()
    output.analyser?.disconnect()
    output.gain?.disconnect()
    if (output.audio) {
      output.audio.pause()
      output.audio.srcObject = null
      output.audio.remove()
    }
    this.outputs.delete(id)
    this.reportBlocked()
  }

  close() {
    for (const id of this.outputs.keys()) this.remove(id)
    if (this.context) {
      this.context.onstatechange = null
      void this.context.close().catch(() => {})
      this.context = null
    }
  }
}
