import React from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock3, UserPlus, MessageCircle } from 'lucide-react'
import { Avatar, Button } from '../ui'

// What the button shows, its look, and the API action a click performs, per connection state
// (states come from the backend: none | pending_sent | pending_received | accepted).
const connectionStates = {
  none: {
    label: 'Connect',
    icon: UserPlus,
    variant: 'outline',
    action: 'connect',
  },
  pending_sent: {
    label: 'Pending',
    icon: Clock3,
    variant: 'outline',
    action: 'cancel',
    title: 'Cancel request',
  },
  pending_received: {
    label: 'Accept',
    icon: Check,
    variant: 'primary',
    action: 'accept',
    title: 'Accept request',
  },
  accepted: {
    label: 'Connected',
    icon: Check,
    variant: 'secondary',
    action: null,
  },
}

export function PersonCard({ person, onConnect, busy = false }) {
  const state =
    connectionStates[person.connectionStatus] || connectionStates.none
  const commonCount = person.mutualSkillsCount || 0
  const mentor = person.role === 'mentor'
  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-white p-5 text-left shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:border-c-blue/25 hover:shadow-[0_12px_32px_-16px_rgba(46,120,229,0.3)] focus-within:border-c-blue/40 motion-safe:hover:-translate-y-1 sm:p-6">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border-[14px] ${mentor ? 'border-c-yellow/10' : 'border-c-blue/5'}`}
      />
      <Link
        to={`/u/${person.username}`}
        className="relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
      >
        <div className="flex items-start justify-between gap-3">
          <Avatar
            src={person.avatar}
            name={person.fullName}
            size="lg"
            className={`!h-14 !w-14 ring-4 ${mentor ? 'ring-c-yellow-soft' : 'ring-c-blue-wash'}`}
          />
          <p className="pt-1 text-[11px] tabular-nums text-c-text-muted">
            Level {person.level}
            <span className="mx-1.5 text-c-border" aria-hidden="true">
              ·
            </span>
            {person.xp.toLocaleString()} XP
          </p>
        </div>
        <h2
          title={person.fullName}
          className="mt-4 h-6 truncate text-lg font-semibold leading-6 tracking-tight text-c-text transition-colors group-hover:text-c-blue"
        >
          {person.fullName}
        </h2>
        <p
          title={`@${person.username}`}
          className="mt-0.5 h-5 truncate text-xs leading-5 text-c-text-muted"
        >
          @{person.username}
        </p>
        <p className="mt-3 h-10 line-clamp-2 break-words text-sm leading-5 text-c-text-muted">
          {person.headline}
        </p>
      </Link>
      <div className="mb-5 mt-4 flex h-7 min-w-0 items-center gap-1.5">
        {person.skills.slice(0, 3).map((skill) => (
          <span
            key={skill.id}
            title={skill.name}
            className="min-w-0 truncate rounded-full border border-c-border px-2.5 py-1 text-[11px] text-c-text-muted"
          >
            {skill.name}
          </span>
        ))}
        {person.skills.length > 3 && (
          <span
            title={person.skills
              .slice(3)
              .map((skill) => skill.name)
              .join(', ')}
            className="shrink-0 text-[11px] text-c-text-muted"
          >
            +{person.skills.length - 3}
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-c-border/70 pt-4">
        {commonCount > 0 ? (
          <span className="text-xs font-medium text-c-blue">
            {commonCount} shared {commonCount === 1 ? 'skill' : 'skills'}
          </span>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${mentor ? 'bg-c-yellow-soft text-c-text' : 'bg-c-blue-wash text-c-text-muted'}`}
          >
            {person.role}
          </span>
        )}
        {person.connectionStatus === 'accepted' ? (
          <Button
            to={`/messages?to=${person.id}`}
            size="sm"
            variant="secondary"
            icon={MessageCircle}
            className="!rounded-xl"
            aria-label={`Message ${person.fullName}`}
          >
            Message
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant={state.variant}
            icon={state.icon}
            title={state.title}
            className="!rounded-xl"
            aria-label={`${state.title || state.label} ${person.fullName}`}
            loading={busy}
            disabled={!state.action}
            onClick={() => onConnect?.(person, state.action)}
          >
            {state.label}
          </Button>
        )}
      </div>
    </article>
  )
}

export default PersonCard
