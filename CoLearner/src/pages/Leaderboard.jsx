import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Flame, Trophy } from 'lucide-react'
import {
  Avatar,
  EmptyState,
  Select,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
} from '../components/ui'
import { game } from '../services/api.js'
import { useAuthStore } from '../store/authStore'

const roleOptions = [
  { value: '', label: 'All roles' },
  { value: 'learner', label: 'Learners' },
  { value: 'builder', label: 'Builders' },
  { value: 'mentor', label: 'Mentors' },
]
const periods = {
  week: { label: 'This week', score: 'XP this week', detail: 'Last 7 days' },
  month: {
    label: 'This month',
    score: 'XP this month',
    detail: 'Last 30 days',
  },
  all: { label: 'All time', score: 'Total XP', detail: 'All-time progress' },
}

function LeaderboardSkeleton() {
  return (
    <div
      className="divide-y divide-c-border/70 px-4 sm:px-6"
      aria-label="Loading rankings"
      aria-busy="true"
    >
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="flex items-center gap-4 py-5">
          <Skeleton width="28px" height="20px" />
          <Skeleton width="40px" height="40px" className="!rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton width="45%" height="16px" />
            <Skeleton width="25%" height="12px" />
          </div>
          <Skeleton width="60px" height="20px" />
        </div>
      ))}
    </div>
  )
}

