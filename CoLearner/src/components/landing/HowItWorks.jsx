import React from 'react'

const steps = [
  {
    title: 'Create profile',
    description:
      'Set up your developer identity and define your learning goals.',
  },
  {
    title: 'Learn a skill',
    description:
      'Read curated books and complete interactive chapters to level up.',
  },
  {
    title: 'Join or start a project',
    description:
      'Team up with others to build real software with actual milestones.',
  },
  {
    title: 'Showcase your portfolio',
    description: 'Prove your ability with verified commits and peer reviews.',
  },
]

export const HowItWorks = () => {
  return (
    <section className="py-14 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            How it works
          </h2>
          <p className="text-lg text-c-text-muted">
            From your first login to your first job interview.
          </p>
        </div>

        <div className="max-w-5xl mx-auto relative">
          {/* Connecting line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[2px] bg-c-border -z-10" />

          <div className="grid md:grid-cols-4 gap-8 md:gap-4 relative">
            {/* Connecting line (Mobile) */}
            <div className="md:hidden absolute top-8 bottom-8 left-8 w-[2px] bg-c-border -z-10" />

            {steps.map((step, i) => (
              <div
                key={i}
                className="flex md:flex-col items-start md:items-center relative"
              >
                {/* Number Circle */}
                <div className="w-16 h-16 rounded-full bg-c-yellow flex items-center justify-center text-2xl font-black text-c-text shrink-0 mb-6 md:mx-auto border-4 border-white shadow-sm z-10">
                  {i + 1}
                </div>

                {/* Content */}
                <div className="ml-6 md:ml-0 md:text-center mt-2 md:mt-0">
                  <h3 className="text-xl font-bold text-c-text mb-2">
                    {step.title}
                  </h3>
                  <p className="text-c-text-muted leading-relaxed max-w-[200px] md:mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
