import React from 'react'
import { BookOpen, Code2, BadgeCheck } from 'lucide-react'
import { MarketingPage } from '../components/landing/MarketingPage'

const steps = [
  {
    icon: BookOpen,
    title: 'Choose a skill. Build a foundation.',
    text: 'Set a learning goal and pick a book from the library. Read at your own pace and track your progress as you go.',
    actions: [
      'Create your profile and add your interests.',
      'Choose a book that fits your next goal.',
      'Work through chapters and keep useful notes.',
    ],
    outcome: 'A foundation you can put into practice.',
  },
  {
    icon: Code2,
    title: 'Put your learning to work.',
    text: 'Start a project or join a team. Give the work a clear scope, break it into tasks, and build one milestone at a time.',
    actions: [
      'Define what you want to make.',
      'Find collaborators with complementary skills.',
      'Use your workspace to manage tasks and milestones.',
    ],
    outcome: 'A real project and a record of your contribution.',
  },
  {
    icon: BadgeCheck,
    title: 'Show the work behind your skills.',
    text: 'Submit your work for review, use feedback to improve it, and share your progress through your public profile.',
    actions: [
      'Share your project and explain your decisions.',
      'Use review feedback to refine your work.',
      'Bring projects, skills, and badges into your portfolio.',
    ],
    outcome: 'Evidence of what you can do, ready to share.',
  },
]
export default function HowItWorksPage() {
  return (
    <MarketingPage
      eyebrow="How it works"
      title="A clear path from learning to doing."
      description="CoLearn connects three steps: learn the foundations, apply them in a project, and make your skills visible."
    >
      <section
        className="container py-16 md:py-20"
        aria-label="Learning workflow"
      >
        {steps.map(({ icon: Icon, title, text, actions, outcome }, index) => (
          <article
            key={title}
            className="mb-5 grid gap-6 rounded-2xl border border-c-border bg-white p-6 last:mb-0 md:grid-cols-[90px_1fr_1fr] md:gap-10 md:p-8"
          >
            <div className="flex items-center gap-4 md:flex-col md:items-start">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-c-blue-soft font-mono text-sm text-c-blue">
                0{index + 1}
              </span>
              <Icon size={30} className="text-c-blue" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-4 leading-relaxed text-c-text-muted">{text}</p>
            </div>
            <div>
              <ul className="space-y-3">
                {actions.map((action) => (
                  <li
                    key={action}
                    className="flex gap-3 text-sm leading-relaxed"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-c-blue" />
                    {action}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-l-2 border-c-blue pl-4 text-sm font-medium">
                {outcome}
              </p>
            </div>
          </article>
        ))}
      </section>
    </MarketingPage>
  )
}
