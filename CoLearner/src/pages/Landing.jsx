import React from 'react'
import { useAuthStore } from '../store/authStore'
import {
  ArrowRight,
  BookOpen,
  Code2,
  Users,
  BadgeCheck,
  ChartNoAxesCombined,
  FolderKanban,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '../components/ui'
import { ProductPreview } from '../components/landing/ProductPreview'

const steps = [
  [
    '01',
    BookOpen,
    'Learn with direction.',
    'Choose a book and build your foundation, one chapter at a time.',
  ],
  [
    '02',
    Code2,
    'Build with others.',
    'Apply what you learn. Find teammates and turn an idea into a working project.',
  ],
  [
    '03',
    BadgeCheck,
    'Prove what you can do.',
    'Use reviews, project contributions, and badges to make your skills visible.',
  ],
]
const features = [
  [
    BookOpen,
    'Curated learning library',
    'Find books for the skills you want to develop and keep your reading in one place.',
  ],
  [
    FolderKanban,
    'Project workspaces',
    'Organize tasks, track milestones, and give your team a shared place to build.',
  ],
  [
    Users,
    'People to build with',
    'Discover learners, collaborators, and mentors with interests that match yours.',
  ],
  [
    MessageCircle,
    'Community discussions',
    'Ask questions, share progress, and work through challenges with your peers.',
  ],
  [
    BadgeCheck,
    'Evidence of your skills',
    'Connect project work, reviews, and badges to a portfolio you can share.',
  ],
  [
    ChartNoAxesCombined,
    'Progress you can see',
    'Track your reading, project activity, and learning streaks from your dashboard.',
  ],
]

export const Landing = () => {
  const signedIn = useAuthStore((s) => s.isAuthenticated)
  return (
    <div id="top" className="min-h-screen bg-c-surface font-sans text-c-text">
      <section className="relative overflow-hidden border-b border-c-border bg-gradient-to-b from-c-blue-wash to-white pb-16 pt-16 sm:pt-24 lg:pb-24 dark:[background-image:none] dark:bg-c-bg">
        <div className="container grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <div>
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-c-blue">
              <span className="h-2 w-2 rounded-full bg-c-action" /> Learn.
              Build. Prove.
            </p>
            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-6xl lg:text-[64px]">
              Learn with purpose.
              <br />
              Build together.
              <br />
              <span className="text-c-blue">Show your skills.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed tracking-normal text-c-text-muted">
              Read curated books, build projects with others, and create a
              portfolio that shows what you can do.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                to={signedIn ? '/dashboard' : '/signup'}
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
              >
                {signedIn ? 'My Dashboard' : 'Get started'}
              </Button>
              <Button to="/how-it-works" variant="outline" size="lg">
                See how it works
              </Button>
            </div>
            <p className="mt-5 text-sm text-c-text-muted">
              For learners, builders, and mentors.
            </p>
          </div>
          <ProductPreview variant="dashboard" />
        </div>
      </section>
      <section
        id="how"
        aria-labelledby="workflow-title"
        className="scroll-mt-24 py-16 md:py-24"
      >
        <div className="container">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
            The CoLearn workflow
          </p>
          <h2
            id="workflow-title"
            className="text-3xl font-bold tracking-tight md:text-4xl"
          >
            A simple path to practical skills.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(([number, Icon, title, description]) => (
              <article key={number} className="border-t border-c-border pt-6">
                <div className="mb-6 flex items-center justify-between">
                  <Icon className="text-c-blue" size={26} aria-hidden="true" />
                  <span className="font-mono text-sm text-c-text-muted">
                    {number} /
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-relaxed text-c-text-muted">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="community"
        aria-labelledby="audience-title"
        className="scroll-mt-24 bg-c-blue-wash py-16 md:py-20"
      >
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
              Find your place
            </p>
            <h2
              id="audience-title"
              className="text-3xl font-bold tracking-tight md:text-4xl"
            >
              Your goals.
              <br />A shared community.
            </h2>
            <p className="mt-5 leading-relaxed text-c-text-muted">
              Ask questions, find collaborators, and share what you know.
            </p>
            <Button to="/our-community" variant="outline" className="mt-6">
              Explore the community
            </Button>
          </div>
          <div className="space-y-6">
            {[
              [
                'Learners',
                'Build your foundation',
                'Follow your curiosity with structured reading, practical projects, and a community to ask for help.',
              ],
              [
                'Builders',
                'Bring an idea to life',
                'Find collaborators, organize the work, and turn your next idea into a project for your portfolio.',
              ],
              [
                'Mentors',
                'Help someone move forward',
                'Share your experience, offer feedback, and help learners develop confidence in their work.',
              ],
            ].map(([audience, title, description]) => (
              <article
                key={audience}
                className="grid gap-2 border-b border-c-blue/15 pb-6 last:border-0 last:pb-0 sm:grid-cols-[100px_1fr]"
              >
                <span className="text-sm font-semibold text-c-blue">
                  {audience}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-c-text-muted">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="features"
        aria-labelledby="features-title"
        className="scroll-mt-24 py-16 md:py-24"
      >
        <div className="container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
              Your toolkit
            </p>
            <h2
              id="features-title"
              className="text-3xl font-bold tracking-tight md:text-4xl"
            >
              The essentials, in one place.
            </h2>
            <p className="mt-4 text-lg text-c-text-muted">
              Learn, collaborate, and track the work that matters.
            </p>
            <Button
              to="/features"
              variant="ghost"
              className="mt-4"
              icon={ArrowRight}
              iconPosition="right"
            >
              Explore all features
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([Icon, title, description]) => (
              <article
                key={title}
                className="rounded-2xl border border-c-border p-7"
              >
                <div className="mb-5 inline-flex rounded-xl bg-c-blue-wash p-3 text-c-blue">
                  <Icon size={23} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-c-text-muted">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="projects"
        aria-labelledby="projects-title"
        className="scroll-mt-24 border-y border-c-border bg-c-blue-wash py-16 md:py-20"
      >
        <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <ProductPreview variant="project" />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
              Built around real work
            </p>
            <h2
              id="projects-title"
              className="text-3xl font-bold tracking-tight md:text-4xl"
            >
              Make something useful.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-c-text-muted">
              Plan tasks, track milestones, and build with your team in a shared
              workspace.
            </p>
            <p className="mt-4 leading-relaxed text-c-text-muted">
              Keep a record of your contributions, from the first task to the
              finished project.
            </p>
            <Button
              to="/projects"
              variant="outline"
              className="mt-7"
              icon={ArrowUpRight}
              iconPosition="right"
            >
              Explore projects
            </Button>
            <p className="mt-3 text-xs text-c-text-muted">
              Sign in to browse projects and join a team.
            </p>
          </div>
        </div>
      </section>
      <section
        id="about"
        aria-labelledby="about-title"
        className="scroll-mt-24 py-16 md:py-20"
      >
        <div className="container grid gap-6 md:grid-cols-[1fr_2fr] md:gap-20">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
              About CoLearn
            </p>
            <h2 id="about-title" className="text-2xl font-bold tracking-tight">
              Built for learning
              <br />
              by doing.
            </h2>
            <Button
              to="/about"
              variant="ghost"
              className="mt-4"
              icon={ArrowRight}
              iconPosition="right"
            >
              About CoLearn
            </Button>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-c-text-muted">
            CoLearn connects learning with practice. We bring people, resources,
            and projects together to help you develop useful skills and show
            your work.
          </p>
        </div>
      </section>
      <section className="px-4 pb-16 md:pb-20" aria-labelledby="signup-title">
        <div className="mx-auto max-w-[1152px] rounded-3xl bg-c-ink px-6 py-14 text-center sm:px-12 md:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
            Your next chapter starts here
          </p>
          <h2
            id="signup-title"
            className="text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Your next skill starts
            <br className="hidden sm:block" /> with a first step.
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-slate-300">
            Join CoLearn and turn your curiosity into a project.
          </p>
          <Button
            to={signedIn ? '/dashboard' : '/signup'}
            size="lg"
            variant="yellow"
            className="mt-8"
            icon={ArrowRight}
            iconPosition="right"
          >
            {signedIn ? 'My Dashboard' : 'Create your CoLearn account'}
          </Button>
        </div>
      </section>
    </div>
  )
}
export default Landing
