import React from 'react'
import { Accordion, AccordionItem } from '../ui'

const faqs = [
  {
    value: 'free',
    title: 'Is Colearn free to use?',
    content:
      "Yes. Colearn's core features — reading books, joining projects, building your portfolio, and earning XP — are completely free. We plan to introduce optional pro features in the future, but the builder experience will always have a generous free tier.",
  },
  {
    value: 'who',
    title: 'Who is Colearn for?',
    content:
      "Colearn is built for learners aged 18–30 who want to go beyond tutorials, builders who want to ship real projects with a team, and mentors who want to give back to the community. If you've ever finished a course and felt like nothing actually changed — Colearn is for you.",
  },
  {
    value: 'experience',
    title: 'Do I need prior experience to join?',
    content:
      'Not at all. Colearn accommodates complete beginners through the LEARN pillar, and advanced engineers who want to lead or mentor through the BUILD and ENGAGE pillars. You set your own pace and learning goals during onboarding.',
  },
  {
    value: 'teams',
    title: 'How do teams form on Colearn?',
    content:
      'You can browse open projects and request to join, or start your own project and invite collaborators. The platform uses your skills and interests to surface relevant projects. Teams coordinate through the built-in Workspace with milestones, tasks, and updates.',
  },
  {
    value: 'portfolio',
    title: "What's included in the portfolio?",
    content:
      "Your Colearn portfolio is generated automatically from your activity. It displays projects you contributed to (with your commit history), skills you've verified through reading and building, badges you've earned, and peer endorsements. It's a public URL you can share with employers.",
  },
  {
    value: 'xp',
    title: 'How does the XP system work?',
    content:
      "You earn XP for completing book chapters, finishing project milestones, reviewing teammates' code, answering community questions, and maintaining your daily streak. XP unlocks higher levels and visible Builder badges. The leaderboard resets monthly so everyone has a fair shot.",
  },
]

export const FAQ = () => {
  return (
    <section className="py-14 md:py-24 bg-c-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-c-text-muted max-w-xl mx-auto">
            Everything you need to know before you start building.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" defaultValue="free">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.value}
                value={faq.value}
                title={faq.title}
              >
                {faq.content}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