function ScoreStat({ label, value, loading }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-white/85 sm:text-xs">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
        {loading ? (
          <span
            className="inline-block h-8 w-16 animate-pulse rounded bg-white/15 motion-reduce:animate-none"
            aria-label="Loading"
          />
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function RankRow({ entry }) {
  return (
    <tr
      data-testid={entry.isSelf ? 'my-rank' : undefined}
      className={`border-t border-c-border/70 transition-colors ${entry.isSelf ? 'bg-c-blue-soft/70' : 'bg-white hover:bg-c-blue-wash/60'}`}
    >
      <td className="py-4 pl-3 pr-1 text-center sm:pl-5 sm:pr-3">
        <span
          className={`mx-auto inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-xs font-semibold tabular-nums sm:h-10 sm:min-w-10 sm:text-sm ${entry.rank === 1 && entry.xp > 0 ? 'bg-c-yellow-soft text-c-text' : entry.rank <= 3 && entry.xp > 0 ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted'}`}
        >
          <span className="sr-only">Rank </span>
          {String(entry.rank).padStart(2, '0')}
        </span>
      </td>
      <td className="px-2 py-4 sm:px-3">
        <Link
          to={`/u/${entry.user.username}`}
          className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue sm:gap-3.5"
        >
          <Avatar
            src={entry.user.avatar}
            name={entry.user.fullName}
            size="md"
            className="!h-9 !w-9 sm:!h-10 sm:!w-10"
          />
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <span
                title={entry.user.fullName}
                className="truncate text-[13px] font-semibold text-c-text group-hover:text-c-blue sm:text-sm"
              >
                {entry.user.fullName}
              </span>
              {entry.isSelf && (
                <span className="shrink-0 rounded bg-c-blue-soft px-1.5 py-0.5 text-[10px] font-medium text-c-blue">
                  You
                </span>
              )}
            </span>
            <span className="mt-1 block truncate text-[11px] capitalize text-c-text-muted sm:text-xs">
              {entry.user.role}
            </span>
          </span>
        </Link>
      </td>
      <td className="hidden px-3 py-4 text-sm text-c-text-muted md:table-cell">
        <span className="rounded-md bg-c-blue-wash px-2 py-1 text-xs">
          Lv {entry.user.level}
        </span>
      </td>
      <td className="hidden px-3 py-4 text-xs text-c-text-muted lg:table-cell">
        <span className="inline-flex items-center gap-1.5">
          <Flame size={14} className="text-c-blue/70" aria-hidden="true" />
          {entry.user.streakDays} {entry.user.streakDays === 1 ? 'day' : 'days'}
        </span>
      </td>
      <td className="py-4 pl-2 pr-4 text-right sm:pr-6">
        <span className="text-sm font-semibold tabular-nums text-c-blue sm:text-base">
          {entry.xp.toLocaleString()}
        </span>
        <span className="ml-1.5 hidden text-[10px] font-medium text-c-text-muted sm:inline">
          XP
        </span>
      </td>
    </tr>
  )
}

export default function Leaderboard() {
  const user = useAuthStore((state) => state.user)
  const [period, setPeriod] = useState('week')
  const [role, setRole] = useState('')
  const [state, setState] = useState({
    key: '',
    status: 'loading',
    entries: [],
  })
  const [attempt, setAttempt] = useState(0)
  const key = `${period}|${role}|${attempt}`

  useEffect(() => {
    let active = true
    game
      .getLeaderboard({ period, role })
      .then(
        ({ entries }) => active && setState({ key, status: 'ready', entries }),
      )
      .catch(() => active && setState({ key, status: 'error', entries: [] }))
    return () => {
      active = false
    }
  }, [period, role, key])

  const status = state.key === key ? state.status : 'loading'
  const entries = status === 'ready' ? state.entries : []
  const me = entries.find((entry) => entry.isSelf)
  const hasActivity = entries.some((entry) => entry.xp > 0)
  const outsideRole = Boolean(role && user?.role !== role)
  const rank = me ? `#${me.rank}` : '\u2014'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-c-blue to-c-blue-hover px-5 pb-12 pt-6 text-white sm:px-8 sm:pb-14 sm:pt-8">
        <Trophy
          size={180}
          strokeWidth={0.75}
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-5 -rotate-12 text-white/[0.06]"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="!text-3xl !font-bold !tracking-tight !text-white sm:!text-4xl">
              Leaderboard
            </h1>
            <p className="mt-2 text-sm text-white/85">
              Every chapter and project counts.
            </p>
          </div>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Keep learning
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mt-7 flex flex-col gap-6 sm:mt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <Link
            to="/profile"
            className="flex min-w-0 items-center gap-3.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Avatar
              src={user?.avatar}
              name={user?.fullName || user?.name}
              size="lg"
              className="ring-4 ring-white/15"
              fallbackClassName="!border-white/30 !bg-white !text-c-blue"
            />
            <span className="min-w-0">
              <span className="block text-xs text-white/80">Your progress</span>
              <span className="mt-1 block truncate text-base font-semibold">
                {user?.fullName || user?.name || 'Your profile'}
              </span>
            </span>
          </Link>
          <dl
            className="grid grid-cols-3 gap-4 border-t border-white/20 pt-5 lg:w-[52%] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
            aria-label="Your leaderboard progress"
          >
            <ScoreStat
              label={periods[period].score}
              value={me ? me.xp.toLocaleString() : '\u2014'}
              loading={status === 'loading'}
            />
            <ScoreStat
              label="Your rank"
              value={rank}
              loading={status === 'loading'}
            />
            <ScoreStat
              label="Day streak"
              value={me?.user.streakDays ?? user?.streakDays ?? 0}
            />
          </dl>
        </div>
      </header>

      <section
        aria-label="Community rankings"
        className="relative mx-0 mt-[-24px] overflow-hidden rounded-2xl border border-c-border bg-white shadow-sm sm:mx-5"
      >
        <div className="flex flex-col gap-4 border-b border-c-border px-4 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
          <Tabs
            value={period}
            onChange={setPeriod}
            className="min-w-0 sm:flex-1"
          >
            <TabsList
              aria-label="Ranking period"
              className="!gap-5 !border-0 sm:!gap-7"
            >
              {Object.entries(periods).map(([value, item]) => (
                <TabTrigger
                  key={value}
                  id={`leaderboard-tab-${value}`}
                  value={value}
                  aria-controls="leaderboard-results"
                  className="!pb-2"
                >
                  {item.label}
                </TabTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="w-full shrink-0 sm:w-40">
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              options={roleOptions}
              aria-label="Filter by role"
              className="!rounded-xl"
            />
          </div>
        </div>
        <div
          id="leaderboard-results"
          role="tabpanel"
          aria-labelledby={`leaderboard-tab-${period}`}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-blue"
        >
          {status === 'loading' ? (
            <LeaderboardSkeleton />
          ) : status === 'error' ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                title="Could not load the leaderboard"
                description="Please try again in a moment."
                actionLabel="Try again"
                onAction={() => setAttempt((count) => count + 1)}
              />
            </div>
          ) : !hasActivity ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Trophy}
                title={
                  role
                    ? 'No rankings for this role yet'
                    : 'No XP earned in this period yet'
                }
                description={
                  role
                    ? 'Choose another role to see more people.'
                    : 'Read a chapter or share a project to get started.'
                }
                actionLabel={role ? 'Show all roles' : 'Explore the library'}
                onAction={role ? () => setRole('') : undefined}
                actionTo={role ? undefined : '/library'}
              />
            </div>
          ) : (
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">
                {periods[period].label} leaderboard
                {role
                  ? ` for ${roleOptions.find((option) => option.value === role)?.label.toLowerCase()}`
                  : ''}
              </caption>
              <thead>
                <tr className="bg-c-blue-wash/50 text-[10px] font-medium uppercase tracking-wider text-c-text-muted">
                  <th
                    scope="col"
                    className="w-12 py-3 pl-3 pr-1 text-center font-medium sm:w-20 sm:pl-5 sm:pr-3"
                  >
                    Rank
                  </th>
                  <th scope="col" className="px-2 py-3 font-medium sm:px-3">
                    Member
                  </th>
                  <th
                    scope="col"
                    className="hidden w-24 px-3 py-3 font-medium md:table-cell"
                  >
                    Level
                  </th>
                  <th
                    scope="col"
                    className="hidden w-28 px-3 py-3 font-medium lg:table-cell"
                  >
                    Streak
                  </th>
                  <th
                    scope="col"
                    className="w-24 py-3 pl-2 pr-4 text-right font-medium sm:w-32 sm:pr-6"
                  >
                    XP
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <RankRow key={entry.user.id} entry={entry} />
                ))}
              </tbody>
            </table>
          )}
        </div>
        {status === 'ready' && hasActivity && (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-c-border px-4 py-4 text-[11px] text-c-text-muted sm:px-6">
            <span>{periods[period].detail} &middot; Ranked by earned XP</span>
            {outsideRole && (
              <button
                type="button"
                onClick={() => setRole('')}
                className="font-medium text-c-blue hover:underline"
              >
                Show my ranking
              </button>
            )}
          </footer>
        )}
      </section>
    </div>
  )
}
