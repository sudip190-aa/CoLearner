import { useEffect, useId, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

const time = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export default function VoiceMessagePlayer({
  src,
  durationMs,
  label = 'Voice message',
  onRetry,
}) {
  const audio = useRef(null)
  const id = useId()
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(durationMs / 1000)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState('')
  useEffect(() => {
    const pauseOther = (event) => {
      if (event.detail !== id) audio.current?.pause()
    }
    document.addEventListener('colearn:voice-message-play', pauseOther)
    const element = audio.current
    return () => {
      element?.pause()
      document.removeEventListener('colearn:voice-message-play', pauseOther)
    }
  }, [id, src])
  async function toggle() {
    const element = audio.current
    if (!element) return
    if (!element.paused) {
      element.pause()
      return
    }
    if (element.ended) element.currentTime = 0
    document.dispatchEvent(
      new CustomEvent('colearn:voice-message-play', { detail: id }),
    )
    try {
      await element.play()
      setError('')
    } catch {
      setError('Audio could not play. Try again.')
    }
  }
  return (
    <div aria-label={label} className="w-60 max-w-full py-1">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadStart={() => {
          setError('')
          setPlaying(false)
          setPosition(0)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setPosition(audio.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          if (Number.isFinite(audio.current.duration))
            setDuration(audio.current.duration)
        }}
        onError={() => setError('Audio unavailable. Please retry.')}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? 'Pause voice message' : 'Play voice message'}
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-c-action text-white focus-visible:ring-2 focus-visible:ring-c-blue focus-visible:ring-offset-2"
        >
          {playing ? (
            <Pause size={16} />
          ) : (
            <Play size={16} className="ml-0.5" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            aria-label="Seek voice message"
            min="0"
            max={duration || 1}
            step="0.1"
            value={Math.min(position, duration || 1)}
            onChange={(event) => {
              const next = Number(event.target.value)
              audio.current.currentTime = next
              setPosition(next)
            }}
            className="block h-4 w-full cursor-pointer accent-c-blue"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-c-text-muted">
            <span>
              {time(position)} / {time(duration || 0)}
            </span>
            <button
              type="button"
              aria-label={`Playback speed ${speed} times`}
              onClick={() => {
                const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1
                audio.current.playbackRate = next
                setSpeed(next)
              }}
              className="rounded px-1.5 font-semibold text-c-blue hover:bg-c-blue-wash"
            >
              {speed}×
            </button>
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-c-danger">
          {error}{' '}
          {onRetry && (
            <button type="button" className="underline" onClick={onRetry}>
              Reload audio
            </button>
          )}
        </p>
      )}
    </div>
  )
}
