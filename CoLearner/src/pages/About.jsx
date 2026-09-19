import React from 'react'
import { ArrowRight, BookOpen, Hammer, Medal, Users } from 'lucide-react'
import { Button } from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'

const pillars = [
  {
    title: 'LEARN',
    text: 'Build a durable foundation through curated books, a focused reader, and visible progress.',
    icon: BookOpen,
    tint: 'bg-c-blue-soft',
  },
  {
    title: 'BUILD',
    text: 'Turn understanding into real projects with peers, tasks, milestones, and feedback.',
    icon: Hammer,
    tint: 'bg-c-yellow-soft',
  },
  {
    title: 'PROVE',
    text: 'Make your work legible through a portfolio, badges, skills, and honest reflection.',
    icon: Medal,
    tint: 'bg-blue-50',
  },
  {
    title: 'ENGAGE',
    text: 'Keep momentum human with XP, streaks, conversations, and people who are learning too.',
    icon: Users,
    tint: 'bg-emerald-50',
  },
]
export default function About() {
  return (
    <div>
      <PageHeader
        title="Learn → Build → Prove → Succeed"
        subtitle="Colearn is a place for students and developers to turn curious effort into work they can stand behind."
      />
      <section className="grid gap-10 py-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <p className="text-lg leading-8 text-c-text">
            The internet has never had a shortage of information. It has had a
            shortage of good next steps.
          </p>
          <p className="mt-5 text-base leading-8 text-c-text-muted">
            Colearn brings the pieces together: the right book, a real project,
            thoughtful peers, and a public record of what you made. We are
            building the learning environment we wished existed when we were
            starting out.
          </p>
          <Button
            className="mt-7"
            to="/signup"
            icon={ArrowRight}
            iconPosition="right"
          >
            Start learning
          </Button>
        </div>
        <div className="rounded-brand-lg border border-c-border bg-c-blue-wash p-7">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-c-blue">
            Our belief
          </p>
          <p className="mt-4 text-2xl font-bold leading-9 text-c-text">
            Progress gets more durable when you can show your work and share the
            path.
          </p>
        </div>
      </section>
      <section className="border-t border-c-border py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {pillars.map(({ title, text, icon: Icon, tint }) => (
            <article
              key={title}
              className="rounded-brand-lg border border-c-border bg-white p-6 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-brand ${tint}`}
              >
                <Icon className="h-5 w-5 text-c-text" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-c-text">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-c-text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-c-border py-14">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-c-blue">
            The story
          </p>
          <h2 className="mt-2 text-3xl font-bold text-c-text">
            A calmer way to get good at difficult things.
          </h2>
          <p className="mt-5 text-base leading-8 text-c-text-muted">
            We started Colearn after watching talented people collect tutorials
            without ever getting the confidence that comes from finishing
            something real. The answer was not more pressure. It was better
            structure, smaller steps, and a community that knows the difference
            between a question and a failure.
          </p>
        </div>
      </section>
    </div>
  )
}
