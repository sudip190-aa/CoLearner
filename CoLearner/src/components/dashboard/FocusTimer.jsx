import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Button } from '../ui'

export default function FocusTimer({ userId }) {
  const key = `colearn:focus:${userId}`
  const [timer, setTimer] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      if (
        saved &&
        [15, 25, 50].includes(saved.minutes) &&
        Number.isFinite(saved.remaining)
      )
        return saved
    } catch {
      /* Storage may be unavailable. */
    }
    return { minutes: 25, remaining: 1500, end: null }
  })
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(timer))
    } catch {
      /* Timer still works in memory. */
    }
  }, [key, timer])
  const seconds = timer.end
    ? Math.max(0, Math.ceil((timer.end - now) / 1000))
    : timer.remaining
  const running = !!timer.end && seconds > 0
  const progress = (1 - seconds / (timer.minutes * 60)) * 100
  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-[#142c53] p-6 text-white"
      aria-label="Focus timer"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Timer size={17} className="text-c-yellow" /> A little focus goes far
        </span>
        <button
          title="Reset timer"
          aria-label="Reset focus timer"
          onClick={() =>
            setTimer({ ...timer, remaining: timer.minutes * 60, end: null })
          }
          className="rounded-lg p-2 text-white/70 hover:bg-white/10"
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p
          className="font-sans text-5xl font-semibold tabular-nums tracking-tight"
          role="timer"
          aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds`}
        >
          {String(Math.floor(seconds / 60)).padStart(2, '0')}
          <span className="text-white/40">:</span>
          {String(seconds % 60).padStart(2, '0')}
        </p>
        <span className="mb-1 rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-white/70">
          {running
            ? 'In the zone'
            : seconds === 0
              ? 'Well done'
              : 'Your time, protected'}
        </span>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-c-yellow transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-white/60" role="status">
        {seconds === 0
          ? 'Session complete. Stretch, breathe, and reset.'
          : 'One task. No multitasking. Just a small step forward.'}
      </p>
      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {[15, 25, 50].map((minutes) => (
            <button
              key={minutes}
              aria-pressed={minutes === timer.minutes}
              aria-label={`${minutes} minute session`}
              disabled={running}
              onClick={() =>
                setTimer({ minutes, remaining: minutes * 60, end: null })
              }
              className={`rounded-lg px-2.5 py-2 text-xs disabled:opacity-40 ${minutes === timer.minutes ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
            >
              {minutes}m
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="yellow"
          icon={running ? Pause : Play}
          onClick={() => {
            setNow(Date.now())
            setTimer(
              running
                ? { ...timer, remaining: seconds, end: null }
                : {
                    ...timer,
                    remaining: seconds || timer.minutes * 60,
                    end: Date.now() + (seconds || timer.minutes * 60) * 1000,
                  },
            )
          }}
        >
          {running ? 'Pause' : seconds === 0 ? 'Again' : 'Focus'}
        </Button>
      </div>
    </section>
  )
}
