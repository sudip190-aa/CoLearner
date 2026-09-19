import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { useMessageInbox } from '../hooks/useMessages'
import { messages } from '../services/messages'

function Conversation({ person, me, onBack, draft, onDraftChange }) {
  const cache = useQueryClient()
  const setDraft = onDraftChange
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(!document.hidden)
  const [atBottom, setAtBottom] = useState(true)
  const bottom = useRef(null)
  const pendingSend = useRef(null)
  const history = useInfiniteQuery({
    queryKey: ['messages', me, person.id],
    queryFn: ({ pageParam }) => messages.history(person.id, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (page) => (page.length === 50 ? page[0] : undefined),
    refetchInterval: 15000,
  })
  const entries = [...(history.data?.pages || [])].reverse().flat()
  const latest = entries.at(-1)?.id
  const unread = entries
    .filter((m) => m.recipient_id === me && !m.read_at)
    .at(-1)?.created_at
  useEffect(() => {
    if (atBottom)
      bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [latest, atBottom])
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!unread || !visible || !atBottom) return
    let active = true
    void messages
      .read(person.id, unread)
      .then(() => {
        if (active)
          void cache.invalidateQueries({ queryKey: ['message-contacts', me] })
      })
      .catch(() => {
        /* Retry on the next history refresh; never mark unseen messages. */
      })
    return () => {
      active = false
    }
  }, [person.id, unread, visible, atBottom, cache, me])
  const send = async (event) => {
    event.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    setError('')
    const body = draft.trim()
    if (pendingSend.current?.body !== body)
      pendingSend.current = { body, id: crypto.randomUUID() }
    try {
      await messages.send(person.id, body, pendingSend.current.id)
      setDraft('')
      setAtBottom(true)
      pendingSend.current = null
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['messages', me, person.id] }),
        cache.invalidateQueries({ queryKey: ['message-contacts', me] }),
      ])
    } catch (e) {
      setError(
        e.code === '42501'
          ? 'You can only message accepted connections. Refresh your connections to continue.'
          : e.message ||
              'Message was not sent. Your draft is still here; try again.',
      )
    } finally {
      setSending(false)
    }
  }
  return (
    <section
      className="flex h-full min-w-0 flex-col bg-white"
      aria-label={`Conversation with ${person.full_name}`}
    >
      <header className="flex items-center gap-3 border-b border-c-border px-4 py-4 sm:px-6">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="rounded-xl p-2 hover:bg-c-blue-wash md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar name={person.full_name} src={person.avatar} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">
            {person.full_name || person.username}
          </h2>
          <p className="mt-1 text-xs text-c-text-muted">Connected on CoLearn</p>
        </div>
        <Link
          aria-label={`View ${person.full_name}'s profile`}
          to={`/u/${person.username}`}
          className="rounded-xl p-2 text-c-blue hover:bg-c-blue-wash"
        >
          <ArrowUpRight size={20} />
        </Link>
      </header>
      <div
        className="min-h-0 flex-1 overflow-y-auto bg-c-blue-wash/40 px-4 py-6 sm:px-6"
        role="log"
        onScroll={(event) => {
          const el = event.currentTarget
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
        }}
        aria-label="Messages"
        aria-live="polite"
      >
        {history.hasNextPage && (
          <div className="mb-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              loading={history.isFetchingNextPage}
              onClick={() => history.fetchNextPage()}
            >
              Load earlier messages
            </Button>
          </div>
        )}
        {history.isPending && (
          <p className="text-center text-sm text-c-text-muted">
            Loading conversation…
          </p>
        )}
        {history.isError && (
          <div role="alert" className="text-center text-sm text-c-danger">
            Messages could not load.{' '}
            <button className="underline" onClick={() => history.refetch()}>
              Try again
            </button>
          </div>
        )}
        {!history.isPending && !entries.length && !history.isError && (
          <div className="mx-auto max-w-xs py-12 text-center">
            <MessageCircle className="mx-auto mb-4 text-c-blue" size={32} />
            <h3 className="font-semibold">A conversation starts with hello.</h3>
            <p className="mt-2 text-sm leading-6 text-c-text-muted">
              Share an idea, ask a question, or plan your next project together.
            </p>
          </div>
        )}
        {entries.map((entry, i) => {
          const mine = entry.sender_id === me
          const day = new Date(entry.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
          const separator =
            i === 0 ||
            new Date(entries[i - 1].created_at).toDateString() !==
              new Date(entry.created_at).toDateString()
          return (
            <div key={entry.id}>
              {separator && (
                <p className="my-5 text-center text-[11px] font-medium text-c-text-muted">
                  {day}
                </p>
              )}
              <div
                className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine ? 'rounded-br-sm bg-c-blue text-white' : 'rounded-bl-sm border border-c-border bg-white text-c-text'}`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                    {entry.body}
                  </p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'text-white/80' : 'text-c-text-muted'}`}
                  >
                    <time dateTime={entry.created_at}>
                      {new Date(entry.created_at).toLocaleTimeString(
                        undefined,
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                    </time>
                    {mine && (
                      <span
                        title={entry.read_at ? 'Read' : 'Sent'}
                        aria-label={entry.read_at ? 'Read' : 'Sent'}
                      >
                        {entry.read_at ? (
                          <CheckCheck size={13} />
                        ) : (
                          <Check size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>
      {!atBottom && (
        <button
          type="button"
          className="border-t border-c-border bg-c-blue-soft py-2 text-xs font-semibold text-c-blue"
          onClick={() => {
            bottom.current?.scrollIntoView({ block: 'nearest' })
            setAtBottom(true)
          }}
        >
          Jump to latest messages ↓
        </button>
      )}
      <form onSubmit={send} className="border-t border-c-border p-4 sm:px-6">
        {error && (
          <p role="alert" className="mb-2 text-sm text-c-danger">
            {error}
          </p>
        )}
        <div className="flex items-end gap-3 rounded-2xl border border-c-border bg-c-blue-wash/40 p-2 focus-within:border-c-blue">
          <textarea
            aria-label="Message"
            placeholder={`Message ${person.full_name.split(' ')[0] || person.username}…`}
            value={draft}
            disabled={sending}
            maxLength={4000}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault()
                e.currentTarget.form.requestSubmit()
              }
            }}
            className="max-h-36 min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none"
          />
          <Button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim()}
            loading={sending}
            icon={Send}
          />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-[10px] text-c-text-muted">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span>{draft.length}/4000</span>
        </div>
      </form>
    </section>
  )
}

export default function Messages() {
  const me = useAuthStore((state) => state.user?.id)
  const inbox = useMessageInbox()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [drafts, setDrafts] = useState({})
  const contacts = inbox.data || []
  const selected = contacts.find((p) => p.id === params.get('to'))
  const filtered = contacts.filter(
    (p) =>
      (!unreadOnly || p.unread_count > 0) &&
      `${p.full_name} ${p.username}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-c-blue">
            Your circle
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Messages</h1>
          <p className="mt-2 text-sm text-c-text-muted">
            Good ideas get better together.
          </p>
        </div>
        <Link to="/people" className="text-sm font-semibold text-c-blue">
          Find people <ArrowUpRight className="inline" size={16} />
        </Link>
      </div>
      <div className="grid h-[calc(100dvh-320px)] min-h-[320px] overflow-hidden rounded-3xl border border-c-border bg-white shadow-sm md:h-[min(720px,calc(100dvh-240px))] md:min-h-[460px] md:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`${selected ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-c-border`}
        >
          <div className="space-y-3 border-b border-c-border p-4">
            <label className="flex items-center gap-2 rounded-xl bg-c-blue-wash px-3 py-2.5">
              <Search size={16} className="text-c-text-muted" />
              <input
                aria-label="Search connections"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a conversation"
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </label>
            <div className="flex gap-2">
              {[
                ['All', false],
                ['Unread', true],
              ].map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => setUnreadOnly(value)}
                  aria-pressed={unreadOnly === value}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${unreadOnly === value ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted hover:bg-c-blue-wash'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {inbox.isPending && (
              <p className="p-4 text-sm text-c-text-muted">
                Loading connections…
              </p>
            )}
            {inbox.isError && (
              <p role="alert" className="p-4 text-sm text-c-danger">
                Could not load your connections.{' '}
                <button className="underline" onClick={() => inbox.refetch()}>
                  Retry
                </button>
              </p>
            )}
            {!inbox.isPending && !inbox.isError && !filtered.length && (
              <div className="p-5 text-sm leading-6 text-c-text-muted">
                {search || unreadOnly
                  ? 'No conversations match this filter.'
                  : 'Your accepted connections appear here. Connect with someone in People to start chatting.'}
              </div>
            )}
            {filtered.map((person) => (
              <button
                key={person.id}
                onClick={() => setParams({ to: person.id })}
                aria-current={selected?.id === person.id ? 'true' : undefined}
                className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected?.id === person.id ? 'bg-c-blue-soft' : 'hover:bg-c-blue-wash'}`}
              >
                <Avatar src={person.avatar} name={person.full_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {person.full_name || person.username}
                  </p>
                  <p className="mt-1 truncate text-xs text-c-text-muted">
                    {person.last_sender_id === me ? 'You: ' : ''}
                    {person.last_message || 'Say hello 👋'}
                  </p>
                </div>
                {person.unread_count > 0 && (
                  <span className="rounded-full bg-c-blue px-2 py-0.5 text-[10px] font-bold text-white">
                    {person.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-2 border-t border-c-border p-4 text-[11px] text-c-text-muted">
            <ShieldCheck size={14} /> Only accepted connections can message.
          </p>
        </aside>
        <div
          className={`${selected ? 'block' : 'hidden md:block'} min-h-0 min-w-0`}
        >
          {selected ? (
            <Conversation
              key={selected.id}
              person={selected}
              me={me}
              draft={drafts[selected.id] || ''}
              onDraftChange={(value) =>
                setDrafts((previous) => ({ ...previous, [selected.id]: value }))
              }
              onBack={() => setParams({})}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-5 rounded-3xl bg-c-blue-soft p-6 text-c-blue">
                <MessageCircle size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold">
                Make room for a good conversation.
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-c-text-muted">
                {params.get('to')
                  ? 'This person is not an accepted connection. Visit People to connect first.'
                  : 'Choose someone from your circle and start building something together.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
