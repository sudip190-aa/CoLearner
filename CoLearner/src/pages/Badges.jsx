import React, { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookCheck,
  BookOpen,
  CalendarCheck,
  Check,
  CircleCheck,
  Crown,
  Flag,
  Flame,
  HeartHandshake,
  Library,
  MessageSquare,
  MessagesSquare,
  PackageCheck,
  Rocket,
  Star,
  Trophy,
} from 'lucide-react'
import { Badge, EmptyState, Modal, ProgressBar, Skeleton } from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { formatDate } from '../lib/formatters.js'
import { game } from '../services/api.js'

const CATEGORY_ORDER = ['Learning', 'Building', 'Community', 'Consistency']
const ICONS = {
  'book-open': BookOpen,
  'book-check': BookCheck,
  library: Library,
  rocket: Rocket,
  'circle-check': CircleCheck,
  'package-check': PackageCheck,
  flag: Flag,
  trophy: Trophy,
  'message-square': MessageSquare,
  'messages-square': MessagesSquare,
  'heart-handshake': HeartHandshake,
  flame: Flame,
  'calendar-check': CalendarCheck,
  star: Star,
  crown: Crown,
}

function BadgeTile({ badge, earned, onOpen }) {
  const Icon = ICONS[badge.icon] || Award
  return (
    <button
      type="button"
      onClick={() => onOpen(badge)}
      data-badge={badge.criteriaKey}
      data-earned={earned ? 'true' : 'false'}
      className={`group rounded-brand-lg border border-c-border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md ${earned ? '' : 'opacity-60'}`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${earned ? 'bg-c-yellow-soft text-c-text' : 'bg-slate-100 text-slate-400'}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <h3 className="font-bold text-c-text">{badge.name}</h3>
        {earned && <Check className="h-4 w-4 shrink-0 text-c-success" />}
      </div>
      <p className="mt-1 text-sm leading-5 text-c-text-muted">
        {badge.description}
      </p>
      {earned ? (
        <p className="mt-4 text-xs font-semibold text-c-success">
          Earned {formatDate(badge.earnedAt)}
        </p>
      ) : (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-c-text-muted">
            <span>
              {badge.progress} of {badge.required}
            </span>
            <span>Locked</span>
          </div>
          <ProgressBar value={(badge.progress / badge.required) * 100} />
        </div>
      )}
    </button>
  )
}

function BadgesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} width="100%" height="190px" />
      ))}
    </div>
  )
}

export default function Badges() {
  const [selected, setSelected] = useState(null)
  const [state, setState] = useState({ key: -1, status: 'loading', earned: [], locked: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    game
      .getBadges()
      .then(({ earned, locked }) => active && setState({ key: attempt, status: 'ready', earned, locked }))
      .catch(() => active && setState({ key: attempt, status: 'error', earned: [], locked: [] }))
    return () => {
      active = false
    }
  }, [attempt])

  const { earned, locked } = state
  const status = state.key === attempt ? state.status : 'loading'
  const earnedIds = useMemo(() => new Set(earned.map((badge) => badge.id)), [earned])
  const byCategory = useMemo(() => {
    const groups = {}
    for (const badge of [...earned, ...locked]) {
      ;(groups[badge.category] ||= []).push(badge)
    }
    const order = [
      ...CATEGORY_ORDER,
      ...Object.keys(groups).filter((name) => !CATEGORY_ORDER.includes(name)),
    ]
    return order
      .filter((name) => groups[name])
      .map((name) => [name, groups[name].sort((a, b) => a.required - b.required || a.xpReward - b.xpReward)])
  }, [earned, locked])

  const isEarned = (badge) => earnedIds.has(badge.id)
  return (
    <div>
      <PageHeader
        title="Badges"
        subtitle={
          status === 'ready'
            ? `${earned.length} of ${earned.length + locked.length} badges earned. Each one marks work you have made visible.`
            : 'Badges mark the work you have made visible.'
        }
      />
      {status === 'loading' ? (
        <BadgesSkeleton />
      ) : status === 'error' ? (
        <EmptyState
          title="Could not load your badges"
          description="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => setAttempt((count) => count + 1)}
        />
      ) : byCategory.length === 0 ? (
        <EmptyState
          title="No badges are available yet"
          description="Badges appear here as soon as they are set up."
        />
      ) : (
        <div className="space-y-12">
          {byCategory.map(([category, items]) => (
            <section key={category}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-c-blue">
                    {category}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-c-text">
                    {category} badges
                  </h2>
                </div>
                <span className="text-sm text-c-text-muted">
                  {items.filter(isEarned).length}/{items.length} earned
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((badge) => (
                  <BadgeTile
                    key={badge.id}
                    badge={badge}
                    earned={isEarned(badge)}
                    onOpen={setSelected}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected?.description}
      >
        {selected && (
          <>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-c-yellow-soft">
                {React.createElement(ICONS[selected.icon] || Award, {
                  className: 'h-10 w-10 text-c-text',
                })}
              </div>
              <div>
                <Badge variant={isEarned(selected) ? 'success' : 'gray'}>
                  {isEarned(selected) ? 'Earned' : 'Locked'}
                </Badge>
                <p className="mt-2 text-sm text-c-text-muted">
                  {selected.xpReward} XP reward
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-brand bg-c-blue-wash p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
                Progress
              </p>
              <p className="mt-2 text-sm leading-6 text-c-text">
                {isEarned(selected)
                  ? `Completed on ${formatDate(selected.earnedAt)}.`
                  : `${selected.progress} of ${selected.required} so far.`}
              </p>
            </div>
            <p className="mt-5 text-sm text-c-text-muted">
              {isEarned(selected)
                ? 'This badge is part of your public learning record.'
                : 'Keep going. Progress is saved as you learn, build, and help others.'}
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}
