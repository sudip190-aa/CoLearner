import React from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui'

const accents = {
  'How it works': {
    number: '01',
    label: 'A little structure. Real progress.',
    tags: ['Learn', 'Build', 'Prove'],
    color: 'bg-c-blue-soft',
  },
  Features: {
    number: '02',
    label: 'Less friction. More focus.',
    tags: ['Discover', 'Collaborate', 'Create'],
    color: 'bg-c-blue-wash',
  },
  Community: {
    number: '03',
    label: 'Different skills. Shared curiosity.',
    tags: ['Learners', 'Builders', 'Mentors'],
    color: 'bg-c-blue-wash',
  },
  'About CoLearn': {
    number: '04',
    label: 'Small steps. Lasting skills.',
    tags: ['Practice', 'People', 'Purpose'],
    color: 'bg-c-blue-soft',
  },
}

export function MarketingPage({
  eyebrow,
  title,
  description,
  children,
  ctaTitle = 'Make your next step count.',
  ctaText = 'Choose a skill, find your people, and start building.',
}) {
  const accent = accents[eyebrow] || accents.Features
  return (
    <>
      <section className="container pt-8 md:pt-12">
        <div
          className={`relative overflow-hidden rounded-[28px] p-7 sm:p-10 md:p-14 ${accent.color}`}
        >
          <div className="mb-10 flex items-center justify-between gap-4 text-xs">
            <Link
              to="/"
              className="text-c-text-muted transition-colors hover:text-c-text"
            >
              Home <span className="mx-2 text-c-text-muted">/</span>{' '}
              <span className="text-c-text">{eyebrow}</span>
            </Link>
            <span className="font-mono text-c-text-muted">
              {accent.number} / COLEARN
            </span>
          </div>
          <div className="grid items-end gap-8 lg:grid-cols-[1.65fr_0.7fr] lg:gap-14">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
                {eyebrow}
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight md:text-5xl lg:text-[54px]">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-c-text-muted sm:text-lg">
                {description}
              </p>
            </div>
            <div className="border-t border-c-blue/20 pt-5 lg:pb-1">
              <ArrowUpRight
                size={28}
                className="mb-5 text-c-blue"
                aria-hidden="true"
              />
              <p className="max-w-[220px] text-xl font-medium leading-snug tracking-tight">
                {accent.label}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {accent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-c-blue/20 bg-white px-3 py-1.5 text-xs text-c-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {children}
      <section className="container pb-16 md:pb-20">
        <div className="flex flex-col items-start justify-between gap-7 border-t border-c-border pt-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {ctaTitle}
            </h2>
            <p className="mt-3 text-c-text-muted">{ctaText}</p>
          </div>
          <Button
            to="/signup"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="shrink-0 rounded-full"
          >
            Get started
          </Button>
        </div>
      </section>
    </>
  )
}
