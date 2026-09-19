import React from 'react'
import {
  BookOpen,
  FolderKanban,
  Users,
  MessageCircle,
  BadgeCheck,
  ChartNoAxesCombined,
} from 'lucide-react'
import { MarketingPage } from '../components/landing/MarketingPage'
import { ProductPreview } from '../components/landing/ProductPreview'

const features = [
  [
    BookOpen,
    'Learning library',
    'Give your learning a clear starting point.',
    'Browse curated books, read by chapter, and keep track of where you left off.',
  ],
  [
    FolderKanban,
    'Project workspaces',
    'Keep your team and your next task in sync.',
    'Organize tasks, assign work, and track milestones in a shared workspace.',
  ],
  [
    Users,
    'People & collaboration',
    'Find people who want to build, too.',
    'Discover learners, builders, and mentors by their skills and interests.',
  ],
  [
    MessageCircle,
    'Community discussions',
    'Work through questions together.',
    'Start a thread, exchange ideas, and share what you are learning with your peers.',
  ],
  [
    BadgeCheck,
    'Skills & portfolio',
    'Give your skills something to stand on.',
    'Bring your projects, contributions, reviews, and earned badges into a public profile.',
  ],
  [
    ChartNoAxesCombined,
    'Progress tracking',
    'See how your effort adds up.',
    'Follow your reading progress, project activity, and streaks from one dashboard.',
  ],
]
export default function FeaturesPage() {
  return (
    <MarketingPage
      eyebrow="Features"
      title="A focused toolkit for meaningful progress."
      description="Everything connects: what you read, the people you meet, the work you build, and the skills you share."
    >
      <section
        className="container py-16 md:py-20"
        aria-label="Platform features"
      >
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, tagline, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-c-border bg-c-blue-wash p-7 transition-shadow hover:shadow-md"
            >
              <Icon size={26} className="mb-5 text-c-blue" aria-hidden="true" />
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm font-medium">{tagline}</p>
              <p className="mt-2 text-sm leading-relaxed text-c-text-muted">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="container pb-16 md:pb-24">
        <div className="mb-8 max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Your progress. Your workspace.
          </h2>
          <p className="mt-4 leading-relaxed text-c-text-muted">
            A personal view of your learning and a shared view of what your team
            is building.
          </p>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <ProductPreview variant="dashboard" />
          <ProductPreview variant="project" />
        </div>
      </section>
    </MarketingPage>
  )
}
