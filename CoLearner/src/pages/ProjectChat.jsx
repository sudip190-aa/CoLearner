import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ArrowLeft,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Reply,
  Send,
  Users,
  Volume2,
} from 'lucide-react'
import { Avatar, Button, EmptyState, Modal } from '../components/ui'
import ReplyPreview from '../components/messages/ReplyPreview'
import { useVoiceCall } from '../components/calls/VoiceCallProvider'
import { useAuthStore } from '../store/authStore'
import { projects } from '../services/api'
import { projectChat } from '../services/projectChat'
import { ProjectVoice } from '../services/projectVoice'
import { supabase } from '../services/supabase/client'

export default function ProjectChat() {
  const { slug } = useParams(),
    me = useAuthStore((s) => s.user?.id),
    cache = useQueryClient(),
    privateCall = useVoiceCall()
  const [draft, setDraft] = useState(''),
    [reply, setReply] = useState(null),
    [original, setOriginal] = useState(null),
    [sending, setSending] = useState(false),
    [error, setError] = useState(''),
    [showMembers, setShowMembers] = useState(false),
    [visible, setVisible] = useState(!document.hidden),
    [atBottom, setAtBottom] = useState(true)
  const [voice, setVoice] = useState({ phase: 'idle', members: [] }),
    controller = useRef(null),
    bottom = useRef(null),
    input = useRef(null),
    pending = useRef(null)
  const info = useQuery({
    queryKey: ['project-chat-info', me, slug],
    queryFn: () => projects.getProject(slug),
    refetchInterval: 5000,
  })
  const project = info.data?.project,
    allowed = !!project?.viewer?.isMember,
    id = project?.id
  const history = useInfiniteQuery({
    queryKey: ['project-messages', me, id],
    queryFn: ({ pageParam }) => projectChat.history(id, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (page) => (page.length === 50 ? page[0].id : undefined),
    enabled: allowed,
    refetchInterval: 10000,
  })
  const entries = [...(history.data?.pages || [])].reverse().flat(),
    latest = entries.at(-1)?.id
  useEffect(() => {
    if (atBottom) bottom.current?.scrollIntoView({ block: 'nearest' })
  }, [latest, atBottom])
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!allowed || !latest || !visible || !atBottom) return
    void projectChat
      .read(id, latest)
      .then(() => {
        void cache.invalidateQueries({ queryKey: ['navigation-counts', me] })
        void cache.invalidateQueries({ queryKey: ['project-inbox', me] })
      })
      .catch(() => {})
  }, [allowed, id, latest, visible, atBottom, me, cache])
  useEffect(() => {
    if (!allowed || !id) return
    const instance = new ProjectVoice(id, me, setVoice)
    controller.current = instance
    void instance.start()
    const refresh = () => {
      void cache.invalidateQueries({ queryKey: ['project-messages', me, id] })
      void cache.invalidateQueries({
        queryKey: ['project-chat-info', me, slug],
      })
    }
    const channel = supabase.channel(
      `project-chat:${id}:${crypto.randomUUID()}`,
    )
    for (const table of ['project_messages', 'project_members'])
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `project_id=eq.${id}` },
        refresh,
      )
    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') refresh()
    })
    return () => {
      instance.dispose()
      controller.current = null
      void supabase.removeChannel(channel)
    }
  }, [allowed, id, me, slug, cache])
  async function send(event) {
    event.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    setError('')
    if (
      pending.current?.body !== draft.trim() ||
      pending.current?.reply !== reply?.id
    )
      pending.current = {
        id: crypto.randomUUID(),
        body: draft.trim(),
        reply: reply?.id,
      }
    try {
      await projectChat.send(id, draft, reply?.id, pending.current.id)
      pending.current = null
      setDraft('')
      setReply(null)
      setAtBottom(true)
      await cache.invalidateQueries({ queryKey: ['project-messages', me, id] })
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }
  function openOriginal(message) {
    const element = document.getElementById(`project-message-${message.id}`)
    if (element) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' })
      element.focus({ preventScroll: true })
    } else setOriginal(message)
  }
  if (info.isPending)
    return (
      <p role="status" className="p-8 text-c-text-muted">
        Loading project conversation...
      </p>
    )
  if (info.isError || !allowed)
    return (
      <EmptyState
        icon={Users}
        title="Members only"
        description="Join this project to open its private conversation."
        actionTo={`/projects/${slug}`}
        actionLabel="View project"
      />
    )
  const joined = voice.phase === 'joined'
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={`/projects/${slug}/workspace`}
            className="inline-flex items-center gap-1 text-xs text-c-text-muted"
          >
            <ArrowLeft size={13} />
            Workspace
          </Link>
          <h1 className="mt-2 !text-2xl !font-semibold !tracking-tight">
            {project.title}
          </h1>
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          aria-expanded={showMembers}
          className="inline-flex items-center gap-2 rounded-xl border border-c-border bg-c-surface px-4 py-2.5 text-xs"
        >
          <Users size={16} />
          {project.members.length} members
        </button>
      </header>
      {showMembers && (
        <section
          aria-label="Project chat members"
          className="flex flex-wrap gap-4 rounded-2xl border border-c-border bg-c-surface p-4"
        >
          {project.members.map((member) => (
            <Link
              to={`/u/${member.username}`}
              key={member.id}
              className="flex items-center gap-2 text-xs"
            >
              <Avatar name={member.fullName} src={member.avatar} size="sm" />
              {member.fullName || member.username}
            </Link>
          ))}
        </section>
      )}
      <section className="overflow-hidden rounded-3xl border border-c-border bg-c-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-c-border bg-c-blue-wash/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-c-blue-soft p-2.5 text-c-blue">
              <Phone size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">Team voice</p>
              <p role="status" className="mt-1 text-xs text-c-text-muted">
                {joined
                  ? voice.members.length === 1
                    ? 'Waiting for your team'
                    : `${voice.connections?.length || 0} audio connections`
                  : voice.members.length
                    ? `${voice.members.length} in the call`
                    : 'Talk through an idea together'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {joined ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={voice.muted ? MicOff : Mic}
                  aria-label={
                    voice.muted
                      ? 'Unmute group microphone'
                      : 'Mute group microphone'
                  }
                  onClick={() => controller.current?.mute()}
                >
                  {voice.muted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={PhoneOff}
                  onClick={() => void controller.current?.leave()}
                >
                  Leave call
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                icon={Phone}
                disabled={privateCall?.busy}
                loading={voice.phase === 'joining'}
                onClick={() => void controller.current?.join()}
              >
                {voice.members.length ? 'Join call' : 'Start voice call'}
              </Button>
            )}
            {voice.audioBlocked && (
              <Button
                size="sm"
                variant="outline"
                icon={Volume2}
                onClick={() => void controller.current?.play()}
              >
                Enable audio
              </Button>
            )}
            {voice.phase === 'joining' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void controller.current?.leave()}
              >
                Cancel
              </Button>
            )}
          </div>
          {!!voice.members.length && (
            <div
              aria-label="In the group call"
              className="flex w-full flex-wrap gap-2"
            >
              {voice.members.map((member) => (
                <span
                  key={member.user_id}
                  className="rounded-full bg-c-blue-soft px-3 py-1 text-[11px] text-c-blue"
                >
                  {member.person.full_name}
                  {member.user_id === me ? ' (you)' : ''}
                  {joined &&
                    member.user_id !== me &&
                    voice.connections?.includes(member.user_id) && (
                      <meter
                        aria-label={`Audio from ${member.person.full_name}`}
                        min="0"
                        max="1"
                        value={voice.levels?.[member.user_id] || 0}
                        className="ml-2 inline-block h-2 w-10 align-middle"
                      />
                    )}
                </span>
              ))}
            </div>
          )}
          {joined && (
            <p className="w-full text-[10px] text-c-text-muted">
              Leaving this page ends your call.
            </p>
          )}
          {voice.error && (
            <p role="alert" className="w-full text-xs text-c-danger">
              {voice.error}
            </p>
          )}
        </div>
        <div
          role="log"
          aria-label="Project messages"
          aria-live="polite"
          className="h-[50dvh] min-h-72 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
          onScroll={(event) => {
            const el = event.currentTarget
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
          }}
        >
          {history.hasNextPage && (
            <div className="mb-4 text-center">
              <Button
                size="sm"
                variant="ghost"
                loading={history.isFetchingNextPage}
                onClick={() => history.fetchNextPage()}
              >
                Load earlier messages
              </Button>
            </div>
          )}
          {history.isPending && (
            <p className="text-center text-sm text-c-text-muted">
              Loading messages...
            </p>
          )}
          {history.isError && (
            <p role="alert" className="text-sm text-c-danger">
              Messages could not load.{' '}
              <button className="underline" onClick={() => history.refetch()}>
                Try again
              </button>
            </p>
          )}
          {!history.isPending && !history.isError && !entries.length && (
            <div className="py-16 text-center">
              <MessageCircle size={30} className="mx-auto text-c-blue" />
              <p className="mt-4 text-sm font-medium">
                Your team's conversation starts here.
              </p>
            </div>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              id={`project-message-${entry.id}`}
              tabIndex={-1}
              className={`group mb-4 flex items-end gap-2 rounded-lg outline-none focus:ring-2 focus:ring-c-blue ${entry.sender_id === me ? 'justify-end' : ''}`}
            >
              <div
                className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${entry.sender_id === me ? 'rounded-br-md bg-c-blue-soft' : 'rounded-bl-md bg-c-blue-wash'}`}
              >
                <p className="mb-2 text-[11px] font-semibold text-c-blue">
                  {entry.sender?.full_name || 'Former member'}
                </p>
                {entry.reply && (
                  <ReplyPreview
                    name={entry.reply.sender?.full_name || 'Former member'}
                    message={entry.reply}
                    onOpen={() => openOriginal(entry.reply)}
                  />
                )}
                <p className="whitespace-pre-wrap text-[13px] leading-6 [overflow-wrap:anywhere]">
                  {entry.body}
                </p>
                <div className="mt-2 flex items-center justify-end gap-3">
                  <time
                    dateTime={entry.created_at}
                    className="text-[10px] text-c-text-muted"
                  >
                    {new Date(entry.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <button
                    aria-label={`Reply to ${entry.sender?.full_name || 'message'}`}
                    onClick={() => {
                      setReply(entry)
                      input.current?.focus()
                    }}
                    className="rounded p-1 text-c-text-muted hover:text-c-blue"
                  >
                    <Reply size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        {!atBottom && (
          <button
            onClick={() => setAtBottom(true)}
            className="block w-full bg-c-blue-soft p-2 text-xs font-semibold text-c-blue"
          >
            Jump to latest messages
          </button>
        )}
        <form onSubmit={send} className="border-t border-c-border p-4 sm:p-5">
          {reply && (
            <ReplyPreview
              name={reply.sender?.full_name || 'member'}
              message={reply}
              onCancel={() => setReply(null)}
            />
          )}
          <div className="flex items-end gap-3 rounded-2xl border border-c-border bg-c-blue-wash/50 p-2 focus-within:border-c-blue/40">
            <textarea
              ref={input}
              aria-label="Project message"
              rows={2}
              maxLength={4000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message your team..."
              className="min-w-0 flex-1 resize-none bg-transparent p-2 text-sm outline-none"
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault()
                  void send(e)
                }
              }}
            />
            <Button
              type="submit"
              icon={Send}
              aria-label="Send project message"
              disabled={!draft.trim() || sending}
              loading={sending}
            />
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs text-c-danger">
              {error}
            </p>
          )}
        </form>
      </section>
      <Modal
        isOpen={!!original}
        onClose={() => setOriginal(null)}
        title="Original message"
      >
        <p className="mb-2 text-sm font-semibold">
          {original?.sender?.full_name}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]">
          {original?.body}
        </p>
      </Modal>
    </div>
  )
}
