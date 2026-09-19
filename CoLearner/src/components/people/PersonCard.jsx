import React from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock3, MapPin, UserPlus, MessageCircle } from 'lucide-react'
import { Avatar, Button } from '../ui'

// What the button shows, its look, and the API action a click performs, per connection state
// (states come from the backend: none | pending_sent | pending_received | accepted).
const connectionStates = {
  none: {
    label: 'Connect',
    icon: UserPlus,
    variant: 'primary',
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

const availabilityLabels = {
  open_to_collaboration: 'Open to team up',
  mentoring: 'Available to mentor',
  focused_learning: 'Focused on learning',
}

export function PersonCard({ person, onConnect, busy = false }) {
  const state =
    connectionStates[person.connectionStatus] || connectionStates.none
  const commonCount = person.mutualSkillsCount || 0
  const available = availabilityLabels[person.availability]
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-c-border/80 bg-c-surface p-5 text-left shadow-sm transition-[box-shadow,border-color] hover:border-c-blue/25 hover:shadow-md focus-within:border-c-blue/40">
      <Link
        to={`/u/${person.username}`}
        className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
      >
        <Avatar
          src={person.avatar}
          name={person.fullName}
          size="lg"
          className="!h-11 !w-11 ring-4 ring-c-blue-wash"
        />
        <div className="min-w-0">
          <h2
            title={person.fullName}
            className="truncate !text-base !font-semibold !leading-6 !tracking-tight text-c-text transition-colors group-hover:text-c-blue"
          >
            {person.fullName}
          </h2>
          <p className="mt-0.5 text-xs capitalize text-c-text-muted">
            {person.role}
          </p>
        </div>
      </Link>
      <div className="mt-4 flex min-w-0 items-center gap-3">
        <span
          title={`${person.xp.toLocaleString()} XP`}
          className="shrink-0 rounded-full bg-c-blue-soft px-2.5 py-1 text-[10px] font-semibold text-c-blue"
        >
          Level {person.level}
        </span>
        {person.location && (
          <span
            title={person.location}
            className="inline-flex min-w-0 items-center gap-1 text-[11px] text-c-text-muted"
          >
            <MapPin size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{person.location}</span>
          </span>
        )}
      </div>
      <p className="mt-3 h-10 line-clamp-2 break-words text-[13px] leading-5 text-c-text-muted">
        {person.headline || person.bio}
      </p>
      <div className="mb-5 mt-4 flex h-6 min-w-0 items-center gap-1.5">
        {person.skills.slice(0, 3).map((skill) => (
          <span
            key={skill.id}
            title={skill.name}
            className="min-w-0 truncate rounded-full bg-c-blue-wash px-2.5 py-1 text-[10px] text-c-text-muted"
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
            className="shrink-0 rounded-full border border-c-border px-2 py-1 text-[10px] text-c-text-muted"
          >
            +{person.skills.length - 3}
          </span>
        )}
      </div>
      <div className="mt-auto flex min-w-0 items-center justify-between gap-3">
        <Link
          to={`/u/${person.username}`}
          className="min-w-0 rounded hover:text-c-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          <span
            className={`block truncate text-xs font-semibold ${commonCount ? 'text-c-blue' : 'text-c-text'}`}
          >
            {commonCount
              ? `${commonCount} shared ${commonCount === 1 ? 'skill' : 'skills'}`
              : `${person.xp.toLocaleString()} XP`}
          </span>
          <span
            title={available || 'View profile'}
            className="mt-1 block truncate text-[10px] text-c-text-muted"
          >
            {available || 'View profile'}
          </span>
        </Link>
        {person.connectionStatus === 'accepted' ? (
          <Button
            to={`/messages?to=${person.id}`}
            size="sm"
            variant="primary"
            icon={MessageCircle}
            className="!h-10 shrink-0 !rounded-full !px-4 !shadow-none"
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
            className="!h-10 shrink-0 !rounded-full !px-4 !shadow-none"
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
