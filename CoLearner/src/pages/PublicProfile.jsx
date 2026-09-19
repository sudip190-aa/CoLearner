import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Code2,
  ExternalLink,
  Flame,
  Globe2,
  MapPin,
  Rocket,
  Share2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Chip,
  EmptyState,
  Skeleton,
  useToast,
} from '../components/ui'
import { Logo } from '../components/ui/Logo'
import { users } from '../services/api'
import { useAuthStore } from '../store/authStore'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
})
const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const formatDate = (value, full = false) =>
  value ? (full ? dayFormatter : dateFormatter).format(new Date(value)) : ''

const statusLabels = {
  idea: 'Idea',
  active: 'In progress',
  completed: 'Completed',
  archived: 'Archived',
}
const roleLabels = {
  owner: 'Project owner',
  mentor: 'Mentor',
  member: 'Contributor',
}
// Connection state (from the API) -> button look and the action a click performs.
const connectionStates = {
  none: {
    label: 'Connect',
    icon: UserPlus,
    variant: 'primary',
    action: 'connect',
  },
  pending_sent: {
    label: 'Request sent',
    icon: Clock3,
    variant: 'secondary',
    action: 'cancel',
  },
  pending_received: {
    label: 'Accept request',
    icon: Check,
    variant: 'primary',
    action: 'accept',
  },
  accepted: {
    label: 'Connected',
    icon: Check,
    variant: 'secondary',
    action: null,
  },
}

function Stat({ label, value, icon: Icon, accent = false }) {
  return (
    <div className="min-w-[118px] flex-1 border-l border-c-border px-5 first:border-l-0">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-c-text-muted">
        {Icon && (
          <Icon
            className={`h-4 w-4 ${accent ? 'text-c-yellow' : 'text-c-blue'}`}
          />
        )}
        {label}
      </div>
      <p className="mt-2 text-lg font-bold text-c-text">{value}</p>
    </div>
  )
}

