import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_DURATION = 120000
const MAX_BYTES = 5 * 1024 * 1024
const formats = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/webm',
]

// Keep ownership of the microphone even while its permission prompt is pending.
function release(recording) {
  if (!recording) return
  clearInterval(recording.timer)
  if (recording.recorder?.state !== 'inactive') recording.recorder?.stop()
  recording.stream?.getTracks().forEach((track) => track.stop())
}

export function useVoiceRecorder(callActive = false) {
  const current = useRef(null)
  const previewUrl = useRef('')
  const [phase, setPhase] = useState('idle')
  const [durationMs, setDuration] = useState(0)
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const cancel = useCallback(() => {
    const recording = current.current
    current.current = null
    release(recording)
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = ''
    setUrl('')
    setPhase('idle')
    setBlob(null)
    setDuration(0)
    setError('')
  }, [])

  const stop = useCallback(() => {
    const recording = current.current
    if (!recording?.recorder || recording.recorder.state === 'inactive') return
    recording.duration = Math.min(
      MAX_DURATION,
      Math.max(1, Math.round(performance.now() - recording.started)),
    )
    setPhase('processing')
    release(recording)
  }, [])

  const start = async () => {
    if (current.current || blob || callActive) return
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        'Voice recording needs a supported browser on HTTPS or localhost.',
      )
      return
    }
    const mimeType = formats.find((format) =>
      window.MediaRecorder.isTypeSupported(format),
    )
    if (!mimeType) {
      setError(
        'This browser cannot record a supported audio format. Try a current Chrome, Edge, Firefox or Safari browser.',
      )
      return
    }
    const recording = { chunks: [], bytes: 0 }
    current.current = recording
    setPhase('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (current.current !== recording) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      recording.stream = stream
      const recorder = new window.MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      })
      recording.recorder = recorder
      recorder.ondataavailable = ({ data }) => {
        if (current.current !== recording) return
        recording.bytes += data.size
        recording.chunks.push(data)
        if (recording.bytes > MAX_BYTES) stop()
      }
      recorder.onerror = () => {
        if (current.current !== recording) return
        cancel()
        setError('Recording was interrupted. Please try again.')
      }
      recorder.onstop = () => {
        if (current.current !== recording) return
        current.current = null
        release(recording)
        const audio = new Blob(recording.chunks, {
          type: recorder.mimeType.split(';')[0],
        })
        if (!audio.size || audio.size > MAX_BYTES) {
          setPhase('idle')
          setError(
            audio.size
              ? 'This recording is too large. Record a shorter message.'
              : 'No audio was recorded. Please try again.',
          )
          return
        }
        setDuration(
          recording.duration ||
            Math.min(
              MAX_DURATION,
              Math.max(1, Math.round(performance.now() - recording.started)),
            ),
        )
        setBlob(audio)
        previewUrl.current = URL.createObjectURL(audio)
        setUrl(previewUrl.current)
        setPhase('ready')
      }
      recording.started = performance.now()
      recorder.start(250)
      setPhase('recording')
      setDuration(0)
      recording.timer = setInterval(() => {
        const elapsed = performance.now() - recording.started
        setDuration(Math.min(MAX_DURATION, elapsed))
        if (elapsed >= MAX_DURATION) stop()
      }, 200)
      stream.getAudioTracks().forEach((track) => {
        track.onended = stop
      })
    } catch (failure) {
      if (current.current !== recording) return
      cancel()
      setError(
        failure.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow it in your browser settings and try again.'
          : failure.name === 'NotFoundError'
            ? 'No microphone was found. Connect one and try again.'
            : 'The microphone could not start. Check whether another app is using it.',
      )
    }
  }

  useEffect(() => {
    if (callActive && current.current) {
      cancel()
      setError('Recording stopped because a voice call is active.')
    }
  }, [callActive, cancel])
  useEffect(
    () => () => {
      const recording = current.current
      current.current = null
      release(recording)
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    },
    [],
  )

  return {
    phase,
    durationMs,
    blob,
    url,
    error,
    start,
    stop,
    cancel,
    busy: ['requesting', 'recording', 'processing'].includes(phase),
  }
}
