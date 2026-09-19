import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  Info,
  ImagePlus,
  Mic,
  Square,
  X,
  MessageCircle,
  Phone,
  Search,
  Send,
  Reply,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { Avatar, Button, Modal } from '../components/ui'
import ContactDetails from '../components/messages/ContactDetails'
import MessageImage from '../components/messages/MessageImage'
import MessageAudio from '../components/messages/MessageAudio'
import ReplyPreview from '../components/messages/ReplyPreview'
import VoiceMessagePlayer from '../components/messages/VoiceMessagePlayer'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useAuthStore } from '../store/authStore'
import { useMessageInbox, useProjectInbox } from '../hooks/useMessages'
import { messages } from '../services/messages'
import { useVoiceCall } from '../components/calls/VoiceCallProvider'

function Conversation({
  person,
  me,
  onBack,
  onShowDetails,
  draft,
  onDraftChange,
}) {
  const voice = useVoiceCall()
  const recording = useVoiceRecorder(voice?.busy)
  const cache = useQueryClient()
  const setDraft = onDraftChange
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState(null)
  const [original, setOriginal] = useState(null)
  const [attachment, setAttachment] = useState(null)
  const [preview, setPreview] = useState('')
  const fileInput = useRef(null)
  const messageInput = useRef(null)
  useLayoutEffect(() => {
    const input = messageInput.current
    const resize = () => {
      input.style.height = 'auto'
      input.style.height = `${Math.min(input.scrollHeight, 144)}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draft])
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  const selectAttachment = (file) => {
    setAttachment(file)
    setPreview(file ? URL.createObjectURL(file) : '')
  }
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(!document.hidden)
  const [atBottom, setAtBottom] = useState(true)
  const bottom = useRef(null)
  const pendingSend = useRef(null)
  const mounted = useRef(true)
  const discardVoice = () => {
    if (pendingSend.current?.audioPath) {
      void messages.discardAudio(pendingSend.current.audioPath)
      pendingSend.current = null
    }
    recording.cancel()
  }
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (pendingSend.current?.audioPath && !pendingSend.current.sending)
        void messages.discardAudio(pendingSend.current.audioPath)
    }
  }, [])
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
    if (
      (!draft.trim() && !attachment && !recording.blob) ||
      sending ||
      recording.busy
    )
      return
    setSending(true)
    setError('')
    const body = draft.trim()
    if (
      pendingSend.current?.body !== body ||
      pendingSend.current?.file !== attachment ||
      pendingSend.current?.audio !== recording.blob ||
      pendingSend.current?.reply !== (reply?.id || null)
    ) {
      if (pendingSend.current?.audioPath)
        void messages.discardAudio(pendingSend.current.audioPath)
      pendingSend.current = {
        body,
        file: attachment,
        audio: recording.blob,
        reply: reply?.id || null,
        id: crypto.randomUUID(),
      }
    }
    const attempt = pendingSend.current
    attempt.sending = true
    try {
      if (attachment && !attempt.imagePath)
        attempt.imagePath = await messages.uploadImage(
          person.id,
          attachment,
          attempt.id,
        )
      if (recording.blob && !attempt.audioPath)
        attempt.audioPath = await messages.uploadAudio(
          person.id,
          recording.blob,
          attempt.id,
          recording.durationMs,
        )
      await messages.send(
        person.id,
        body,
        attempt.id,
        attempt.imagePath || null,
        attempt.audioPath
          ? { path: attempt.audioPath, durationMs: recording.durationMs }
          : null,
        attempt.reply,
      )
      setDraft('')
      setReply(null)
      selectAttachment(null)
      setAtBottom(true)
      pendingSend.current = null
      recording.cancel()
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['messages', me, person.id] }),
        cache.invalidateQueries({ queryKey: ['message-contacts', me] }),
      ])
    } catch (e) {
      if (!mounted.current && attempt.audioPath)
        void messages.discardAudio(attempt.audioPath)
      setError(
        e.code === '42501'
          ? 'You can only message accepted connections. Refresh your connections to continue.'
          : e.message ||
              'Message was not sent. Your draft is still here; try again.',
      )
    } finally {
      attempt.sending = false
      setSending(false)
    }
  }
  return (
    <section
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-c-surface shadow-sm"
      aria-label={`Conversation with ${person.full_name}`}
    >
      <header className="flex items-center gap-2.5 border-b border-c-border px-4 py-4 lg:px-5">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="rounded-xl p-2 hover:bg-c-blue-wash md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar
          name={person.full_name}
          src={person.avatar}
          size="lg"
          className="!h-10 !w-10"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">
            {person.full_name || person.username}
          </h2>
          <p className="mt-1 text-[11px] text-c-text-muted">
            Connected on CoLearn
          </p>
        </div>
        <button
          type="button"
          aria-label={`Voice call ${person.full_name || person.username}`}
          title={
            voice?.busy
              ? 'Finish your current call first'
              : 'Start a voice call'
          }
          disabled={!voice?.available || voice.busy || recording.busy}
          onClick={() => void voice.call(person)}
          className="rounded-xl bg-c-blue-wash p-2.5 text-c-blue transition hover:bg-c-blue-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Phone size={18} />
        </button>
        <button
          type="button"
          aria-label="Conversation details"
          onClick={onShowDetails}
          className="rounded-xl p-2 text-c-text-muted hover:bg-c-blue-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue xl:hidden"
        >
          <Info size={18} />
        </button>
      </header>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 lg:px-5"
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
            <h3 className="font-semibold">Say hello.</h3>
            <p className="mt-2 text-sm leading-6 text-c-text-muted">
              Your conversation starts here.
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
          const groupStart =
            separator ||
            entries[i - 1]?.sender_id !== entry.sender_id ||
            new Date(entry.created_at) - new Date(entries[i - 1]?.created_at) >
              300000
          return (
            <div
              key={entry.id}
              id={`message-${entry.id}`}
              tabIndex={-1}
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-c-blue"
            >
              {separator && (
                <p className="my-5 flex items-center gap-3 text-center text-[10px] text-c-text-muted">
                  <span
                    className="h-px flex-1 bg-c-border/70"
                    aria-hidden="true"
                  />
                  {day}
                  <span
                    className="h-px flex-1 bg-c-border/70"
                    aria-hidden="true"
                  />
                </p>
              )}
              <div
                className={`mb-2 flex items-end gap-2 ${groupStart ? 'mt-4' : ''} ${mine ? 'justify-end' : 'justify-start'}`}
              >
                {!mine && (
                  <div className="w-6 shrink-0 self-start pt-1">
                    {groupStart && (
                      <Avatar
                        name={person.full_name}
                        src={person.avatar}
                        size="sm"
                      />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[80%] ${mine ? 'rounded-br-md bg-c-blue-soft text-c-text' : 'rounded-bl-md bg-c-blue-wash text-c-text'}`}
                >
                  {entry.reply && (
                    <ReplyPreview
                      name={
                        entry.reply.sender_id === me ? 'You' : person.full_name
                      }
                      message={entry.reply}
                      onOpen={() => {
                        const element = document.getElementById(
                          `message-${entry.reply.id}`,
                        )
                        if (element) {
                          element.scrollIntoView({
                            block: 'center',
                            behavior: 'smooth',
                          })
                          element.focus({ preventScroll: true })
                        } else setOriginal(entry.reply)
                      }}
                    />
                  )}
                  {entry.image_path && <MessageImage path={entry.image_path} />}
                  {entry.audio_path && (
                    <MessageAudio
                      path={entry.audio_path}
                      durationMs={entry.audio_duration_ms}
                    />
                  )}
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-6 [overflow-wrap:anywhere]">
                    {entry.body}
                  </p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'text-c-blue/80' : 'text-c-text-muted'}`}
                  >
                    <button
                      type="button"
                      aria-label={`Reply to ${mine ? 'your message' : person.full_name}`}
                      title="Reply"
                      onClick={() => {
                        setReply(entry)
                        messageInput.current?.focus()
                      }}
                      className="mr-1 rounded p-1 text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue"
                    >
                      <Reply size={14} />
                    </button>
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
      <Modal
        isOpen={!!original}
        onClose={() => setOriginal(null)}
        title="Original message"
      >
        <p className="mb-3 text-sm font-semibold">
          {original?.sender_id === me ? 'You' : person.full_name}
        </p>
        {original?.image_path && <MessageImage path={original.image_path} />}
        {original?.audio_path && (
          <MessageAudio
            path={original.audio_path}
            durationMs={original.audio_duration_ms}
          />
        )}
        <p className="whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]">
          {original?.body}
        </p>
      </Modal>
      <form onSubmit={send} className="border-t border-c-border/70 p-3 lg:p-4">
        {reply && (
          <ReplyPreview
            name={reply.sender_id === me ? 'yourself' : person.full_name}
            message={reply}
            onCancel={() => setReply(null)}
          />
        )}
        {recording.busy && (
          <div
            className="mb-3 flex items-center gap-3 rounded-xl bg-c-blue-wash px-3 py-3"
            aria-label="Voice recording"
          >
            <span
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 text-xs">
              <p role="status" className="font-semibold">
                {recording.phase === 'requesting'
                  ? 'Allow microphone access…'
                  : recording.phase === 'processing'
                    ? 'Preparing your recording…'
                    : 'Recording voice message'}
              </p>
              <p className="mt-1 tabular-nums text-c-text-muted">
                {Math.floor(recording.durationMs / 60000)}:
                {String(Math.floor(recording.durationMs / 1000) % 60).padStart(
                  2,
                  '0',
                )}{' '}
                / 2:00
              </p>
            </div>
            {recording.phase === 'recording' && (
              <button
                type="button"
                aria-label="Stop recording"
                onClick={recording.stop}
                className="rounded-lg bg-c-action p-2 text-white"
              >
                <Square size={16} fill="currentColor" />
              </button>
            )}
            <button
              type="button"
              aria-label="Cancel recording"
              onClick={discardVoice}
              className="rounded-lg p-2 text-c-text-muted hover:bg-c-surface"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {recording.blob && recording.url && (
          <div
            className="mb-3 rounded-xl border border-c-border bg-c-blue-wash px-3 py-2"
            aria-label="Voice message preview"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-xs font-medium">Ready to send</span>
              <button
                type="button"
                disabled={sending}
                aria-label="Discard voice message"
                onClick={discardVoice}
                className="rounded p-1 text-c-text-muted hover:bg-c-surface"
              >
                <X size={16} />
              </button>
            </div>
            <VoiceMessagePlayer
              src={recording.url}
              durationMs={recording.durationMs}
              label="Preview voice message"
            />
          </div>
        )}
        {preview && (
          <div className="mb-3 flex items-center gap-3">
            <img
              src={preview}
              alt="Image ready to send"
              className="h-20 w-20 rounded-xl object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-xs text-c-text-muted">
              {attachment.name}
            </span>
            <button
              type="button"
              disabled={sending}
              aria-label="Remove image"
              onClick={() => selectAttachment(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {(error || recording.error) && (
          <p role="alert" className="mb-2 text-sm text-c-danger">
            {error || recording.error}
          </p>
        )}
        <div className="flex items-end gap-1 rounded-xl border border-c-border bg-c-blue-wash/50 p-1.5 transition-colors focus-within:border-c-blue/50 sm:p-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Attach one image"
            disabled={sending || recording.busy || !!recording.blob}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                selectAttachment(file)
                setError('')
              }
              event.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={sending || recording.busy || !!recording.blob}
            aria-label="Attach image"
            title="Attach image"
            onClick={() => fileInput.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-c-blue transition-colors hover:bg-c-blue-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ImagePlus size={19} />
          </button>
          <button
            type="button"
            aria-label="Record voice message"
            title={
              voice?.busy
                ? 'Finish the call before recording'
                : 'Record a voice message'
            }
            disabled={
              sending ||
              recording.busy ||
              !!recording.blob ||
              !!attachment ||
              voice?.busy
            }
            onClick={() => {
              setError('')
              void recording.start()
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-c-blue transition-colors hover:bg-c-blue-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mic size={19} />
          </button>
          <textarea
            ref={messageInput}
            aria-label="Message"
            placeholder={`Message ${person.full_name.split(' ')[0] || person.username}…`}
            value={draft}
            disabled={sending || recording.busy}
            maxLength={4000}
            rows={1}
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
            className="min-h-10 max-h-36 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-1 py-2 text-sm leading-6 outline-none focus-visible:outline-none sm:px-2"
          />
          <Button
            type="submit"
            aria-label="Send message"
            disabled={
              recording.busy ||
              (!draft.trim() && !attachment && !recording.blob)
            }
            loading={sending}
            icon={Send}
            title="Send message"
            className="!h-10 !w-10 shrink-0 !rounded-lg !p-0 !shadow-none"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-3 px-1 text-[10px] leading-4 text-c-text-muted sm:justify-between">
          <span className="hidden sm:inline">
            Enter to send · Shift + Enter for a new line
          </span>
          <span className="shrink-0 tabular-nums">{draft.length}/4000</span>
        </div>
      </form>
    </section>
  )
}

export default function Messages() {
  const me = useAuthStore((state) => state.user?.id)
  const inbox = useMessageInbox()
  const projectInbox = useProjectInbox()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [detailsFor, setDetailsFor] = useState(null)
  const contacts = inbox.data || []
  const groups = (projectInbox.data || []).filter(
    (group) =>
      (!unreadOnly || group.unread_count > 0) &&
      group.title.toLowerCase().includes(search.toLowerCase()),
  )
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="inline-flex items-center gap-2.5 !text-2xl !font-bold !tracking-tight">
          Messages
          <span
            aria-hidden="true"
            className="mt-1 h-2 w-2 rounded-full bg-c-yellow"
          />
        </h1>
        <Link
          to="/people"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-c-blue hover:bg-c-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          Find people
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div
        className={`grid h-[calc(100dvh-250px)] min-h-[360px] max-h-[900px] gap-3 md:h-[calc(100dvh-200px)] md:min-h-[460px] md:grid-cols-[230px_minmax(0,1fr)] ${selected ? 'xl:grid-cols-[240px_minmax(0,1fr)_210px]' : ''}`}
      >
        <aside
          aria-label="Conversations"
          className={`${selected ? 'hidden md:flex' : 'flex'} min-h-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-c-surface shadow-sm`}
        >
          <div className="space-y-4 p-4 pb-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Inbox</h2>
              <span className="rounded-full bg-c-blue-wash px-2 py-0.5 text-[10px] font-medium text-c-text-muted">
                {contacts.length}
              </span>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-c-border px-3 py-2.5 focus-within:border-c-blue">
              <Search
                size={15}
                className="shrink-0 text-c-text-muted"
                aria-hidden="true"
              />
              <input
                aria-label="Search connections"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="w-full min-w-0 bg-transparent text-xs outline-none"
              />
            </label>
            <div className="flex gap-1">
              {[
                ['All', false],
                ['Unread', true],
              ].map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => setUnreadOnly(value)}
                  aria-pressed={unreadOnly === value}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${unreadOnly === value ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted hover:bg-c-blue-wash'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {groups.length > 0 && (
              <section
                aria-label="Project conversations"
                className="mb-3 border-b border-c-border pb-3"
              >
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-c-text-muted">
                  Project teams
                </p>
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/projects/${group.slug}/chat`}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-c-blue-wash"
                  >
                    <span className="rounded-xl bg-c-blue-soft p-2 text-c-blue">
                      <Users size={17} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {group.title}
                    </span>
                    {group.unread_count > 0 && (
                      <span className="rounded-full bg-c-danger-solid px-1.5 py-0.5 text-[10px] text-white">
                        {group.unread_count > 99 ? '99+' : group.unread_count}
                      </span>
                    )}
                  </Link>
                ))}
              </section>
            )}
            {projectInbox.isError && (
              <p role="alert" className="p-3 text-xs text-c-danger">
                Project conversations could not load.{' '}
                <button
                  onClick={() => projectInbox.refetch()}
                  className="underline"
                >
                  Retry
                </button>
              </p>
            )}
            {inbox.isPending && (
              <p role="status" className="p-4 text-xs text-c-text-muted">
                Loading conversations?
              </p>
            )}
            {inbox.isError && (
              <p role="alert" className="p-4 text-xs text-c-danger">
                Could not load conversations.{' '}
                <button className="underline" onClick={() => inbox.refetch()}>
                  Retry
                </button>
              </p>
            )}
            {!inbox.isPending && !inbox.isError && !filtered.length && (
              <p className="p-4 text-xs leading-5 text-c-text-muted">
                {search || unreadOnly
                  ? 'No conversations found.'
                  : 'Connect with someone in People to start chatting.'}
              </p>
            )}
            {filtered.map((person) => (
              <button
                key={person.id}
                onClick={() => setParams({ to: person.id })}
                aria-current={selected?.id === person.id ? 'true' : undefined}
                className={`mb-1 flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-blue ${selected?.id === person.id ? 'border-c-blue/10 bg-c-blue-soft/70' : 'border-transparent hover:bg-c-blue-wash'}`}
              >
                <Avatar
                  src={person.avatar}
                  name={person.full_name}
                  size="lg"
                  className="!h-9 !w-9 !text-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate text-xs font-semibold">
                      {person.full_name || person.username}
                    </p>
                    {person.last_message_at && (
                      <time
                        dateTime={person.last_message_at}
                        className="shrink-0 text-[9px] text-c-text-muted"
                      >
                        {new Date(person.last_message_at).toDateString() ===
                        new Date().toDateString()
                          ? new Date(person.last_message_at).toLocaleTimeString(
                              undefined,
                              { hour: '2-digit', minute: '2-digit' },
                            )
                          : new Date(person.last_message_at).toLocaleDateString(
                              undefined,
                              { month: 'short', day: 'numeric' },
                            )}
                      </time>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-c-text-muted">
                      {person.last_sender_id === me ? 'You: ' : ''}
                      {person.last_message || 'Start a conversation'}
                    </p>
                    {person.unread_count > 0 && (
                      <span
                        aria-label={`${person.unread_count} unread messages`}
                        className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-c-action px-1 text-[9px] font-semibold text-white"
                      >
                        {person.unread_count > 99 ? '99+' : person.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="flex items-center gap-2 border-t border-c-border/70 p-4 text-[10px] text-c-text-muted">
            <ShieldCheck size={13} aria-hidden="true" />
            Your connections and project teams
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
              onShowDetails={() => setDetailsFor(selected.id)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-c-border bg-c-surface p-8 text-center shadow-sm">
              <div className="mb-5 rounded-2xl bg-c-blue-soft p-5 text-c-blue">
                <MessageCircle size={30} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold">Start a conversation</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-c-text-muted">
                {params.get('to')
                  ? 'Connect with this person in People to message them.'
                  : 'Choose a connection from your inbox.'}
              </p>
            </div>
          )}
        </div>
        {selected && (
          <aside
            aria-label="Contact profile"
            className="hidden min-h-0 overflow-y-auto rounded-2xl border border-c-border bg-c-surface shadow-sm xl:block"
          >
            <ContactDetails key={selected.id} person={selected} />
          </aside>
        )}
      </div>
      <Modal
        isOpen={Boolean(selected && detailsFor === selected.id)}
        onClose={() => setDetailsFor(null)}
        title="Contact details"
        size="sm"
      >
        {selected && <ContactDetails person={selected} />}
      </Modal>
    </div>
  )
}
