import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Select } from '../ui'
import { useMessageInbox } from '../../hooks/useMessages'
import { useAuthStore } from '../../store/authStore'
import { action, result, supabase } from '../../services/supabase/client'

export default function ProjectInvitations({ project, onChange }) {
  const me = useAuthStore((state) => state.user?.id)
  const friends = useMessageInbox()
  const [person, setPerson] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requests = useQuery({
    queryKey: ['project-invitations', me, project.id],
    queryFn: () =>
      result(
        supabase
          .from('join_requests')
          .select(
            'id,user_id,status,invited_by,user:profiles!join_requests_user_id_fkey(username,full_name,avatar)',
          )
          .eq('project_id', project.id)
          .not('invited_by', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(50),
      ),
    refetchInterval: 15000,
  })
  const eligible = (friends.data || []).filter(
    (friend) =>
      !project.members.some((member) => member.id === friend.id) &&
      !requests.data?.some(
        (request) =>
          request.user_id === friend.id &&
          ['pending', 'invited'].includes(request.status),
      ),
  )
  async function perform(kind, payload) {
    setBusy(true)
    setError('')
    try {
      await action(kind, payload)
      setPerson('')
      await requests.refetch()
      await onChange?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="mt-8 border-t border-c-border pt-6">
      <h2 className="text-lg font-semibold">Build with your connections</h2>
      <p className="mt-1 text-sm text-c-text-muted">
        Invite someone you already know.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          if (person)
            void perform('invite', { slug: project.slug, username: person })
        }}
      >
        <Select
          aria-label="Friend to invite"
          value={person}
          onChange={(event) => setPerson(event.target.value)}
          options={[
            {
              value: '',
              label: friends.isPending
                ? 'Loading connections…'
                : 'Choose a connection',
            },
            ...eligible.map((friend) => ({
              value: friend.username,
              label: friend.full_name || friend.username,
            })),
          ]}
        />
        <Button
          type="submit"
          loading={busy}
          disabled={
            !person || ['completed', 'archived'].includes(project.status)
          }
        >
          Send invitation
        </Button>
      </form>
      {!friends.isPending && !eligible.length && (
        <p className="mt-3 text-sm text-c-text-muted">
          No eligible connections right now. Connect with people from the People
          page.
        </p>
      )}
      {(error || friends.isError || requests.isError) && (
        <p role="alert" className="mt-3 text-sm text-c-danger">
          {error || 'Invitations could not load. Please try again.'}
        </p>
      )}
      <ul className="mt-4 divide-y divide-c-border">
        {requests.data?.map((request) => (
          <li key={request.id} className="flex items-center gap-3 py-3 text-sm">
            <Avatar name={request.user?.full_name} size="sm" />
            <span className="min-w-0 flex-1 truncate">
              {request.user?.full_name || request.user?.username}
            </span>
            <span className="text-xs capitalize text-c-text-muted">
              {request.status === 'approved'
                ? 'Accepted'
                : request.status === 'rejected'
                  ? 'Declined'
                  : request.status}
            </span>
            {request.status === 'invited' &&
              (project.viewer.isOwner || request.invited_by === me) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => perform('cancel_invite', { id: request.id })}
                >
                  Cancel
                </Button>
              )}
          </li>
        ))}
      </ul>
    </section>
  )
}
