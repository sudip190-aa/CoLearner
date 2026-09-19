import React from 'react'
import { X, Check } from 'lucide-react'

const painPoints = [
  'Isolated learning without real context',
  'Lonely side projects you never finish',
  'Certificates with no real portfolio value',
  'No community to answer questions or review code',
  'Losing motivation halfway through a course',
]

const solutions = [
  'Collaborative learning with peers and mentors',
  'Team-based project building with milestones',
  'Verified public portfolio showing real commits',
  'Vibrant community for instant unblocking',
  'Gamified progress with XP and streaks',
]

export const ProblemSolution = () => {
  return (
    <section className="py-14 md:py-24 bg-c-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            The old way is broken.
          </h2>
          <p className="text-lg text-c-text-muted">
            Watching tutorials alone doesn't build software.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left: Pain Points */}
          <div className="bg-c-bg-subtle/50 rounded-2xl p-8 md:p-10 border border-c-border">
            <h3 className="text-xl font-semibold text-c-text mb-6">
              Without Colearn
            </h3>
            <ul className="space-y-5">
              {painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 text-c-text-muted/50">
                    <X size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-c-text-muted">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Solutions */}
          <div className="bg-c-surface rounded-2xl p-8 md:p-10 border border-c-blue/20 shadow-[0_0_40px_rgba(var(--c-blue-rgb),0.05)] relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-c-blue/5 blur-3xl rounded-full -z-10 pointer-events-none" />

            <h3 className="text-xl font-semibold text-c-text mb-6">
              With Colearn
            </h3>
            <ul className="space-y-5">
              {solutions.map((solution, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 text-c-blue">
                    <Check size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-c-text font-medium">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
