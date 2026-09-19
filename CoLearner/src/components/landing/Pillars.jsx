import React from 'react'
import { BookOpen, Hammer, ShieldCheck, Users } from 'lucide-react'
import { Card } from '../ui'

const pillars = [
  {
    id: 'learn',
    title: 'LEARN',
    icon: BookOpen,
    description:
      'Master in-demand skills through curated books and an interactive reader.',
  },
  {
    id: 'build',
    title: 'BUILD',
    icon: Hammer,
    description:
      'Apply your knowledge by building real-world projects with a team.',
  },
  {
    id: 'prove',
    title: 'PROVE',
    icon: ShieldCheck,
    description:
      'Showcase your commits, code reviews, and milestones in a public portfolio.',
  },
  {
    id: 'engage',
    title: 'ENGAGE',
    icon: Users,
    description:
      'Earn XP, maintain streaks, and climb the leaderboard with the community.',
  },
]

export const Pillars = () => {
  return (
    <section className="py-14 md:py-24 bg-c-bg-subtle/30 border-y border-c-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            The Four Pillars of Colearn
          </h2>
          <p className="text-lg text-c-text-muted max-w-2xl mx-auto">
            A complete ecosystem designed to take you from reading a textbook to
            deploying production-ready code.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <Card
                key={pillar.id}
                className="group border border-c-border hover:border-c-blue transition-colors duration-300 h-full bg-white"
              >
                <div className="p-6 md:p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-c-blue-soft text-c-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-c-text mb-3 tracking-wide">
                    {pillar.title}
                  </h3>
                  <p className="text-c-text-muted leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
