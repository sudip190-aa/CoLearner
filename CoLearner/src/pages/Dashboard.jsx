import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  FolderKanban,
  MessageCircle,
  Plus,
  Zap,
} from 'lucide-react'
import {
  Avatar,
  Button,
  EmptyState,
  ProgressBar,
  Skeleton,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { BookCover } from '../components/books/BookCover'
import ProjectCard from '../components/projects/ProjectCard'
import { dashboard, users } from '../services/api.js'
import { formatRelative } from '../lib/formatters.js'
import { useAuthStore } from '../store/authStore.js'

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      <div>
        <Skeleton width="260px" height="38px" />
        <Skeleton className="mt-3" width="180px" height="18px" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} height="104px" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Skeleton height="180px" />
          <Skeleton height="260px" />
        </div>
        <div className="space-y-6">
          <Skeleton height="220px" />
          <Skeleton height="240px" />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children, to }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-c-text">{children}</h2>
      {to && (
        <Link
          to={to}
          className="text-sm font-semibold text-c-blue hover:text-c-blue-hover"
        >
          View all
        </Link>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, children, accent = 'blue' }) {
  return (
    <div className="rounded-brand border border-c-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-c-text-muted">
        <Icon
          className={`h-4 w-4 ${accent === 'yellow' ? 'text-c-yellow' : 'text-c-blue'}`}
        />
        {label}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const toast = useToast()
  const me = useAuthStore((state) => state.user)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [connectedIds, setConnectedIds] = useState(() => new Set())
  const [connecting, setConnecting] = useState(null)
  useEffect(() => {
    let active = true
    dashboard
      .getDashboard()
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError('We could not load your dashboard.')
      })
    return () => {
      active = false
    }
  }, [])
  if (error)
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={error}
        actionLabel="Try again"
        onAction={() => window.location.reload()}
      />
    )
  if (!data) return <DashboardSkeleton />
  const {
    stats,
    reading,
    projects,
    activity,
    badges,
    weeklyXp,
    suggestions,
    trending,
  } = data
  const firstName = (me?.fullName || me?.username || 'there').split(' ')[0]
  const connectWith = async (person) => {
    setConnecting(person.id)
    try {
      await users.connectUser(person.username)
      setConnectedIds((current) => new Set(current).add(person.id))
      toast.success('Request sent', `We let ${person.fullName} know`)
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not send the request')
    } finally {
      setConnecting(null)
    }
  }
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
  const weekTotal = weeklyXp.reduce((sum, day) => sum + day.xp, 0)
  return (
    <div className="space-y-8">
      <PageHeader title={`${greeting()}, ${firstName}`} subtitle={date} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Award} label="XP" accent="yellow">
          <div className="text-2xl font-bold text-c-text" data-stat="xp">
            {stats.xp.toLocaleString()}{' '}
            <span className="text-sm font-medium text-c-text-muted">
              · Level {stats.level}
            </span>
          </div>
          <ProgressBar
            value={stats.levelProgress}
            color="yellow"
            size="sm"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-c-text-muted">
            {(stats.nextLevelXp - stats.xp).toLocaleString()} XP to level{' '}
            {stats.level + 1}
          </p>
        </StatCard>
        <StatCard icon={Flame} label="Streak" accent="yellow">
          <div className="text-2xl font-bold text-c-text" data-stat="streak">
            {stats.streakDays}{' '}
            <span className="text-sm font-medium text-c-text-muted">
              {stats.streakDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </StatCard>
        <StatCard icon={FolderKanban} label="Projects active">
          <div className="text-2xl font-bold text-c-text" data-stat="projects">
            {stats.activeProjects}
          </div>
        </StatCard>
        <StatCard icon={BookOpen} label="Books in progress">
          <div className="text-2xl font-bold text-c-text" data-stat="books">
            {stats.booksInProgress}
          </div>
        </StatCard>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle>Continue reading</SectionTitle>
            {reading ? (
              <article
                data-section="reading"
                className="flex flex-col gap-5 rounded-brand border border-c-border bg-white p-5 shadow-sm sm:flex-row"
              >
                <div className="h-40 w-full overflow-hidden rounded-brand sm:w-28">
                  <BookCover book={reading.book} compact className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-c-blue">
                    {reading.book.category}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-c-text">
                    {reading.book.title}
                  </h3>
                  <p className="mt-1 text-sm text-c-text-muted">
                    {reading.chapter
                      ? `Chapter ${reading.chapter.number}: ${reading.chapter.title}`
                      : 'Pick up where you left off'}
                  </p>
                  <ProgressBar
                    value={reading.progress}
                    size="sm"
                    showValue
                    className="mt-5"
                  />
                  <Button
                    as={Link}
                    to={`/read/${reading.book.slug}`}
                    size="sm"
                    className="mt-4 whitespace-nowrap"
                  >
                    Resume <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ) : (
              <EmptyState
                title="Nothing in progress yet"
                description="Choose a book and start your next learning session."
                actionLabel="Browse library"
                actionTo="/library"
              />
            )}
          </section>
          <section>
            <SectionTitle to="/projects">Your projects</SectionTitle>
            {projects.length ? (
              <div className="grid gap-4 md:grid-cols-2" data-section="projects">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                <Link
                  to="/projects/new"
                  className="flex min-h-24 items-center justify-center gap-2 rounded-brand border border-dashed border-c-blue/40 bg-c-blue-wash/40 text-sm font-semibold text-c-blue hover:bg-c-blue-soft"
                >
                  <Plus className="h-4 w-4" />
                  New project
                </Link>
              </div>
            ) : (
              <EmptyState
                title="Your first project starts here"
                description="Build with peers and turn your progress into portfolio proof."
                actionLabel="Create a project"
                actionTo="/projects/new"
              />
            )}
          </section>
          <section>
            <SectionTitle>Recent XP</SectionTitle>
            {activity.length ? (
              <div
                data-section="activity"
                className="divide-y divide-c-border rounded-brand border border-c-border bg-white shadow-sm"
              >
                {activity.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-c-yellow-soft text-c-text">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-c-text">
                        {event.text}
                      </p>
                      <p className="mt-0.5 text-xs text-c-text-muted">
                        {formatRelative(event.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-c-success">
                      +{event.amount} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No XP yet"
                description="Read a chapter, finish a task or start a discussion to earn your first XP."
              />
            )}
          </section>
        </div>
        <aside className="min-w-0 space-y-8">
          <section>
            <SectionTitle to="/badges">Your badges</SectionTitle>
            {badges.length ? (
              <div className="grid grid-cols-2 gap-3" data-section="badges">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-brand border border-c-border bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-c-yellow-soft text-c-text">
                      <Award className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-c-text">
                      {badge.name}
                    </p>
                    <p className="mt-1 text-xs text-c-text-muted">
                      +{badge.xpReward} XP
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No badges yet"
                description="Your first one is closer than you think."
                actionLabel="See all badges"
                actionTo="/badges"
              />
            )}
          </section>
          <section>
            <SectionTitle>
              Weekly XP{weekTotal ? ` · ${weekTotal.toLocaleString()}` : ''}
            </SectionTitle>
            <div
              data-section="weekly-xp"
              className="h-52 rounded-brand border border-c-border bg-white p-4 shadow-sm"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyXp}
                  margin={{ top: 8, right: 0, left: -24, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--c-border)" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: 'var(--c-text-muted)' }}
                  />
                  <ChartTooltip cursor={{ fill: 'var(--c-blue-wash)' }} />
                  <Bar
                    dataKey="xp"
                    fill="var(--c-blue)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section>
            <SectionTitle to="/people">People to connect with</SectionTitle>
            {suggestions.length ? (
              <div className="space-y-3" data-section="suggestions">
                {suggestions.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 rounded-brand border border-c-border bg-white p-3 shadow-sm"
                  >
                    <Avatar
                      src={person.avatar}
                      name={person.fullName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/u/${person.username}`}
                        className="block truncate text-sm font-semibold text-c-text hover:text-c-blue"
                      >
                        {person.fullName}
                      </Link>
                      <p className="truncate text-xs text-c-text-muted">
                        {person.sharedSkills?.length
                          ? `Shares ${person.sharedSkills.slice(0, 2).join(' · ')}`
                          : person.headline || `@${person.username}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        connectedIds.has(person.id) || connecting === person.id
                      }
                      onClick={() => connectWith(person)}
                    >
                      {connectedIds.has(person.id) ? 'Requested' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-brand border border-dashed border-c-border bg-white p-4 text-sm text-c-text-muted">
                No suggestions right now. Browse{' '}
                <Link to="/people" className="font-semibold text-c-blue">
                  everyone
                </Link>
                .
              </p>
            )}
          </section>
          <section>
            <SectionTitle to="/community">Trending in community</SectionTitle>
            {trending.length ? (
              <div
                data-section="trending"
                className="divide-y divide-c-border rounded-brand border border-c-border bg-white shadow-sm"
              >
                {trending.map((thread) => (
                  <Link
                    key={thread.id}
                    to={`/community/${thread.slug}`}
                    className="block p-4 hover:bg-c-blue-wash"
                  >
                    <p className="text-sm font-semibold leading-5 text-c-text">
                      {thread.title}
                    </p>
                    <p className="mt-2 flex items-center gap-3 text-xs text-c-text-muted">
                      <span>{thread.votes} votes</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-c-blue" />
                        {thread.commentCount}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-brand border border-dashed border-c-border bg-white p-4 text-sm text-c-text-muted">
                No discussions yet.{' '}
                <Link to="/community/new" className="font-semibold text-c-blue">
                  Start one
                </Link>
                .
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
