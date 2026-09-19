import React from 'react'
import { MarketingPage } from '../components/landing/MarketingPage'

export default function About() {
  return (
    <MarketingPage
      eyebrow="About CoLearn"
      title="Learn together. Build with purpose."
      description="CoLearn is a learning and collaboration platform for people who want to turn knowledge into practical skills."
    >
      <section className="container grid gap-8 py-16 md:grid-cols-[1fr_1.4fr] md:gap-20 md:py-24">
        <h2 className="text-3xl font-semibold tracking-tight">
          A closer connection between learning and real work.
        </h2>
        <div className="space-y-5 text-lg leading-relaxed text-c-text-muted">
          <p>
            A book can give you a foundation. A project gives you a chance to
            use it. Working with other people helps you see what you missed.
          </p>
          <p>
            CoLearn brings these experiences together in one place, with
            resources to learn from, workspaces to build in, and a portfolio to
            show how far you have come.
          </p>
          <p>
            Our aim is simple: help people develop useful skills through
            consistent practice, collaboration, and feedback.
          </p>
        </div>
      </section>
      <section className="container pb-16 md:pb-24" aria-label="Our principles">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            [
              'Practice with purpose',
              'Connect what you study to something you can make, test, and improve.',
            ],
            [
              'Grow through collaboration',
              'Learn from different perspectives and share your own experience along the way.',
            ],
            [
              'Let the work speak',
              'Show your contribution, explain your decisions, and build a portfolio grounded in real effort.',
            ],
          ].map(([title, text], i) => (
            <article key={title} className="rounded-2xl bg-c-blue-wash p-7">
              <p className="mb-4 font-mono text-sm text-c-blue">0{i + 1}</p>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-relaxed text-c-text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingPage>
  )
}
