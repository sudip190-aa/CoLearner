import React from 'react'

const companies = [
  { name: 'Acme Corp', style: 'font-serif italic' },
  { name: 'TechFlow', style: 'font-sans font-black tracking-tighter' },
  { name: 'GlobalSystems', style: 'font-mono font-medium tracking-tight' },
  { name: 'NEXUS', style: 'font-sans font-light tracking-[0.2em]' },
  { name: 'innovate', style: 'font-sans font-bold lowercase tracking-normal' },
]

export const SocialProof = () => {
  return (
    <section className="py-12 border-b border-c-border bg-c-surface">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-semibold text-c-text-muted uppercase tracking-wider mb-8">
          Learners from top companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {companies.map((company) => (
            <div
              key={company.name}
              className={`text-2xl text-c-text-muted select-none ${company.style}`}
            >
              {company.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
