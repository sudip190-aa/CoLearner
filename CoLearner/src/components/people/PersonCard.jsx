import React from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock3, UserPlus, MessageCircle } from 'lucide-react'
import { Avatar, Badge, Button, Chip } from '../ui'

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
  const commonSkills = person.sharedSkills || []
  return (
    <article className="flex min-h-[286px] flex-col rounded-brand-lg border border-c-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/u/${person.username}`} className="group">
        <div className="flex items-start justify-between gap-3">
          <Avatar src={person.avatar} name={person.fullName} size="lg" />
          <Badge variant="blue">Level {person.level}</Badge>
        </div>
        <h2 className="mt-4 text-lg font-bold text-c-text group-hover:text-c-blue">
          {person.fullName}
        </h2>
        <p className="text-sm text-c-text-muted">@{person.username}</p>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-c-text">
          {person.headline}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {person.skills.slice(0, 4).map((skill) => (
          <Chip key={skill.id}>{skill.name}</Chip>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div>
          <p className="text-xs font-semibold text-c-text-muted">
            {person.xp.toLocaleString()} XP
          </p>
          {commonSkills.length > 0 && (
            <p className="mt-1 text-xs font-semibold text-c-blue">
              {person.mutualSkillsCount}{' '}
              {person.mutualSkillsCount === 1 ? 'skill' : 'skills'} in common
            </p>
          )}
        </div>
        {person.connectionStatus === 'accepted' ? (
          <Button
            to={`/messages?to=${person.id}`}
            size="sm"
            variant="secondary"
            icon={MessageCircle}
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