function ProjectCard({ project }) {
  const isComplete = project.status === 'completed'
  return (
    <article className="overflow-hidden rounded-brand-lg border border-c-border bg-white shadow-sm">
      <div className="h-2 bg-c-blue" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-c-text-muted">
              {roleLabels[project.role] || 'Contributor'}
            </p>
            <h3 className="mt-1 text-lg font-bold text-c-text">
              {project.title}
            </h3>
          </div>
          <Badge variant={isComplete ? 'success' : 'blue'} dot>
            {statusLabels[project.status] || project.status}
          </Badge>
        </div>
        {project.summary && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-c-text-muted">
            {project.summary}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between text-xs text-c-text-muted">
          <span>{project.category}</span>
          <Link
            to={`/showcase/${project.slug}`}
            className="inline-flex items-center gap-1 font-semibold text-c-blue hover:text-c-blue-hover"
          >
            View project <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}

const intensityClasses = [
  'bg-c-blue-wash',
  'bg-blue-100',
  'bg-blue-200',
  'bg-blue-400',
  'bg-c-blue',
]
const intensityFor = (count) =>
  count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4

function Heatmap({ weeks }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] grid-cols-12 gap-1.5"
        aria-label="12-week activity"
      >
        {weeks.map((week) => (
          <span
            key={week.weekStart}
            title={`${week.activity} contributions, week of ${formatDate(week.weekStart, true)}`}
            className={`h-8 rounded-sm ${intensityClasses[intensityFor(week.activity)]}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-c-text-muted">
        <span>Less</span>
        {intensityClasses.map((className) => (
          <span key={className} className={`h-3 w-3 rounded-sm ${className}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-content px-6 py-16">
      <Skeleton width="112px" height="112px" />
      <Skeleton width="40%" height="36px" className="mt-6" />
      <Skeleton width="25%" height="16px" className="mt-3" />
      <Skeleton width="100%" height="120px" className="mt-10" />
    </div>
  )
}

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const signedInUser = useAuthStore((state) => state.user)
  // The result is tagged with the username it was fetched for, so navigating between profiles
  // shows the loading state instead of the previous person's data.
  const [result, setResult] = useState({
    username: null,
    data: null,
    error: null,
  })
  const [busy, setBusy] = useState(false)
  const isOwnProfile = Boolean(
    signedInUser?.username &&
    signedInUser.username.toLowerCase() === username.toLowerCase(),
  )

  useEffect(() => {
    let active = true
    users
      .getPortfolio(username)
      .then((data) => active && setResult({ username, data, error: null }))
      .catch((error) => active && setResult({ username, data: null, error }))
    return () => {
      active = false
    }
  }, [username])

  const current = result.username === username ? result : null
  const data = current?.data ?? null
  const error = current?.error ?? null

  if (error) {
    const notFound = error.code === 'not_found'
    return (
      <div className="min-h-screen bg-white px-6 py-16">
        <EmptyState
          title={
            notFound ? 'Profile not found' : 'We could not load this profile'
          }
          description={
            notFound
              ? 'This public profile may have moved or no longer exists.'
              : error.message
          }
          actionLabel={notFound ? 'Go to Colearn' : 'Try again'}
          actionTo={notFound ? '/' : undefined}
          onAction={notFound ? undefined : () => window.location.reload()}
        />
      </div>
    )
  }
  if (!data) return <ProfileSkeleton />

  const {
    profile: person,
    skills,
    projects,
    badges,
    books,
    heatmap,
    stats,
  } = data
  const completedProjects = projects.filter((p) => p.status === 'completed')
  const contributions = heatmap.reduce((sum, week) => sum + week.activity, 0)
  const state =
    connectionStates[person.connectionStatus] || connectionStates.none

  const share = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href)
      toast.success('Link copied', 'Profile link is ready to share')
    } catch {
      toast.info('Copy the link from your browser address bar')
    }
  }
  const connect = async () => {
    setBusy(true)
    try {
      const outcome = await users.connect(person.username, state.action)
      setResult((previous) => ({
        ...previous,
        data: {
          ...previous.data,
          profile: {
            ...previous.data.profile,
            connectionStatus: outcome.connectionStatus,
          },
        },
      }))
      if (state.action === 'connect')
        toast.success('Request sent', `We let ${person.fullName} know`)
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not update the connection')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-c-text">
      <style>{`@media print { body { background: white !important; } .public-actions, .share-profile, .public-topbar .join-button { display: none !important; } .public-print-header { display: flex !important; } .public-section { break-inside: avoid; } a { color: inherit !important; text-decoration: none !important; } } .public-print-header { display: none; }`}</style>
      <header className="public-topbar border-b border-c-border bg-white">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
          <Logo variant="full" size="sm" to="/" />
          {signedInUser ? (
            <Button
              size="sm"
              variant="outline"
              to="/dashboard"
              className="join-button"
            >
              Back to Colearn
            </Button>
          ) : (
            <Button className="join-button" to="/signup" size="sm">
              Join Colearn
            </Button>
          )}
        </div>
      </header>
      <div className="public-print-header mx-auto max-w-content items-center justify-between border-b border-c-border px-6 py-4">
        <Logo variant="full" size="sm" to="/" />
        <span className="text-xs text-c-text-muted">Public profile</span>
      </div>
      <main>
        <section className="bg-c-blue-wash">
          <div className="mx-auto flex max-w-content flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between md:py-16">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar
                src={person.avatar}
                name={person.fullName}
                size="xl"
                className="h-28 w-28 text-3xl"
              />
              <div>
                <p className="text-sm font-semibold text-c-blue">
                  {roleTitle(person.role)}
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-c-text md:text-5xl">
                  {person.fullName}
                </h1>
                <p className="mt-1 text-base text-c-text-muted">
                  @{person.username}
                </p>
                {person.headline && (
                  <p className="mt-4 max-w-2xl text-base leading-7 text-c-text">
                    {person.headline}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-c-text-muted">
                  {person.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-c-blue" />
                      {person.location}
                    </span>
                  )}
                  {person.availability && (
                    <Badge variant="success" dot>
                      {availabilityLabel(person.availability)}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <SocialLinks links={person.links} />
                </div>
              </div>
            </div>
            <div className="public-actions flex shrink-0 items-center gap-3">
              {isOwnProfile ? (
                <Button icon={Check} onClick={() => navigate('/settings')}>
                  Edit profile
                </Button>
              ) : !signedInUser ? (
                <Button
                  icon={UserPlus}
                  to={`/login?next=${encodeURIComponent(`/u/${person.username}`)}`}
                >
                  Connect
                </Button>
              ) : (
                <Button
                  variant={state.variant}
                  icon={state.icon}
                  loading={busy}
                  disabled={!state.action}
                  onClick={connect}
                >
                  {state.label}
                </Button>
              )}
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-content px-6">
          <section className="-mt-5 grid grid-cols-2 gap-y-5 rounded-brand-lg border border-c-border bg-white p-5 shadow-md sm:grid-cols-4 lg:grid-cols-7">
            <Stat
              label="Level"
              value={
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-4 border-c-yellow bg-c-yellow-soft text-xs">
                    {stats.level}
                  </span>
                  {stats.level}
                </span>
              }
              accent
            />
            <Stat label="Total XP" value={Number(stats.xp).toLocaleString()} />
            <Stat
              label="Projects shipped"
              value={completedProjects.length}
              icon={Rocket}
            />
            <Stat
              label="Books completed"
              value={stats.booksCompleted}
              icon={BookOpen}
            />
            <Stat label="Badges" value={stats.badgesCount} icon={Trophy} />
            <Stat
              label="Day streak"
              value={`${stats.streakDays} days`}
              icon={Flame}
              accent
            />
            <Stat
              label="Member since"
              value={formatDate(person.joinedAt)}
              icon={CalendarDays}
            />
          </section>
          <section className="public-section grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <SectionTitle
                eyebrow="About"
                title="A little about this learner"
              />
              <p className="mt-5 max-w-3xl text-base leading-8 text-c-text-muted">
                {person.bio || 'This member has not written a bio yet.'}
              </p>
              <SectionTitle eyebrow="Prove" title="Skills" className="mt-14" />
              <div className="mt-5 flex max-w-3xl flex-wrap gap-2">
                {skills.length ? (
                  skills.map((skill) => (
                    <Chip
                      key={skill.id}
                      title={skill.level}
                      icon={skill.isVerified ? Check : undefined}
                      className={
                        skill.isVerified
                          ? 'border-c-blue/30 bg-c-blue-soft text-c-blue'
                          : ''
                      }
                    >
                      {skill.name}
                    </Chip>
                  ))
                ) : (
                  <p className="text-sm text-c-text-muted">
                    No skills listed yet.
                  </p>
                )}
              </div>
            </div>
            <aside className="rounded-brand-lg border border-c-border bg-c-blue-wash p-5">
              <h2 className="text-lg font-bold">Learning in public</h2>
              <p className="mt-2 text-sm leading-6 text-c-text-muted">
                A profile is a record of the work, questions, and momentum
                behind the skills.
              </p>
              <div className="mt-5 space-y-3 text-sm">
                <p className="flex items-center gap-2 text-c-text">
                  <Check className="h-4 w-4 text-c-success" />
                  {completedProjects.length} shipped projects
                </p>
                <p className="flex items-center gap-2 text-c-text">
                  <Check className="h-4 w-4 text-c-success" />
                  {stats.badgesCount} earned badges
                </p>
                <p className="flex items-center gap-2 text-c-text">
                  <Check className="h-4 w-4 text-c-success" />
                  {stats.streakDays}-day learning streak
                </p>
              </div>
            </aside>
          </section>
          <section className="public-section border-t border-c-border py-14">
            <SectionTitle eyebrow="Build" title="Projects" />
            {projects.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-c-text-muted">No projects yet.</p>
            )}
          </section>
          <section className="public-section border-t border-c-border py-14">
            <SectionTitle eyebrow="Prove" title="Badges" />
            {badges.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {badges.map((badge) => (
                  <article
                    key={badge.id}
                    title={badge.description}
                    className="rounded-brand-lg border border-c-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-c-yellow-soft text-c-text">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-c-text">
                      {badge.name}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-c-text-muted">
                      Earned {formatDate(badge.earnedAt)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-c-text-muted">
                No badges earned yet.
              </p>
            )}
          </section>
          <section className="public-section border-t border-c-border py-14">
            <SectionTitle eyebrow="Learn" title="Completed books" />
            {books.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {books.map((book) => (
                  <article
                    key={book.id}
                    className="rounded-brand-lg border border-c-border bg-white p-4 shadow-sm"
                  >
                    <h3 className="text-sm font-bold leading-5 text-c-text">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-xs text-c-text-muted">
                      {book.author}
                    </p>
                    <p className="mt-2 text-xs text-c-text-muted">
                      Completed {formatDate(book.completedAt)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-c-text-muted">
                No completed books yet.
              </p>
            )}
          </section>
          <section className="public-section border-t border-c-border py-14">
            <SectionTitle eyebrow="Engage" title="Activity" />
            <div className="mt-6 rounded-brand-lg border border-c-border bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-c-text-muted">
                  Contributions over the last 12 weeks
                </p>
                <span className="text-sm font-semibold text-c-blue">
                  {contributions} contributions
                </span>
              </div>
              <Heatmap weeks={heatmap} />
            </div>
          </section>
        </div>
      </main>
      <button
        type="button"
        onClick={share}
        className="share-profile fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-c-blue px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-c-blue-hover"
      >
        <Share2 className="h-4 w-4" />
        Share profile
      </button>
    </div>
  )
}

function roleTitle(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Learner'
}
function availabilityLabel(value) {
  return (
    {
      open_to_collaboration: 'Open to collaboration',
      mentoring: 'Available for mentoring',
      focused_learning: 'Focused learning',
    }[value] || value
  )
}
function SocialLinks({ links }) {
  return (
    <>
      {links?.github && (
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          className="text-c-text-muted hover:text-c-blue"
          aria-label="GitHub"
        >
          <Code2 className="h-5 w-5" />
        </a>
      )}
      {links?.linkedin && (
        <a
          href={links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="text-c-text-muted hover:text-c-blue"
          aria-label="LinkedIn"
        >
          <Users className="h-5 w-5" />
        </a>
      )}
      {links?.website && (
        <a
          href={links.website}
          target="_blank"
          rel="noreferrer"
          className="text-c-text-muted hover:text-c-blue"
          aria-label="Website"
        >
          <Globe2 className="h-5 w-5" />
        </a>
      )}
    </>
  )
}
function SectionTitle({ eyebrow, title, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-c-blue">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-c-text md:text-3xl">
        {title}
      </h2>
    </div>
  )
}
