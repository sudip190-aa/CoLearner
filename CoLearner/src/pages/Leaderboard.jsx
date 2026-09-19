import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Medal, Trophy } from 'lucide-react'
import {
  Avatar,
  EmptyState,
  Select,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { game } from '../services/api.js'

const roleOptions = [
  { value: '', label: 'All roles' },
  { value: 'learner', label: 'Learners' },
  { value: 'builder', label: 'Builders' },
  { value: 'mentor', label: 'Mentors' },
]
function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="flex items-center gap-4 rounded-brand-lg border border-c-border bg-white p-4"
        >
          <Skeleton width="28px" height="20px" />
          <Skeleton width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="30%" height="16px" />
            <Skeleton width="60%" height="12px" />
          </div>
          <Skeleton width="70px" height="20px" />
        </div>
      ))}
    </div>
  )
}
function PodiumCard({ entry, place }) {
  const styles = {
    1: 'col-start-2 -mb-4 border-2 border-c-yellow bg-c-yellow-soft p-5 shadow-md sm:p-7',
    2: 'col-start-1 border border-c-border bg-white p-4 shadow-sm sm:p-6',
    3: 'col-start-3 border border-c-border bg-white p-4 shadow-sm sm:p-6',
  }
  const Icon = place === 1 ? Trophy : Medal
  const iconColour =
    place === 1 ? 'text-c-text' : place === 2 ? 'text-slate-400' : 'text-amber-700'
  return (
    <Link
      to={`/u/${entry.user.username}`}
      data-podium={place}
      className={`flex flex-col items-center rounded-brand-lg text-center ${styles[place]}`}
    >
      <Icon className={`${place === 1 ? 'h-8 w-8' : 'h-6 w-6'} ${iconColour}`} />
      <Avatar src={entry.user.avatar} name={entry.user.fullName} size="lg" />
      <p className="mt-3 text-sm font-bold text-c-text">{entry.user.fullName}</p>
      <p className="mt-1 text-xs font-semibold text-c-text-muted">
        {entry.xp.toLocaleString()} XP
      </p>
      <span className="mt-3 text-xs font-bold text-c-text-muted">#{place}</span>
    </Link>
  )
}
function Podium({ entries }) {
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-3">
      {[entries[1], entries[0], entries[2]].map((entry, index) =>
        entry ? (
          <PodiumCard key={entry.user.id} entry={entry} place={[2, 1, 3][index]} />
        ) : null,
      )}
    </div>
  )
}
function RankRow({ entry, current }) {
  return (
    <div
      className={`grid grid-cols-[32px_minmax(0,1fr)_70px_80px_72px_68px] items-center gap-3 px-4 py-3 text-sm ${current ? 'bg-c-blue-soft' : 'border-t border-c-border bg-white'}`}
    >
      <span className="font-bold text-c-text-muted">#{entry.rank}</span>
      <Link
        to={`/u/${entry.user.username}`}
        className="flex min-w-0 items-center gap-3"
      >
        <Avatar src={entry.user.avatar} name={entry.user.fullName} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-c-text hover:text-c-blue">
            {entry.user.fullName}
          </span>
          <span className="block truncate text-xs text-c-text-muted">
            @{entry.user.username}
          </span>
        </span>
      </Link>
      <span className="text-c-text-muted">Lv {entry.user.level}</span>
      <span className="font-semibold text-c-text">
        {entry.xp.toLocaleString()}
      </span>
      <span className="flex items-center gap-1 text-c-text-muted">
        <Flame className="h-3.5 w-3.5 text-c-yellow" />
        {entry.user.streakDays}
      </span>
      <span className="text-c-text-muted">{entry.user.badgeCount}</span>
    </div>
  )
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('week')
  const [role, setRole] = useState('')
  const [state, setState] = useState({ key: '', status: 'loading', entries: [] })
  const [attempt, setAttempt] = useState(0)
  const key = `${period}|${role}|${attempt}`

  useEffect(() => {
    let active = true
    game
      .getLeaderboard({ period, role })
      .then(({ entries }) => active && setState({ key, status: 'ready', entries }))
      .catch(() => active && setState({ key, status: 'error', entries: [] }))
    return () => {
      active = false
    }
  }, [period, role, key])

  // Until the answer for the current filters arrives, show the skeleton.
  const status = state.key === key ? state.status : 'loading'
  const { entries } = state
  // The signed-in person's own row is appended even with no XP, so the podium only takes people who have some.
  const topEntries = entries.filter((entry) => entry.rank <= 3 && entry.xp > 0)
  const tableEntries = entries.filter((entry) => entry.rank > 3 && !entry.isSelf)
  const me = entries.find((entry) => entry.isSelf)
  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Celebrate the people making learning visible through steady practice and shipped work."
      />
      <div className="flex flex-col gap-4 border-b border-c-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={period} onChange={setPeriod}>
          <TabsList>
            <TabTrigger value="week">This week</TabTrigger>
            <TabTrigger value="month">This month</TabTrigger>
            <TabTrigger value="all">All time</TabTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          options={roleOptions}
          className="sm:w-40"
          aria-label="Filter by role"
        />
      </div>
      {status === 'loading' ? (
        <div className="mt-8">
          <LeaderboardSkeleton />
        </div>
      ) : status === 'error' ? (
        <div className="mt-8">
          <EmptyState
            title="Could not load the leaderboard"
            description="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => setAttempt((count) => count + 1)}
          />
        </div>
      ) : entries.filter((entry) => !entry.isSelf || entry.xp > 0).length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={period === 'all' ? 'No learners found' : 'No XP earned in this period yet'}
            description={
              period === 'all'
                ? 'Try another role filter.'
                : 'Read a chapter, finish a task or start a thread to get on the board.'
            }
          />
        </div>
      ) : (
        <>
          <section className="mt-10">
            <Podium entries={topEntries} />
          </section>
          <section className="mt-14 overflow-hidden rounded-brand-lg border border-c-border shadow-sm">
            <div className="hidden grid-cols-[32px_minmax(0,1fr)_70px_80px_72px_68px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-c-text-muted sm:grid">
              <span>Rank</span>
              <span>Learner</span>
              <span>Level</span>
              <span>XP</span>
              <span>Streak</span>
              <span>Badges</span>
            </div>
            <div>
              {tableEntries.map((entry) => (
                <RankRow key={entry.user.id} entry={entry} current={false} />
              ))}
            </div>
            {me && (
              <div
                data-testid="my-rank"
                className="sticky bottom-0 z-10 border-t-2 border-c-blue bg-c-blue-soft"
              >
                <RankRow entry={me} current />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
