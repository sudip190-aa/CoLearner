import React from 'react'
import { Check, Minus } from 'lucide-react'
import { Logo } from '../ui'

const features = [
  { label: 'Learn + build in one platform' },
  { label: 'Peer matching & team formation' },
  { label: 'Gamification (XP, streaks, badges)' },
  { label: 'Community-driven discussions' },
  { label: 'Free to use' },
  { label: 'All-in-one (no tool juggling)' },
]

export const Comparison = () => {
  return (
    <section className="py-14 md:py-24 bg-c-blue-wash/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            Built different. Built complete.
          </h2>
          <p className="text-lg text-c-text-muted max-w-xl mx-auto">
            Most tools help you learn <em>or</em> build. Colearn is the only
            place that does both — together.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-c-border shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-3 bg-c-surface">
            <div className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-bold text-c-text-muted uppercase tracking-wider border-b border-r border-c-border">
              Features
            </div>
            {/* Colearn column — highlighted */}
            <div className="px-3 sm:px-6 py-4 flex items-center justify-center border-b border-r border-c-border bg-c-blue-soft/60">
              <Logo variant="full" size="sm" />
            </div>
            <div className="px-3 sm:px-6 py-4 flex items-center justify-center border-b border-c-border">
              <span className="text-xs sm:text-sm font-semibold text-c-text-muted text-center">
                Other tools
              </span>
            </div>
          </div>

          {/* Data rows */}
          {features.map((feature, i) => {
            const isEven = i % 2 === 0
            return (
              <div
                key={feature.label}
                className={`grid grid-cols-3 ${isEven ? 'bg-c-surface' : 'bg-c-blue-wash/30'}`}
              >
                {/* Label */}
                <div className="px-3 sm:px-6 py-4 flex items-center text-xs sm:text-sm font-medium text-c-text border-r border-c-border">
                  {feature.label}
                </div>

                {/* Colearn ✓ */}
                <div className="px-3 sm:px-6 py-4 flex items-center justify-center border-r border-c-border bg-c-blue-soft/20">
                  <span className="w-7 h-7 rounded-full bg-c-action flex items-center justify-center shadow-sm">
                    <Check size={15} className="text-white" strokeWidth={3} />
                  </span>
                </div>

                {/* Other — dash */}
                <div className="px-3 sm:px-6 py-4 flex items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-c-border/50 flex items-center justify-center">
                    <Minus
                      size={15}
                      className="text-c-text-muted"
                      strokeWidth={2.5}
                    />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
