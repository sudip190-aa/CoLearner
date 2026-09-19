import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Flag, FolderKanban, Users } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import { admin } from '../../services/api.js'

const SIGNAL_LABELS = [
  ['books', 'Finished a book'],
  ['projects', 'On a project'],
  ['badges', 'Earned a badge'],
  ['community', 'Posted or commented'],
]

export default function Overview() {
  const [state, setState] = useState({
    key: -1,
    status: 'loading',
    stats: null,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    admin
      .getAdminStats()
      .then(
        (stats) => active && setState({ key: attempt, status: 'ready', stats }),
      )
      .catch(
        () =>
          active && setState({ key: attempt, status: 'error', stats: null }),
      )
    return () => {
      active = false
    }
  }, [attempt])

  const status = state.key === attempt ? state.status : 'loading'
  const { stats } = state

  if (status === 'error')
    return (
      <EmptyState
        title="Could not load the overview"
        description="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => setAttempt((count) => count + 1)}
      />
    )
  if (status === 'loading' || !stats)
    return (
      <div aria-label="Loading overview">
        <PageHeader
          title="Admin overview"
          subtitle="A clear read on the Colearn community and its learning loop."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height="140px" />
          ))}
        </div>
      </div>
    )

  const cards = [
    {
      label: 'Total learners',
      value: stats.totals.users,
      note: `+${stats.signups30d} in 30 days`,
      icon: Users,
      to: '/admin/users',
    },
    {
      label: 'Active projects',
      value: stats.activeProjects,
      note: `${stats.totals.projects} in total`,
      icon: FolderKanban,
      to: '/admin/projects',
    },
    {
      label: 'Books in library',
      value: stats.totals.books,
      note: `+${stats.booksAdded30d} in 30 days`,
      icon: BookOpen,
      to: '/admin/books',
    },
    {
      label: 'Open reports',
      value: stats.openReports,
      note: stats.openReports ? 'Needs review' : 'All clear',
      icon: Flag,
      to: '/admin/reports',
      alert: stats.openReports > 0,
    },
  ]
  const signals = SIGNAL_LABELS.map(([key, name]) => ({
    name,
    value: Number(stats.signals[key] ?? 0),
  }))

  return (
    <div>
      <PageHeader
        title="Admin overview"
        subtitle="A clear read on the Colearn community and its learning loop."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, to, alert }) => (
          <Link key={label} to={to} data-stat={label} className="block">
            <Card className="h-full p-5 transition-shadow hover:shadow-md">
              <Icon className="h-5 w-5 text-c-blue" />
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-c-text-muted">
                {label}
              </p>
              <p className="mt-1 text-3xl font-bold text-c-text">
                {value.toLocaleString()}
              </p>
              <p
                className={`mt-2 text-xs font-semibold ${alert ? 'text-c-warning' : 'text-c-success'}`}
              >
                {note}
              </p>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-c-text">Weekly activity</h2>
              <p className="mt-1 text-xs text-c-text-muted">
                Signups and projects started
              </p>
            </div>
            <Badge variant="blue">Last 7 days</Badge>
          </div>
          <div className="mt-5 h-64" data-chart="daily">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: 'var(--c-text-muted)' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--c-text-muted)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--c-surface)',
                    color: 'var(--c-text)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: 'var(--c-text)' }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  name="Signups"
                  stroke="var(--c-blue)"
                  fill="var(--c-blue-soft)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="projects"
                  name="Projects"
                  stroke="var(--c-warning)"
                  fill="var(--c-yellow-soft)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-c-text">Engagement</h2>
          <p className="mt-1 text-xs text-c-text-muted">
            Share of all members who have done each of these
          </p>
          <div className="mt-5 h-64" data-chart="signals">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={signals}
                layout="vertical"
                margin={{ left: 10, right: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: 'var(--c-text-muted)' }}
                  unit="%"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: 'var(--c-text-muted)' }}
                  width={120}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar
                  dataKey="value"
                  name="Members"
                  fill="var(--c-blue)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold text-c-text">Most-read books</h2>
          {stats.topBooks.length ? (
            <ol className="mt-4 divide-y divide-c-border" data-list="top-books">
              {stats.topBooks.map((book, index) => (
                <li
                  key={book.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-c-text-muted">
                      {index + 1}
                    </span>
                    <Link
                      to={`/library/${book.slug}`}
                      className="font-semibold text-c-text hover:text-c-blue"
                    >
                      {book.title}
                    </Link>
                  </span>
                  <span className="text-c-text-muted">
                    {book.completions}{' '}
                    {book.completions === 1 ? 'reader' : 'readers'}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-c-text-muted">
              No reading activity yet.
            </p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-c-text">Last 30 days</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
                XP awarded
              </dt>
              <dd className="mt-1 text-2xl font-bold text-c-text">
                {stats.xpAwarded30d.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
                New members
              </dt>
              <dd className="mt-1 text-2xl font-bold text-c-text">
                {stats.signups30d.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
                Discussions
              </dt>
              <dd className="mt-1 text-2xl font-bold text-c-text">
                {Number(stats.totals.threads ?? 0).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
                Skills tracked
              </dt>
              <dd className="mt-1 text-2xl font-bold text-c-text">
                {Number(stats.totals.skills ?? 0).toLocaleString()}
              </dd>
            </div>
          </dl>
          <Button
            as={Link}
            to="/admin/reports"
            size="sm"
            variant="secondary"
            className="mt-5"
          >
            Open the report queue
          </Button>
        </Card>
      </div>
    </div>
  )
}
