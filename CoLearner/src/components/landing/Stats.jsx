import React, { useEffect, useRef, useState } from 'react'
import { useFadeUp } from '../../hooks/useFadeUp'

const stats = [
  { end: 12400, label: 'Learners on the platform', suffix: '+' },
  { end: 830, label: 'Projects shipped', suffix: '+' },
  { end: 48, label: 'Curated books', suffix: '' },
  { end: 62000, label: 'Badges earned', suffix: '+' },
]

/** Animates a number from 0 to `end` over `duration`ms once `active` becomes true. */
function useCountUp(end, duration = 1800, active = false) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!active) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [active, end, duration])

  return value
}

function StatCard({ end, label, suffix }) {
  const { ref, visible } = useFadeUp(0.3)
  const value = useCountUp(end, 1800, visible)

  const display = value >= 1000 ? value.toLocaleString() : String(value)

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-c-text mb-2 tabular-nums">
        {display}
        <span className="text-c-blue">{suffix}</span>
      </div>
      <div className="text-sm md:text-base text-c-text-muted font-medium">
        {label}
      </div>
    </div>
  )
}

export const Stats = () => {
  return (
    <section className="py-14 md:py-24 bg-c-blue-wash/40 border-y border-c-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            A community doing real work
          </h2>
          <p className="text-lg text-c-text-muted">
            Numbers speak louder than tutorials.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl mx-auto">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
