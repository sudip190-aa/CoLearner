import React from 'react'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote:
      "I finished three online courses but had nothing to show for it. After two months on Colearn I shipped a real app with a team, and it's the first item on my resume that actually gets interviews.",
    name: 'Marcus T.',
    role: 'Bootcamp student → Junior Developer',
    initials: 'MT',
    color: 'bg-c-action',
  },
  {
    quote:
      'The XP and streak system sounds gamey, but it genuinely kept me accountable. I read more in six weeks on Colearn than I did in the previous year on my own.',
    name: 'Priya S.',
    role: 'Self-taught developer',
    initials: 'PS',
    color: 'bg-c-action-hover',
  },
  {
    quote:
      'As a mentor, seeing my mentees actually ship projects — not just share certificates — is incredibly rewarding. Colearn gives mentorship real teeth.',
    name: 'David K.',
    role: 'Senior Engineer & Mentor',
    initials: 'DK',
    color: 'bg-c-ink',
  },
]

export const Testimonials = () => {
  return (
    <section className="py-14 md:py-24 bg-c-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            Real builders. Real results.
          </h2>
          <p className="text-lg text-c-text-muted max-w-xl mx-auto">
            Don't take our word for it — hear from the people doing the work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-c-surface border border-c-border rounded-2xl p-7 flex flex-col gap-5 hover:border-c-blue/40 hover:shadow-md transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="text-c-blue-soft">
                <Quote size={28} className="text-c-blue/30 fill-c-blue/10" />
              </div>

              {/* Quote text */}
              <p className="text-c-text leading-relaxed flex-1 text-[15px]">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-c-border">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-c-text text-sm">
                    {t.name}
                  </div>
                  <div className="text-xs text-c-text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
