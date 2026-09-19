import React from 'react'
import { BookOpen, Code2, MessageCircle, ArrowUpRight } from 'lucide-react'
import { MarketingPage } from '../components/landing/MarketingPage'
import { Button } from '../components/ui'

const audiences = [
  [
    BookOpen,
    'For learners',
    'You do not need to have it all figured out.',
    'Ask questions, share a small win, or find someone working through the same subject. Learning gets easier when you can talk about the hard parts.',
  ],
  [
    Code2,
    'For builders',
    'Find your next collaborator.',
    'Bring an idea, share the skills you need, and work with people who want to make something useful. Keep the scope small enough to finish.',
  ],
  [
    MessageCircle,
    'For mentors',
    'Put your experience to work for someone else.',
    'Offer practical feedback, explain a difficult concept, or help a learner choose their next step. A thoughtful answer can make a difference.',
  ],
]
export default function CommunityOverview() {
  return (
    <MarketingPage
      eyebrow="Community"
      title="Good work starts with good company."
      description="A place for learners, builders, and mentors to ask questions, exchange ideas, and make progress together."
      ctaTitle="Find your people."
      ctaText="Bring your curiosity. Share what you know."
    >
      <section
        className="container grid gap-8 py-16 md:grid-cols-3 md:py-20"
        aria-label="Who the community is for"
      >
        {audiences.map(([Icon, label, title, text]) => (
          <article
            key={label}
            className="rounded-2xl border border-c-border bg-c-surface p-7"
          >
            <Icon size={26} className="mb-6 text-c-blue" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wider text-c-blue">
              {label}
            </p>
            <h2 className="mt-3 text-xl font-semibold">{title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-c-text-muted">
              {text}
            </p>
          </article>
        ))}
      </section>
      <section className="container grid gap-10 pb-16 md:grid-cols-2 md:gap-20 md:pb-24">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Make yourself at home.
          </h2>
          <p className="mt-4 leading-relaxed text-c-text-muted">
            Introduce yourself, join a discussion, or find a project that
            interests you. You can start with a question.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/community" icon={ArrowUpRight} iconPosition="right">
              Open discussions
            </Button>
            <Button to="/people" variant="outline">
              Find collaborators
            </Button>
          </div>
          <p className="mt-3 text-xs text-c-text-muted">
            Sign in to access discussions and member profiles.
          </p>
        </div>
        <div className="rounded-2xl bg-c-blue-wash p-8">
          <h2 className="text-lg font-semibold">A few things we value</h2>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-c-text-muted">
            <li>
              <strong className="text-c-text">Be curious.</strong> Ask questions
              and make room for different perspectives.
            </li>
            <li>
              <strong className="text-c-text">Be constructive.</strong> Offer
              specific, respectful feedback people can use.
            </li>
            <li>
              <strong className="text-c-text">Share the credit.</strong>{' '}
              Recognize contributions and be honest about your own work.
            </li>
          </ul>
        </div>
      </section>
    </MarketingPage>
  )
}
