import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar } from '../ui'
import { users } from '../../services/api'

const availabilityLabels = {
  open_to_collaboration: 'Open to collaboration',
  mentoring: 'Available for mentoring',
  focused_learning: 'Focused on learning',
}

export default function ContactDetails({ person }) {
  const profile = useQuery({
    queryKey: ['message-profile', person.id],
    queryFn: () => users.getUser(person.username),
    staleTime: 60000,
  })
  const user = profile.data?.user
  const name = person.full_name || person.username
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-c-border px-5 py-7 text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-c-blue-wash p-1.5 ring-1 ring-c-blue/10">
          <Avatar key={person.id} src={person.avatar} name={name} size="xl" />
        </div>
        <h2 className="break-words text-sm font-semibold">{name}</h2>
        <p className="mt-1 break-all text-xs text-c-text-muted">
          @{person.username}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-c-yellow-soft px-2.5 py-1 text-[10px] font-medium text-c-text">
          <ShieldCheck size={12} aria-hidden="true" />
          Connected
        </span>
      </div>
      <div className="flex-1 space-y-6 p-5">
        {(user?.headline || person.headline) && (
          <p className="text-xs leading-5 text-c-text-muted">
            {user?.headline || person.headline}
          </p>
        )}
        {profile.isPending && (
          <p role="status" className="text-xs text-c-text-muted">
            Loading profile…
          </p>
        )}
        {profile.isError && (
          <p className="text-xs leading-5 text-c-text-muted">
            Profile details unavailable.{' '}
            <button
              onClick={() => profile.refetch()}
              className="font-medium text-c-blue hover:underline"
            >
              Retry
            </button>
          </p>
        )}
        {user && (
          <>
            <div>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-c-text-muted">
                About
              </h3>
              <dl className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <dt>
                    <UserRound
                      size={14}
                      className="text-c-blue"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Role</span>
                  </dt>
                  <dd className="capitalize">{user.role}</dd>
                </div>
                {user.location && (
                  <div className="flex items-start gap-2">
                    <dt>
                      <MapPin
                        size={14}
                        className="mt-0.5 text-c-blue"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Location</span>
                    </dt>
                    <dd className="break-words leading-5">{user.location}</dd>
                  </div>
                )}
              </dl>
              {availabilityLabels[user.availability] && (
                <p className="mt-4 rounded-lg bg-c-blue-wash px-3 py-2 text-[11px] leading-4 text-c-text-muted">
                  {availabilityLabels[user.availability]}
                </p>
              )}
            </div>
            {user.skills.length > 0 && (
              <div>
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-c-text-muted">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill.id}
                      className="max-w-full break-words rounded-md border border-c-border px-2 py-1 text-[10px] text-c-text-muted"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Link
        to={`/u/${person.username}`}
        className="mx-5 mb-5 inline-flex items-center justify-center gap-2 rounded-xl border border-c-border py-2.5 text-xs font-semibold text-c-blue transition-colors hover:border-c-blue/30 hover:bg-c-blue-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
      >
        View profile
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
