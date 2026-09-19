import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  MessageCircle,
  Pin,
  Plus,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react'
import {
  Avatar,
  Button,
  EmptyState,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
  useToast,
} from '../components/ui'
import { community } from '../services/api.js'
import { useInFlight } from '../hooks/useInFlight.js'
import { formatRelative } from '../lib/formatters.js'
import { toPlainText } from '../lib/inlineMarkdown.js'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 6
const categories = [
  { value: '', label: 'All topics' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'product', label: 'Product' },
  { value: 'career', label: 'Career' },
  { value: 'community', label: 'Community' },
]

function ThreadSkeleton() {
  return (
    <div
      className="grid gap-5 lg:grid-cols-2"
      aria-label="Loading discussions"
      aria-busy="true"
    >
      {Array.from({ length: PAGE_SIZE }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-c-border bg-white"
        >
          <Skeleton height="44px" className="rounded-none" />
          <div className="space-y-4 p-5">
            <Skeleton width="85%" height="48px" />
            <Skeleton height="20px" />
            <Skeleton width="60%" height="32px" />
          </div>
        </div>
      ))}
    </div>
  )
}

function VotePill({ votes, userVote, onVote, disabled }) {
  return (
    <div
      className="flex shrink-0 items-center rounded-lg border border-c-border text-c-text-muted"
      role="group"
      aria-label="Discussion votes"
      title={disabled ? "You can't vote on your own post" : undefined}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        className={`flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:bg-c-blue-wash disabled:cursor-not-allowed disabled:opacity-40 ${userVote === 1 ? 'bg-c-blue-soft text-c-blue' : ''}`}
      >
        <ThumbsUp size={14} />
      </button>
      <span
        className={`min-w-5 text-center text-xs font-semibold tabular-nums ${userVote ? 'text-c-blue' : ''}`}
        aria-label="Score"
      >
        {votes}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        className={`flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:bg-c-blue-wash disabled:cursor-not-allowed disabled:opacity-40 ${userVote === -1 ? 'bg-c-blue-soft text-c-blue' : ''}`}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  )
}

