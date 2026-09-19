import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Focus,
  FolderKanban,
  LayoutGrid,
  List,
  MessageCircle,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react'
import {
  Avatar,
  Button,
  EmptyState,
  ProgressBar,
  Skeleton,
} from '../components/ui'
import LibraryBookCover from '../components/books/LibraryBookCover'
import { dashboard } from '../services/api'
import { formatRelative } from '../lib/formatters'
import { useAuthStore } from '../store/authStore'
import { useNavigationCounts } from '../hooks/useNavigationCounts'
import { useMessageInbox } from '../hooks/useMessages'

const panel = 'rounded-3xl border border-c-border/80 bg-c-surface p-5 sm:p-6'
const statusNames = {
  idea: 'Idea',
  active: 'In progress',
  completed: 'Completed',
  archived: 'Archived',
}
function Heading({ title, detail, to, label = 'View all' }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="!text-base !font-semibold !tracking-tight">{title}</h2>
        {detail && (
          <p className="mt-1 text-xs leading-5 text-c-text-muted">{detail}</p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-c-blue"
        >
          {label}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  )
}
function ProjectItem({ project, compact }) {
  return (
    <Link
      to={`/projects/${project.slug}/workspace`}
      className={`group block rounded-2xl border border-c-border bg-c-surface transition hover:border-c-blue/40 hover:shadow-sm ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-c-blue-soft p-2.5 text-c-blue">
          <FolderKanban size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold group-hover:text-c-blue">
            {project.title}
          </h3>
          <p className="mt-1 text-[11px] text-c-text-muted">
            {project.category || 'Project'} ·{' '}
            {project.memberCount || project.members?.length || 1} members
          </p>
        </div>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-c-text-muted group-hover:text-c-blue"
        />
      </div>
      {!compact && (
        <p className="mt-4 line-clamp-2 min-h-10 text-xs leading-5 text-c-text-muted">
          {project.summary ||
            'A space to build, collaborate, and put your skills to work.'}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between text-[11px]">
        <span
          className={`rounded-full px-2.5 py-1 font-medium ${project.status === 'completed' ? 'bg-c-success/10 text-c-success' : 'bg-c-blue-wash text-c-text-muted'}`}
        >
          {statusNames[project.status] || project.status}
        </span>
        <span className="font-semibold text-c-text-muted">
          {project.taskProgress?.percent || 0}%
        </span>
      </div>
      <ProgressBar
        size="sm"
        value={project.taskProgress?.percent || 0}
        className="mt-3"
      />
    </Link>
  )
}

export default function Dashboard() {
  const me = useAuthStore((state) => state.user)
  const [params, setParams] = useSearchParams()
  const [focus, setFocus] = useState(false)
  const [layout, setLayout] = useState('grid')
  const [taskFilter, setTaskFilter] = useState('all')
  const [openedAt] = useState(Date.now)
  const inbox = useMessageInbox()
  const navigation = useNavigationCounts()
  const query = useQuery({
    queryKey: ['dashboard', me?.id],
    queryFn: dashboard.getDashboard,
    enabled: !!me?.id,
  })
  const change = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        value ? next.set(key, value) : next.delete(key)
        return next
      },
      { replace: true },
    )
  const view = ['today', 'projects', 'activity'].includes(params.get('view'))
    ? params.get('view')
    : 'today'
  const search = params.get('q') || ''
  const status = params.get('status') || ''
  const sort = params.get('sort') || 'recent'
  const period = params.get('period') || '7'
  const clear = () => setParams({ view }, { replace: true })
  if (query.isPending)
    return (
      <div className="space-y-7">
        <Skeleton height="100px" />
        <Skeleton height="170px" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton height="320px" />
          <Skeleton height="320px" />
        </div>
      </div>
    )
  if (query.isError)
    return (
      <EmptyState
        title="Your workspace is taking a moment"
        description="We couldn't load your dashboard. Please try again."
        actionLabel="Try again"
        onAction={() => query.refetch()}
      />
    )
  const {
    stats,
    reading,
    projects,
    tasks = [],
    activity,
    badges,
    weeklyXp,
    trending,
  } = query.data
  const firstName = (me?.fullName || me?.username || 'there').split(' ')[0]
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-CA')
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate < today)
  const visibleTasks = tasks.filter(
    (task) =>
      taskFilter === 'all' ||
      (taskFilter === 'overdue'
        ? task.dueDate && task.dueDate < today
        : ['high', 'urgent'].includes(task.priority)),
  )
  const visibleProjects = projects
    .filter(
      (p) =>
        (!status || p.status === status) &&
        `${p.title} ${p.summary} ${p.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : sort === 'progress'
          ? (b.taskProgress?.percent || 0) - (a.taskProgress?.percent || 0)
          : String(b.createdAt).localeCompare(String(a.createdAt)),
    )
  const visibleActivity = activity.filter(
    (e) =>
      e.text.toLowerCase().includes(search.toLowerCase()) &&
      (period === 'all' ||
        openedAt - new Date(e.createdAt).getTime() <=
          Number(period) * 86400000),
  )
  const totalXp = weeklyXp.reduce((sum, day) => sum + day.xp, 0)
  const maxXp = Math.max(1, ...weeklyXp.map((day) => day.xp))
  const contacts = inbox.data || []
  const unread = navigation.data?.messages || 0
  return (
    <div className="mx-auto max-w-6xl space-y-6" data-dashboard="workspace">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-c-text-muted">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="mt-2 !text-3xl !font-bold !tracking-tight sm:!text-4xl">
            {greeting}, {firstName}
            <span className="text-c-blue">.</span>
          </h1>
          <p className="mt-2 text-sm text-c-text-muted">
            Your learning, projects, and people. All in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={focus ? 'secondary' : 'outline'}
            icon={Focus}
            onClick={() => setFocus(!focus)}
            aria-pressed={focus}
          >
            {focus ? 'Exit focus' : 'Focus view'}
          </Button>
          <Button to="/projects/new" icon={Plus}>
            New project
          </Button>
        </div>
      </header>
      {!focus && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-c-border">
          <nav className="flex gap-6" aria-label="Dashboard views">
            {[
              ['today', 'Today'],
              ['projects', 'Projects'],
              ['activity', 'Activity'],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-current={view === key ? 'page' : undefined}
                onClick={() => setParams({ view: key }, { replace: true })}
                className={`relative pb-4 text-sm font-semibold transition ${view === key ? 'text-c-blue after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-c-action' : 'text-c-text-muted hover:text-c-text'}`}
              >
                {label}
                {key === 'projects' && (
                  <span className="ml-2 rounded-md bg-c-blue-soft px-1.5 py-0.5 text-[10px] text-c-blue">
                    {projects.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <Link
            to="/messages"
            className="mb-3 flex items-center gap-2 text-xs font-medium text-c-text-muted"
          >
            <MessageCircle size={15} />
            {unread ? `${unread} unread messages` : 'Your conversations'}
            <ChevronRight size={13} />
          </Link>
        </div>
      )}
      {(view === 'today' || focus) && (
        <>
          {!focus && (
            <section
              className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
              aria-label="Your progress"
            >
              {[
                {
                  icon: Zap,
                  label: 'Total XP',
                  value: stats.xp.toLocaleString(),
                  note: `Level ${stats.level}`,
                  stat: 'xp',
                },
                {
                  icon: Flame,
                  label: 'Current streak',
                  value: `${stats.streakDays} ${stats.streakDays === 1 ? 'day' : 'days'}`,
                  note: 'Learning streak',
                  stat: 'streak',
                },
                {
                  icon: FolderKanban,
                  label: 'Active projects',
                  value: stats.activeProjects,
                  note: 'In progress',
                  stat: 'projects',
                },
                {
                  icon: BookOpen,
                  label: 'Reading',
                  value: stats.booksInProgress,
                  note: 'Books in progress',
                  stat: 'books',
                },
              ].map(({ icon: Icon, ...item }) => (
                <div
                  key={item.stat}
                  className="flex items-center gap-3 rounded-2xl border border-c-border/80 bg-c-surface p-4 sm:gap-4 sm:p-5"
                >
                  <span
                    className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:flex ${item.stat === 'xp' ? 'bg-c-yellow-soft text-c-text' : 'bg-c-blue-soft text-c-blue'}`}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-c-text-muted">
                      {item.label}
                    </p>
                    <div
                      className="mt-1 text-2xl font-bold tracking-tight tabular-nums"
                      data-stat={item.stat}
                    >
                      {item.value}
                    </div>
                    <p className="mt-0.5 text-[10px] text-c-text-muted">
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          )}
          <div
            className={`grid items-start gap-6 ${focus ? '' : 'xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)]'}`}
          >
            <div className="min-w-0 space-y-6">
              <section
                className="relative isolate overflow-hidden rounded-3xl bg-[#18365e] p-6 text-white sm:p-8"
                data-section="reading"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full border-[50px] border-white/[0.035]"
                />
                <div className="flex items-center gap-5 sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-c-yellow" />
                      {reading ? 'Continue your chapter' : 'Your next chapter'}
                    </p>
                    <h2 className="max-w-md !text-2xl !font-semibold !leading-snug !tracking-tight !text-white sm:!text-[28px]">
                      {reading
                        ? reading.book.title
                        : 'A little curiosity. A new possibility.'}
                    </h2>
                    <p className="mt-3 line-clamp-2 max-w-sm text-xs leading-6 text-white/65">
                      {reading?.chapter
                        ? reading.chapter.title
                        : reading
                          ? 'Pick up where you left off.'
                          : 'Find a book. Learn something new. Put it to work.'}
                    </p>
                    {reading && (
                      <div className="mt-5 flex max-w-sm items-center gap-3">
                        <ProgressBar
                          value={reading.progress}
                          size="sm"
                          className="flex-1"
                          color="yellow"
                        />
                        <span className="text-xs font-medium text-white/80">
                          {Math.round(reading.progress)}%
                        </span>
                      </div>
                    )}
                    <Button
                      variant="yellow"
                      className="mt-6 !rounded-xl !text-xs"
                      to={reading ? `/read/${reading.book.slug}` : '/library'}
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      {reading ? 'Continue learning' : 'Explore the library'}
                    </Button>
                  </div>
                  <div className="hidden shrink-0 sm:block">
                    {reading ? (
                      <LibraryBookCover
                        book={reading.book}
                        className="h-44 w-28 -rotate-6 rounded-md shadow-xl"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="relative flex h-36 w-28 -rotate-6 items-center justify-center rounded-r-2xl border-l-8 border-c-blue bg-white/10 shadow-xl"
                      >
                        <BookOpen
                          size={44}
                          strokeWidth={1}
                          className="text-white/80"
                        />
                        <span className="absolute -top-2 right-4 h-9 w-4 rounded-b-sm bg-c-yellow" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
              <section className={panel}>
                <Heading title="Your tasks" to="/projects" label="Workspace" />
                <div
                  className="mb-4 flex flex-wrap gap-2"
                  aria-label="Task filters"
                >
                  {[
                    ['all', 'All tasks'],
                    [
                      'overdue',
                      `Overdue${overdue.length ? ` · ${overdue.length}` : ''}`,
                    ],
                    ['priority', 'High priority'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTaskFilter(key)}
                      aria-pressed={taskFilter === key}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${taskFilter === key ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted hover:bg-c-blue-wash'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {visibleTasks.length ? (
                  <div className="divide-y divide-c-border">
                    {visibleTasks.slice(0, 4).map((task) => (
                      <Link
                        key={task.id}
                        to={`/projects/${task.project.slug}/workspace`}
                        className="group flex items-center gap-3 py-3.5"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-c-yellow' : 'bg-c-blue/40'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium group-hover:text-c-blue">
                            {task.title}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-c-text-muted">
                            {task.project.title}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] ${task.dueDate && task.dueDate < today ? 'text-c-danger' : 'text-c-text-muted'}`}
                        >
                          {task.dueDate
                            ? new Date(
                                `${task.dueDate}T12:00:00`,
                              ).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'No due date'}
                        </span>
                        <ChevronRight size={15} className="text-c-text-muted" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl bg-c-blue-wash/60 p-5">
                    <CheckCircle2 size={25} className="shrink-0 text-c-blue" />
                    <div>
                      <p className="text-sm font-semibold">
                        {taskFilter === 'all'
                          ? 'You are all caught up'
                          : 'Nothing here right now.'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-c-text-muted">
                        {taskFilter === 'all'
                          ? 'Your next task will appear here.'
                          : 'Try a different filter to see your other tasks.'}
                      </p>
                    </div>
                  </div>
                )}
                {visibleTasks.length > 4 && (
                  <p className="mt-3 text-xs text-c-text-muted">
                    Showing 4 of {visibleTasks.length} tasks. Open your
                    workspace for more.
                  </p>
                )}
              </section>
              {!focus && (
                <section>
                  <Heading title="Your projects" to="/projects" />
                  <div
                    className="grid gap-4 sm:grid-cols-2"
                    data-section="projects"
                  >
                    {projects.slice(0, 2).map((project) => (
                      <ProjectItem key={project.id} project={project} compact />
                    ))}
                    {!projects.length && (
                      <Link
                        to="/projects/new"
                        className="col-span-full flex items-center justify-between rounded-2xl border border-dashed border-c-blue/30 p-6 text-sm text-c-blue"
                      >
                        Start your first project
                        <Plus size={20} />
                      </Link>
                    )}
                  </div>
                </section>
              )}
            </div>
            <aside className={`min-w-0 space-y-6 ${focus ? 'hidden' : ''}`}>
              {!focus && (
                <>
                  <section className={panel}>
                    <Heading title="Your circle" to="/messages" label="Inbox" />
                    {inbox.isPending && <Skeleton height="80px" />}
                    {inbox.isError && (
                      <p role="alert" className="text-sm text-c-text-muted">
                        Connections couldn't load.{' '}
                        <button
                          onClick={() => inbox.refetch()}
                          className="text-c-blue"
                        >
                          Retry
                        </button>
                      </p>
                    )}
                    {!inbox.isPending && !inbox.isError && !contacts.length && (
                      <div className="rounded-2xl bg-c-blue-wash p-5 text-center">
                        <MessageCircle
                          size={26}
                          className="mx-auto text-c-blue"
                        />
                        <p className="mt-3 text-sm font-semibold">
                          Better together
                        </p>
                        <p className="mt-2 text-xs leading-5 text-c-text-muted">
                          Connect with a peer to start your first conversation.
                        </p>
                        <Link
                          to="/people"
                          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-c-blue"
                        >
                          Explore people <ArrowRight size={14} />
                        </Link>
                      </div>
                    )}
                    <div className="space-y-1">
                      {contacts.slice(0, 4).map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center gap-3 rounded-xl px-1 py-3 hover:bg-c-blue-wash"
                        >
                          <Link
                            to={`/u/${person.username}`}
                            aria-label={`View ${person.full_name} profile`}
                          >
                            <Avatar
                              name={person.full_name}
                              src={person.avatar}
                              size="md"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">
                              {person.full_name || person.username}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-c-text-muted">
                              {person.last_message ||
                                person.headline ||
                                'Start a conversation'}
                            </p>
                          </div>
                          <Link
                            to={`/messages?to=${person.id}`}
                            aria-label={`Message ${person.full_name}`}
                            className="rounded-lg p-2 hover:bg-c-blue-soft"
                          >
                            {person.unread_count > 0 ? (
                              <span className="rounded-full bg-c-action px-2 py-1 text-[10px] text-white">
                                {person.unread_count}
                              </span>
                            ) : (
                              <MessageCircle
                                size={16}
                                className="text-c-blue"
                              />
                            )}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className={panel} data-section="weekly-xp">
                    <Heading
                      title="This week"
                      to="/leaderboard"
                      label="Leaderboard"
                    />
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {totalXp.toLocaleString()}
                      </span>
                      <span className="text-xs text-c-text-muted">
                        XP this week
                      </span>
                    </div>
                    <div
                      className="mt-5 flex h-24 items-end gap-2"
                      role="img"
                      aria-label={weeklyXp
                        .map((d) => `${d.day}: ${d.xp} XP`)
                        .join(', ')}
                    >
                      {weeklyXp.map((day, i) => (
                        <div
                          key={day.date}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                        >
                          <div
                            title={`${day.day}: ${day.xp} XP`}
                            className={`w-full max-w-7 rounded-md ${i === 6 ? 'bg-c-action' : 'bg-c-blue-soft'}`}
                            style={{
                              height: `${Math.max(5, (day.xp / maxXp) * 70)}px`,
                            }}
                          />
                          <span className="text-[9px] text-c-text-muted">
                            {day.day.slice(0, 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-c-border pt-4">
                      <div className="mb-2 flex justify-between text-[11px]">
                        <span className="font-medium">Level {stats.level}</span>
                        <span className="text-c-text-muted">
                          {Math.max(
                            0,
                            stats.nextLevelXp - stats.xp,
                          ).toLocaleString()}{' '}
                          XP to go
                        </span>
                      </div>
                      <ProgressBar
                        value={stats.levelProgress}
                        size="sm"
                        color="yellow"
                      />
                    </div>
                  </section>
                </>
              )}
            </aside>
          </div>
        </>
      )}
      {!focus && view !== 'today' && (
        <>
          <section
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-c-border bg-c-surface p-4"
            aria-label={`${view} filters`}
          >
            <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl bg-c-blue-wash px-3 py-2.5">
              <Search size={17} className="text-c-text-muted" />
              <input
                aria-label={`Search ${view}`}
                value={search}
                onChange={(e) => change('q', e.target.value)}
                placeholder={`Search your ${view}…`}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            {view === 'projects' ? (
              <>
                <label className="flex items-center gap-2 text-c-text-muted">
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label="Project status"
                    value={status}
                    onChange={(e) => change('status', e.target.value)}
                    className="rounded-lg border border-c-border bg-c-surface px-3 py-2.5 text-xs text-c-text"
                  >
                    <option value="">All statuses</option>
                    {Object.entries(statusNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-c-text-muted">
                  <ArrowDownWideNarrow size={16} />
                  <select
                    aria-label="Sort projects"
                    value={sort}
                    onChange={(e) => change('sort', e.target.value)}
                    className="rounded-lg border border-c-border bg-c-surface px-3 py-2.5 text-xs text-c-text"
                  >
                    <option value="recent">Newest first</option>
                    <option value="name">Name A–Z</option>
                    <option value="progress">Most progress</option>
                  </select>
                </label>
                <div className="flex rounded-lg border border-c-border p-1">
                  {[
                    ['grid', LayoutGrid],
                    ['list', List],
                  ].map(([key, Icon]) => (
                    <button
                      key={key}
                      aria-label={`${key} layout`}
                      aria-pressed={layout === key}
                      onClick={() => setLayout(key)}
                      className={`rounded-md p-1.5 ${layout === key ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted'}`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <select
                aria-label="Activity period"
                value={period}
                onChange={(e) => change('period', e.target.value)}
                className="rounded-lg border border-c-border bg-c-surface px-3 py-2.5 text-xs"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="all">All recent activity</option>
              </select>
            )}
            {(search || status || sort !== 'recent' || period !== '7') && (
              <button
                onClick={clear}
                className="flex items-center gap-1 text-xs font-medium text-c-blue"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </section>
          {view === 'projects' ? (
            <section>
              <div className="mb-4 flex justify-between">
                <p className="text-xs text-c-text-muted" role="status">
                  {visibleProjects.length} of {projects.length} projects
                </p>
                <Link
                  className="text-xs font-semibold text-c-blue"
                  to="/projects"
                >
                  Explore all projects{' '}
                  <ArrowUpRight size={13} className="inline" />
                </Link>
              </div>
              {visibleProjects.length ? (
                <div
                  className={`grid gap-4 ${layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : ''}`}
                >
                  {visibleProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      compact={layout === 'list'}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="A clean slate"
                  description={
                    search || status
                      ? 'No projects match these filters. Clear them to see everything.'
                      : 'Create a project or join a team to start building.'
                  }
                  actionLabel={
                    search || status ? 'Clear filters' : 'Explore projects'
                  }
                  onAction={search || status ? clear : undefined}
                  actionTo={search || status ? undefined : '/projects'}
                />
              )}
            </section>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
              <section className={panel} data-section="activity">
                <Heading
                  title="Your progress, in moments"
                  detail={`${visibleActivity.length} matching events from your latest 50.`}
                />
                {visibleActivity.length ? (
                  <div className="divide-y divide-c-border">
                    {visibleActivity.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 py-4"
                      >
                        <span className="rounded-xl bg-c-yellow-soft p-2.5">
                          <Zap size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium capitalize">
                            {event.text}
                          </p>
                          <p className="mt-1 text-xs text-c-text-muted">
                            {formatRelative(event.createdAt)}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs font-bold text-c-blue">
                          +{event.amount} XP
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-c-text-muted">
                    No activity matches this view. Try a wider date range.
                  </p>
                )}
              </section>
              <aside className="space-y-6">
                <section className={panel} data-section="badges">
                  <Heading
                    title="Milestones worth keeping"
                    to="/badges"
                    label="All badges"
                  />
                  {badges.length ? (
                    <div className="space-y-4">
                      {badges.slice(0, 4).map((badge) => (
                        <div key={badge.id} className="flex items-center gap-3">
                          <span className="rounded-xl bg-c-yellow-soft p-3">
                            <Award size={19} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold">
                              {badge.name}
                            </p>
                            <p className="mt-1 text-xs text-c-text-muted">
                              +{badge.xpReward} XP earned
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-c-text-muted">
                      Every chapter and finished task brings your first badge
                      closer.
                    </p>
                  )}
                </section>
                <section className={panel}>
                  <Heading title="Around the community" to="/community" />
                  {trending.length ? (
                    trending.slice(0, 3).map((thread) => (
                      <Link
                        key={thread.id}
                        to={`/community/${thread.slug}`}
                        className="block border-b border-c-border py-3 first:pt-0 last:border-0 last:pb-0"
                      >
                        <p className="text-sm font-medium hover:text-c-blue">
                          {thread.title}
                        </p>
                        <p className="mt-2 text-[11px] text-c-text-muted">
                          {thread.votes} votes · {thread.commentCount} replies
                        </p>
                      </Link>
                    ))
                  ) : (
                    <Link to="/community/new" className="text-sm text-c-blue">
                      Start a conversation{' '}
                      <ArrowRight className="inline" size={14} />
                    </Link>
                  )}
                </section>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  )
}
