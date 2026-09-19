import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  MessageCircle,
  Pin,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trophy,
} from 'lucide-react'
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  Pagination,
  SearchBar,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { community, users } from '../services/api.js'
import { useInFlight } from '../hooks/useInFlight.js'
import { formatRelative } from '../lib/formatters.js'
import { toPlainText } from '../lib/inlineMarkdown.js'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 6
// The category filter values are the backend's thread categories.
const categories = [
  { value: '', label: 'All discussions' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'product', label: 'Product' },
  { value: 'career', label: 'Career' },
  { value: 'community', label: 'Community' },
]

function ThreadSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex gap-4 rounded-brand-lg border border-c-border bg-white p-5"
        >
          <Skeleton width="42px" height="80px" />
          <div className="flex-1 space-y-3">
            <Skeleton width="70%" height="20px" />
            <Skeleton width="100%" height="32px" />
            <Skeleton width="40%" height="16px" />
          </div>
        </div>
      ))}
    </div>
  )
}

function VotePill({ votes, userVote, onVote, disabled }) {
  const voted = userVote !== 0
  return (
    <div
      className={`flex shrink-0 flex-col items-center rounded-brand border px-2 py-1 ${voted ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border text-c-text-muted'}`}
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
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <span className="my-0.5 text-sm font-bold" aria-label="Score">
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
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ThreadCard({ thread, onVote, isOwn }) {
  return (
    <article
      className={`rounded-brand-lg border border-c-border bg-white p-5 shadow-sm ${thread.pinned ? 'border-l-4 border-l-c-yellow' : ''}`}
    >
      <div className="flex gap-4">
        <VotePill
          votes={thread.votes}
          userVote={thread.userVote}
          disabled={isOwn}
          onVote={(value) => onVote(thread, value)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {thread.pinned && (
              <Pin
                className="mt-1 h-4 w-4 shrink-0 text-c-warning"
                aria-label="Pinned"
              />
            )}
            <Link
              to={`/community/${thread.slug}`}
              className="line-clamp-2 text-lg font-bold leading-6 text-c-text hover:text-c-blue"
            >
              {thread.title}
            </Link>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-c-text-muted">
            {toPlainText(thread.body)}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {thread.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-c-text-muted">
            <Link
              to={`/u/${thread.author.username}`}
              className="flex items-center gap-2 hover:text-c-blue"
            >
              <Avatar
                src={thread.author.avatar}
                name={thread.author.fullName}
                size="sm"
              />
              {thread.author.fullName}
            </Link>
            <span>{formatRelative(thread.createdAt)}</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {thread.commentCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {thread.views}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

function FilterSidebar({
  category,
  setCategory,
  tag,
  setTag,
  tags,
  myThreads,
  setMyThreads,
  answered,
  setAnswered,
}) {
  return (
    <aside className="space-y-6">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
          Categories
        </h2>
        <nav className="mt-3 space-y-1">
          {categories.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setCategory(item.value)}
              className={`block w-full rounded-brand px-3 py-2 text-left text-sm ${category === item.value ? 'bg-c-blue-soft font-semibold text-c-blue' : 'text-c-text-muted hover:bg-c-blue-wash'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {tags.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
            Popular tags
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((item) => (
              <button
                type="button"
                key={item.slug}
                onClick={() => setTag(tag === item.slug ? '' : item.slug)}
                className={`rounded-full px-2.5 py-1 text-xs ${tag === item.slug ? 'bg-c-blue text-white' : 'bg-c-blue-wash text-c-text-muted hover:text-c-blue'}`}
              >
                #{item.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3 border-t border-c-border pt-4">
        <label className="flex items-center gap-2 text-sm text-c-text">
          <input
            type="checkbox"
            checked={myThreads}
            onChange={(event) => setMyThreads(event.target.checked)}
            className="h-4 w-4 accent-c-blue"
          />
          My threads
        </label>
        <label className="flex items-center gap-2 text-sm text-c-text">
          <input
            type="checkbox"
            checked={answered}
            onChange={(event) => setAnswered(event.target.checked)}
            className="h-4 w-4 accent-c-blue"
          />
          Answered
        </label>
      </div>
    </aside>
  )
}

export default function Community() {
  const toast = useToast()
  const inFlight = useInFlight()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [threads, setThreads] = useState(null)
  const [contributors, setContributors] = useState([])
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

  // Side panels: real tags and the members with the most XP. Optional, so failures stay quiet.
  useEffect(() => {
    let active = true
    Promise.all([community.getTags(), users.getUsers({ ordering: 'xp' })])
      .then(([tagResult, people]) => {
        if (!active) return
        setPopularTags(tagResult.tags.slice(0, 8))
        setContributors(people.items.slice(0, 5))
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
      })
      .then(({ threads: result }) => {
        if (!active) return
        setThreads(result)
        setError('')
      })
      .catch((requestError) => {
        if (active)
          setError(requestError?.message || 'We could not load the community.')
      })
    return () => {
      active = false
    }
  }, [category, tag, query, sort, myThreads, answered])

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
  const visible = (threads || []).slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )
  const totalPages = Math.ceil((threads || []).length / PAGE_SIZE)

  // A vote is a toggle on the server, so a double-click would silently undo itself.
  const vote = (thread, value) => inFlight(`vote-${thread.id}`, () => castVote(thread, value))
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
  const sidebarProps = {
    category,
    setCategory: filtering(setCategory),
    tag,
    setTag: filtering(setTag),
    tags: popularTags,
    myThreads,
    setMyThreads: filtering(setMyThreads),
    answered,
    setAnswered: filtering(setAnswered),
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
    <div>
      <PageHeader
        title="Community"
        subtitle="Ask better questions, share what you are learning, and help someone move forward."
        actions={
          <Button to="/community/new" icon={Plus}>
            Start a discussion
          </Button>
        }
      />
      <div className="mb-5 xl:hidden">
        <Button
          variant="outline"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters {filtersOpen ? '↑' : '↓'}
        </Button>
        {filtersOpen && (
          <div className="mt-4 rounded-brand-lg border border-c-border bg-white p-4">
            <FilterSidebar {...sidebarProps} />
          </div>
        )}
      </div>
      <div className="grid items-start gap-8 xl:grid-cols-[190px_minmax(0,1fr)_220px]">
        <div className="hidden xl:block">
          <FilterSidebar {...sidebarProps} />
        </div>
        <main className="min-w-0">
          <div className="mb-5 space-y-4">
            <SearchBar
              value={query}
              onChange={handleSearch}
              placeholder="Search discussions..."
            />
            <Tabs
              value={sort}
              onChange={(value) => {
                resetPage()
                setSort(value)
              }}
            >
              <TabsList>
                <TabTrigger value="latest">Latest</TabTrigger>
                <TabTrigger value="top">Top</TabTrigger>
                <TabTrigger value="unanswered">Unanswered</TabTrigger>
              </TabsList>
            </Tabs>
          </div>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-brand bg-red-50 px-3 py-2 text-sm text-c-danger"
            >
              {error}
            </p>
          )}
          {!threads ? (
            <ThreadSkeleton />
          ) : visible.length ? (
            <>
              <div className="space-y-3">
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
              title="No discussions found"
              description="Try another filter or start a new conversation."
              actionLabel="Start a discussion"
              actionTo="/community/new"
            />
          )}
        </main>
        <aside className="hidden space-y-5 xl:block">
          <Link
            to="/community/new"
            className="flex w-full items-center justify-center gap-2 rounded-brand bg-c-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-c-blue-hover"
          >
            <Plus className="h-4 w-4" />
            Start a discussion
          </Link>
          {contributors.length > 0 && (
            <div className="rounded-brand-lg border border-c-border bg-white p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-c-warning" />
                <h2 className="text-sm font-bold text-c-text">
                  Top contributors
                </h2>
              </div>
              <div className="mt-4 space-y-4">
                {contributors.map((person, index) => (
                  <Link
                    key={person.id}
                    to={`/u/${person.username}`}
                    className="flex items-center gap-3 hover:text-c-blue"
                  >
                    <span className="w-4 text-xs font-bold text-c-text-muted">
                      {index + 1}
                    </span>
                    <Avatar
                      src={person.avatar}
                      name={person.fullName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-c-text">
                        {person.fullName}
                      </p>
                      <p className="text-xs text-c-text-muted">
                        {person.xp.toLocaleString()} XP
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