function ThreadCard({ thread, onVote, isOwn }) {
  const topic =
    categories.find((item) => item.value === thread.category)?.label ||
    thread.category
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-white shadow-sm transition-[border-color,box-shadow] hover:border-c-blue/25 hover:shadow-md">
      <div className="flex h-11 items-center justify-between gap-3 bg-c-blue-wash px-5">
        <span className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-c-blue">
          {topic}
        </span>
        {thread.pinned && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-c-yellow-soft px-2 py-1 text-[10px] font-medium text-c-text">
            <Pin size={11} aria-hidden="true" />
            Pinned
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/community/${thread.slug}`}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          <h2 className="min-h-12 line-clamp-2 break-words !text-lg !font-semibold !leading-6 !tracking-tight transition-colors hover:text-c-blue">
            {thread.title}
          </h2>
        </Link>
        <p className="mt-2 line-clamp-1 break-words text-sm leading-6 text-c-text-muted">
          {toPlainText(thread.body)}
        </p>
        <div className="mb-4 mt-4 flex min-w-0 items-center gap-2.5">
          <Link
            to={`/u/${thread.author.username}`}
            className="flex min-w-0 items-center gap-2 text-xs text-c-text-muted hover:text-c-blue"
          >
            <Avatar
              src={thread.author.avatar}
              name={thread.author.fullName}
              size="sm"
            />
            <span className="truncate">{thread.author.fullName}</span>
          </Link>
          <span aria-hidden="true" className="text-c-border">
            &middot;
          </span>
          <time
            dateTime={thread.createdAt}
            className="shrink-0 text-[11px] text-c-text-muted"
          >
            {formatRelative(thread.createdAt)}
          </time>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-c-border/70 pt-3">
          <VotePill
            votes={thread.votes}
            userVote={thread.userVote}
            disabled={isOwn}
            onVote={(value) => onVote(thread, value)}
          />
          <Link
            to={`/community/${thread.slug}`}
            aria-label={`Open discussion: ${thread.title}, ${thread.commentCount} replies`}
            className="inline-flex items-center gap-2 rounded-lg py-2 text-xs font-medium text-c-blue hover:text-c-blue-hover"
          >
            <MessageCircle size={15} aria-hidden="true" />
            {thread.commentCount
              ? `${thread.commentCount} ${thread.commentCount === 1 ? 'reply' : 'replies'}`
              : 'Join in'}
            <ArrowRight size={14} aria-hidden="true" className="ml-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function Community() {
  const toast = useToast()
  const inFlight = useInFlight()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [threads, setThreads] = useState(null)
  const [total, setTotal] = useState(0)
  const [popularTags, setPopularTags] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [myThreads, setMyThreads] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Tags are optional; discussions still load if this request fails.
  useEffect(() => {
    let active = true
    community
      .getTags()
      .then((tagResult) => {
        if (active) setPopularTags(tagResult.tags.slice(0, 8))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // The list is filtered, searched and ordered by the backend.
  useEffect(() => {
    let active = true
    community
      .getThreads({
        category,
        tag,
        search: query.trim(),
        ordering: sort,
        mine: myThreads,
        answered,
        page,
        pageSize: PAGE_SIZE,
      })
      .then(({ threads: result, count }) => {
        if (!active) return
        setThreads(result)
        setTotal(count)
        setError('')
      })
      .catch((requestError) => {
        if (active)
          setError(requestError?.message || 'We could not load the community.')
      })
    return () => {
      active = false
    }
  }, [category, tag, query, sort, myThreads, answered, page])

  const resetPage = useCallback(() => setPage(1), [])
  const handleSearch = useCallback(
    (value) => {
      resetPage()
      setQuery(value)
    },
    [resetPage],
  )
  const filtering = (setter) => (value) => {
    resetPage()
    setter(value)
  }
  const visible = threads || []
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // A vote is a toggle on the server, so a double-click would silently undo itself.
  const vote = (thread, value) =>
    inFlight(`vote-${thread.id}`, () => castVote(thread, value))
  const castVote = async (thread, value) => {
    try {
      const { score, userVote } = await community.vote(
        'thread',
        thread.id,
        value,
      )
      setThreads((items) =>
        items.map((item) =>
          item.id === thread.id ? { ...item, votes: score, userVote } : item,
        ),
      )
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not record your vote')
    }
  }
  const activeFilters = [
    category && {
      label:
        categories.find((item) => item.value === category)?.label || category,
      clear: () => filtering(setCategory)(''),
    },
    tag && {
      label: `#${popularTags.find((item) => item.slug === tag)?.name || tag}`,
      clear: () => filtering(setTag)(''),
    },
    myThreads && {
      label: 'My threads',
      clear: () => filtering(setMyThreads)(false),
    },
    answered && {
      label: 'Answered',
      clear: () => filtering(setAnswered)(false),
    },
  ].filter(Boolean)
  const hasFilters = activeFilters.length > 0 || Boolean(query.trim())
  const clearFilters = () => {
    setCategory('')
    setTag('')
    setMyThreads(false)
    setAnswered(false)
    setQuery('')
    resetPage()
  }

  if (error && !threads)
    return (
      <EmptyState
        title="Community unavailable"
        description={error}
        actionLabel="Try again"
        onAction={() => window.location.reload()}
      />
    )
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
        <div>
          <h1 className="!text-3xl !font-bold !tracking-tight sm:!text-4xl">
            Community
          </h1>
          <p className="mt-2 text-sm leading-6 text-c-text-muted sm:text-base">
            Ask a question. Share what you're learning.
          </p>
        </div>
        <Button to="/community/new" icon={Plus} className="!rounded-xl sm:mt-1">
          Start a discussion
        </Button>
      </header>

      <div className="flex items-center gap-3">
        <SearchBar
          value={query}
          onChange={handleSearch}
          placeholder="Search discussions..."
          aria-label="Search discussions"
          containerClassName="min-w-0 flex-1"
          className="!h-12 !rounded-xl"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="community-filters"
          aria-label={`Filter discussions${activeFilters.length ? `, ${activeFilters.length} active` : ''}`}
          className={`relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors ${filtersOpen || activeFilters.length ? 'border-c-blue/40 bg-c-blue-soft text-c-blue' : 'border-c-border bg-white text-c-text-muted hover:border-c-blue/40 hover:text-c-blue'}`}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-c-blue px-1 text-[10px] text-white">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>
      {filtersOpen && (
        <section
          id="community-filters"
          aria-label="Community filters"
          className="mt-4 rounded-xl border border-c-border bg-white p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Topic"
              value={category}
              onChange={(e) => filtering(setCategory)(e.target.value)}
              options={categories}
            />
            <Select
              label="Tag"
              value={tag}
              onChange={(e) => filtering(setTag)(e.target.value)}
              options={[
                { value: '', label: 'All tags' },
                ...popularTags.map((item) => ({
                  value: item.slug,
                  label: item.name,
                })),
              ]}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={myThreads}
                onChange={(e) => filtering(setMyThreads)(e.target.checked)}
                className="h-4 w-4 accent-c-blue"
              />
              My threads
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={answered}
                onChange={(e) => {
                  filtering(setAnswered)(e.target.checked)
                  if (e.target.checked && sort === 'unanswered')
                    setSort('latest')
                }}
                className="h-4 w-4 accent-c-blue"
              />
              Answered
            </label>
          </div>
        </section>
      )}
      {hasFilters && (
        <div
          className="mt-4 flex flex-wrap items-center gap-2"
          aria-label="Active filters"
        >
          {activeFilters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.clear}
              aria-label={`Remove ${item.label} filter`}
              className="inline-flex items-center gap-1.5 rounded-full border border-c-blue/15 bg-white px-3 py-1.5 text-xs text-c-blue hover:bg-c-blue-soft"
            >
              {item.label}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="px-2 py-1.5 text-xs font-medium text-c-text-muted hover:text-c-blue"
          >
            Clear filters
          </button>
        </div>
      )}

      <Tabs
        value={sort}
        onChange={(value) => {
          resetPage()
          setSort(value)
          if (value === 'unanswered') setAnswered(false)
        }}
        className="mt-7"
      >
        <div className="mb-5 flex items-end justify-between gap-3 border-b border-c-border">
          <TabsList
            aria-label="Discussion order"
            className="!gap-5 !border-0 sm:!gap-7"
          >
            <TabTrigger
              id="community-tab-latest"
              aria-controls="community-results"
              value="latest"
              className="!pb-4"
            >
              Latest
            </TabTrigger>
            <TabTrigger
              id="community-tab-top"
              aria-controls="community-results"
              value="top"
              className="!pb-4"
            >
              Top
            </TabTrigger>
            <TabTrigger
              id="community-tab-unanswered"
              aria-controls="community-results"
              value="unanswered"
              className="!pb-4"
            >
              Unanswered
            </TabTrigger>
          </TabsList>
          {threads && (
            <span
              className="mb-4 hidden shrink-0 text-xs tabular-nums text-c-text-muted sm:inline"
              aria-live="polite"
            >
              {total} {total === 1 ? 'discussion' : 'discussions'}
            </span>
          )}
        </div>
        <section
          id="community-results"
          role="tabpanel"
          aria-labelledby={`community-tab-${sort}`}
          tabIndex={0}
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-c-danger"
            >
              {error}
            </p>
          )}
          {!threads ? (
            <ThreadSkeleton />
          ) : visible.length ? (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                {visible.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    onVote={vote}
                    isOwn={thread.author.id === String(currentUserId)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-8"
              />
            </>
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No discussions yet"
              description={
                hasFilters
                  ? 'Try another topic or clear your filters.'
                  : 'Have a question? Start a conversation.'
              }
              actionLabel={hasFilters ? 'Clear filters' : 'Start a discussion'}
              onAction={hasFilters ? clearFilters : undefined}
              actionTo={hasFilters ? undefined : '/community/new'}
            />
          )}
        </section>
      </Tabs>
    </div>
  )
}
