import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Flag,
  MessageCircle,
  Pencil,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Chip,
  EmptyState,
  Modal,
  RichText,
  Select,
  Textarea,
  useToast,
} from '../components/ui'
import MentionTextarea from '../components/community/MentionTextarea'
import { supabase } from '../services/supabase/client'
import { community } from '../services/api.js'
import { useInFlight } from '../hooks/useInFlight.js'
import { formatRelative } from '../lib/formatters.js'
import { useAuthStore } from '../store/authStore'

import { useMentionRead } from '../hooks/useMentionRead'

const reportReasons = [
  'Spam or advertising',
  'Harassment or abuse',
  'Off-topic',
  'Misleading or incorrect',
  'Other',
]

function VotePill({ votes, userVote, onVote, disabled, size = 'md' }) {
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div
      className={`flex items-center gap-2 rounded-brand border px-2 py-1 ${userVote ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border text-c-text-muted'}`}
      title={disabled ? "You can't vote on your own post" : undefined}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        className="disabled:opacity-40"
      >
        <ThumbsUp className={icon} />
      </button>
      <span className="font-bold" aria-label="Score">
        {votes}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        className="disabled:opacity-40"
      >
        <ThumbsDown className={icon} />
      </button>
    </div>
  )
}

function Comment({ comment, ctx }) {
  const { thread, me, replyTo, setReplyTo, replyBody, setReplyBody } = ctx
  const isOwn = comment.author.id === me.id
  const canManage = isOwn || me.isStaff
  const editing = ctx.editing?.id === comment.id
  return (
    <div
      id={`comment-${comment.id}`}
      className="flex scroll-mt-24 gap-3 rounded-xl px-3 py-5 target:bg-c-yellow-soft sm:px-5"
      data-comment-id={comment.id}
    >
      <Avatar
        src={comment.author.avatar}
        name={comment.author.fullName}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/u/${comment.author.username}`}
            className="font-semibold text-c-text hover:text-c-blue"
          >
            {comment.author.fullName}
          </Link>
          {comment.author.id === thread.author.id && (
            <Badge variant="blue" size="sm">
              OP
            </Badge>
          )}
          <span className="text-xs text-c-text-muted">
            {formatRelative(comment.createdAt)}
          </span>
        </div>
        {editing ? (
          <form onSubmit={ctx.saveEdit} className="mt-2 space-y-2">
            <MentionTextarea
              value={ctx.editing.body}
              onChange={(event) =>
                ctx.setEditing({ ...ctx.editing, body: event.target.value })
              }
              rows={3}
              aria-label="Edit comment"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => ctx.setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!ctx.editing.body.trim()}
              >
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div data-mention-id={comment.id}>
            <RichText
              text={comment.body}
              mentions={comment.mentions || []}
              className="mt-2 text-sm leading-6 text-c-text"
            />
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <VotePill
            size="sm"
            votes={comment.votes}
            userVote={comment.userVote}
            disabled={isOwn}
            onVote={(value) => ctx.voteComment(comment, value)}
          />
          <button
            type="button"
            onClick={() => {
              setReplyTo(comment)
              setReplyBody('')
            }}
            className="text-xs font-semibold text-c-text-muted hover:text-c-blue"
          >
            Reply
          </button>
          {canManage && !editing && (
            <>
              {isOwn && (
                <button
                  type="button"
                  onClick={() =>
                    ctx.setEditing({ id: comment.id, body: comment.body })
                  }
                  className="flex items-center gap-1 text-xs text-c-text-muted hover:text-c-blue"
                  aria-label="Edit comment"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => ctx.askDeleteComment(comment)}
                className="flex items-center gap-1 text-xs text-c-text-muted hover:text-c-danger"
                aria-label="Delete comment"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </>
          )}
          {!isOwn && (
            <button
              type="button"
              onClick={() => ctx.openReport('comment', comment.id)}
              className="flex items-center gap-1 text-xs text-c-text-muted hover:text-c-danger"
              aria-label="Report comment"
            >
              <Flag className="h-3 w-3" /> Report
            </button>
          )}
        </div>
        {replyTo?.id === comment.id && (
          <form
            onSubmit={(event) => ctx.submitComment(event, comment.id)}
            className="mt-3 space-y-2"
          >
            <MentionTextarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={3}
              placeholder={`Reply to ${comment.author.fullName}...`}
              aria-label={`Reply to ${comment.author.fullName}`}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                icon={Send}
                loading={ctx.posting}
                disabled={!replyBody.trim()}
              >
                Reply
              </Button>
            </div>
          </form>
        )}
        {comment.replies?.length > 0 && (
          <div className="mt-4 space-y-4 border-l-2 border-c-border pl-4">
            {comment.replies.map((reply) => (
              <Comment key={reply.id} comment={reply} ctx={ctx} />
            ))}
          </div>
        )}
        {comment.replyCount > (comment.replies?.length || 0) && (
          <Button
            size="sm"
            variant="ghost"
            loading={ctx.loadingHistory}
            onClick={() => ctx.loadHistory(comment)}
          >
            Load earlier replies
          </Button>
        )}
      </div>
    </div>
  )
}

// Apply `change` to the comment with this id anywhere in the (two-level) tree.
const mapComments = (comments, id, change) =>
  comments.map((comment) =>
    comment.id === id
      ? { ...comment, ...change }
      : { ...comment, replies: mapComments(comment.replies || [], id, change) },
  )

export default function ThreadDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const inFlight = useInFlight()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const me = { id: String(user?.id), isStaff: Boolean(user?.isStaff) }
  const [thread, setThread] = useState(null)
  const [error, setError] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [topBody, setTopBody] = useState('')
  useMentionRead(thread)
  const [posting, setPosting] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null) // { title, description, run }
  const [report, setReport] = useState(null) // { kind, id }
  const [reason, setReason] = useState(reportReasons[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const load = useCallback(async () => {
    const { thread: result } = await community.getThread(slug)
    setThread(result)
  }, [slug])

  useEffect(() => {
    let active = true
    community
      .getThread(slug)
      .then(({ thread: result }) => active && setThread(result))
      .catch((requestError) => {
        if (active)
          setError(
            requestError?.code === 'not_found'
              ? 'This discussion could not be found.'
              : requestError?.message || 'This discussion could not be loaded.',
          )
      })
    return () => {
      active = false
    }
  }, [slug, location.hash])

  useEffect(() => {
    if (!thread?.id) return
    let timer
    const channel = supabase
      .channel(`comments:${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `thread_id=eq.${thread.id}`,
        },
        () => {
          clearTimeout(timer)
          timer = setTimeout(() => void load().catch(() => {}), 250)
        },
      )
      .subscribe()
    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [thread?.id, load])
  useEffect(() => {
    if (location.hash.startsWith('#comment-') && thread)
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [location.hash, thread])

  const loadHistory = async (parentComment = null) => {
    if (loadingHistory) return
    setLoadingHistory(true)
    try {
      const before = parentComment
        ? Math.min(...parentComment.replies.map((reply) => Number(reply.id)))
        : thread.nextCommentCursor
      const result = await community.getCommentHistory(slug, {
        before,
        parent: parentComment?.id,
      })
      setThread((current) =>
        parentComment
          ? {
              ...current,
              comments: mapComments(current.comments, parentComment.id, {
                replies: [
                  ...parentComment.replies,
                  ...result.comments.filter(
                    (reply) =>
                      !parentComment.replies.some((old) => old.id === reply.id),
                  ),
                ],
              }),
            }
          : {
              ...current,
              comments: [
                ...current.comments,
                ...result.comments.filter(
                  (comment) =>
                    !current.comments.some((old) => old.id === comment.id),
                ),
              ],
              nextCommentCursor: result.nextCursor,
            },
      )
    } catch (e) {
      toast.error(e.message || 'Earlier comments could not load')
    } finally {
      setLoadingHistory(false)
    }
  }

  const voteThread = (value) =>
    inFlight('vote-thread', () => castThreadVote(value))
  const castThreadVote = async (value) => {
    try {
      const { score, userVote } = await community.vote(
        'thread',
        thread.id,
        value,
      )
      setThread((current) => ({ ...current, votes: score, userVote }))
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not record your vote')
    }
  }
  const voteComment = (comment, value) =>
    inFlight(`vote-comment-${comment.id}`, () =>
      castCommentVote(comment, value),
    )
  const castCommentVote = async (comment, value) => {
    try {
      const { score, userVote } = await community.vote(
        'comment',
        comment.id,
        value,
      )
      setThread((current) => ({
        ...current,
        comments: mapComments(current.comments, comment.id, {
          votes: score,
          userVote,
        }),
      }))
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not record your vote')
    }
  }
  // parentId: the comment being replied to (omit for a top-level comment).
  const submitComment = async (event, parentId) => {
    event.preventDefault()
    const body = (parentId ? replyBody : topBody).trim()
    if (!body) return
    setPosting(true)
    try {
      await community.createComment(thread.slug, { body, parentId })
      await load() // the server decides where a reply lives and updates the counts
      if (parentId) {
        setReplyBody('')
        setReplyTo(null)
      } else {
        setTopBody('')
      }
      toast.success('Comment posted')
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not post your comment')
    } finally {
      setPosting(false)
    }
  }
  const saveEdit = async (event) => {
    event.preventDefault()
    try {
      const { comment } = await community.updateComment(
        editing.id,
        editing.body.trim(),
      )
      setThread((current) => ({
        ...current,
        comments: mapComments(current.comments, comment.id, {
          body: comment.body,
          updatedAt: comment.updatedAt,
        }),
      }))
      setEditing(null)
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not save your edit')
    }
  }
  const runConfirm = async () => {
    setBusy(true)
    try {
      await confirm.run()
      setConfirm(null)
    } catch (requestError) {
      toast.error(requestError?.message || 'That did not work')
    } finally {
      setBusy(false)
    }
  }
  const askDeleteComment = (comment) =>
    setConfirm({
      title: 'Delete this comment?',
      description: 'Replies to it are deleted too. This cannot be undone.',
      run: async () => {
        await community.deleteComment(comment.id)
        await load()
        toast.success('Comment deleted')
      },
    })
  const askDeleteThread = () =>
    setConfirm({
      title: 'Delete this discussion?',
      description: 'The discussion and all of its comments will be removed.',
      run: async () => {
        await community.deleteThread(thread.slug)
        navigate('/community', { replace: true })
      },
    })
  const submitReport = async () => {
    if (busy) return
    setBusy(true)
    try {
      const text = details.trim() ? `${reason}: ${details.trim()}` : reason
      const result = await community.report(
        report.kind,
        report.id,
        text.slice(0, 255),
      )
      toast.success(
        result.alreadyReported ? 'Already reported' : 'Report received',
        result.alreadyReported
          ? 'Our moderators already have this one'
          : 'Thanks for helping keep Colearn useful',
      )
      setReport(null)
      setDetails('')
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not send your report')
    } finally {
      setBusy(false)
    }
  }
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied', 'Discussion link is ready to share')
    } catch {
      toast.info('Copy the link from your browser address bar')
    }
  }

  if (error)
    return (
      <EmptyState
        title="Discussion not found"
        description={error}
        actionLabel="Back to community"
        actionTo="/community"
      />
    )
  if (!thread)
    return (
      <div className="space-y-5">
        <div className="h-12 w-3/4 animate-pulse rounded-brand bg-c-border/75" />
        <div className="h-48 animate-pulse rounded-brand-lg bg-c-border/75" />
        <div className="h-32 animate-pulse rounded-brand-lg bg-c-border/75" />
      </div>
    )
  const isOwnThread = thread.author.id === me.id
  const ctx = {
    thread,
    loadHistory,
    loadingHistory,
    me,
    replyTo,
    setReplyTo,
    replyBody,
    setReplyBody,
    editing,
    setEditing,
    saveEdit,
    voteComment,
    submitComment,
    askDeleteComment,
    openReport: (kind, id) => setReport({ kind, id }),
    posting,
  }
  return (
    <div className="mx-auto max-w-4xl pb-16">
      <Link
        to="/community"
        className="text-sm font-semibold text-c-text-muted hover:text-c-blue"
      >
        Back to community
      </Link>
      <article className="mt-6 rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link
            to={`/u/${thread.author.username}`}
            className="flex items-center gap-3"
          >
            <Avatar
              src={thread.author.avatar}
              name={thread.author.fullName}
              size="lg"
            />
            <div>
              <p className="font-bold text-c-text">{thread.author.fullName}</p>
              <p className="text-sm text-c-text-muted">
                {formatRelative(thread.createdAt)} · {thread.views} views
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <VotePill
              votes={thread.votes}
              userVote={thread.userVote}
              disabled={isOwnThread}
              onVote={voteThread}
            />
            <button
              type="button"
              onClick={share}
              className="rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue"
              aria-label="Share thread"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {!isOwnThread && (
              <button
                type="button"
                onClick={() => setReport({ kind: 'thread', id: thread.id })}
                className="rounded-brand p-2 text-c-text-muted hover:bg-c-danger-soft hover:text-c-danger"
                aria-label="Report thread"
              >
                <Flag className="h-4 w-4" />
              </button>
            )}
            {(isOwnThread || me.isStaff) && (
              <button
                type="button"
                onClick={askDeleteThread}
                className="rounded-brand p-2 text-c-text-muted hover:bg-c-danger-soft hover:text-c-danger"
                aria-label="Delete thread"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <h1 className="mt-6 !text-2xl !font-semibold !leading-snug text-c-text sm:!text-3xl">
          {thread.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>{thread.category}</Chip>
          {thread.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        <div data-mention-id="post">
          <RichText
            text={thread.body}
            className="mt-6 max-w-3xl text-sm leading-7 text-c-text sm:text-base"
          />
        </div>
      </article>
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="!text-xl !font-semibold text-c-text">
            {thread.commentCount}{' '}
            {thread.commentCount === 1 ? 'comment' : 'comments'}
          </h2>
          <span className="flex items-center gap-1 text-sm text-c-text-muted">
            <MessageCircle className="h-4 w-4" />
            Newest first
          </span>
        </div>
        <div className="mt-5 divide-y divide-c-border overflow-hidden rounded-2xl border border-c-border bg-c-surface">
          {thread.comments.length ? (
            thread.comments.map((comment) => (
              <Comment key={comment.id} comment={comment} ctx={ctx} />
            ))
          ) : (
            <p className="p-5 text-sm text-c-text-muted">
              No comments yet. Be the first to help.
            </p>
          )}
        </div>
        {thread.nextCommentCursor && (
          <Button
            className="mt-5"
            variant="outline"
            loading={loadingHistory}
            onClick={() => loadHistory()}
          >
            Load earlier comments
          </Button>
        )}
      </section>
      <form
        onSubmit={(event) => submitComment(event, null)}
        className="mt-8 rounded-2xl border border-c-border bg-c-surface p-4 sm:p-5"
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Avatar src={user?.avatar} name={user?.fullName || 'You'} size="sm" />
          <div className="min-w-0 flex-1">
            <MentionTextarea
              value={topBody}
              onChange={(event) => setTopBody(event.target.value)}
              rows={2}
              placeholder="Add to the conversation. Type @ to mention a connection."
              aria-label="Write a comment"
            />
          </div>
          <Button
            type="submit"
            icon={Send}
            loading={posting && !replyTo}
            disabled={!topBody.trim()}
            aria-label="Post comment"
          >
            Post
          </Button>
        </div>
      </form>
      <Modal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={runConfirm}>
            Delete
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(report)}
        onClose={() => setReport(null)}
        title={`Report this ${report?.kind || 'post'}`}
        description="Tell us what is wrong. A moderator will take a look."
      >
        <div className="space-y-4">
          <Select
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            options={reportReasons}
          />
          <Textarea
            label="Details (optional)"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            maxLength={200}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReport(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={submitReport}>
              Send report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
