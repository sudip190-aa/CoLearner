import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  MessageCircle,
  Search as SearchIcon,
  Wrench,
} from 'lucide-react'
import {
  Avatar,
  EmptyState,
  SearchBar,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { search as searchApi } from '../services/api.js'

const MIN_LENGTH = 2
const PER_TYPE = 20
const TAB_KEYS = ['books', 'projects', 'people', 'threads']
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Highlight({ text, query }) {
  const words = query
    .split(/\s+/)
    .filter((word) => word.length >= 1)
    .map(escapeRegExp)
  if (!words.length || !text) return text || null
  const pattern = new RegExp(`(${words.join('|')})`, 'ig')
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded bg-c-yellow-soft px-0.5 text-c-text">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function ResultCard({ result, query }) {
  const Icon = result.icon
  return (
    <Link
      to={result.to}
      data-result={result.kind}
      className="flex gap-4 rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm hover:border-c-blue hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-brand bg-c-blue-soft text-c-blue">
        {result.avatar ? (
          <Avatar src={result.avatar.src} name={result.avatar.name} size="sm" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-c-blue">
            {result.type}
          </span>
          {result.meta && (
            <span className="text-xs text-c-text-muted">{result.meta}</span>
          )}
        </div>
        <h2 className="mt-1 text-base font-bold text-c-text">
          <Highlight text={result.title} query={query} />
        </h2>
        {result.text && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-c-text-muted">
            <Highlight text={result.text} query={query} />
          </p>
        )}
      </div>
    </Link>
  )
}

const toCards = (data) => ({
  books: data.books.map((book) => ({
    kind: 'book',
    type: 'Book',
    icon: BookOpen,
    title: book.title,
    text: `${book.author}${book.description ? ` · ${book.description}` : ''}`,
    to: `/library/${book.slug}`,
    meta: book.category,
  })),
  projects: data.projects.map((project) => ({
    kind: 'project',
    type: 'Project',
    icon: Wrench,
    title: project.title,
    text: project.summary,
    to: `/projects/${project.slug}`,
    meta: `${project.memberCount} ${project.memberCount === 1 ? 'member' : 'members'}`,
  })),
  people: data.people.map((person) => ({
    kind: 'person',
    type: 'Person',
    title: person.fullName,
    text: person.headline || person.skills.join(' · '),
    to: `/u/${person.username}`,
    meta: `@${person.username}`,
    avatar: { src: person.avatar, name: person.fullName },
  })),
  threads: data.threads.map((thread) => ({
    kind: 'thread',
    type: 'Discussion',
    icon: MessageCircle,
    title: thread.title,
    text: thread.excerpt,
    to: `/community/${thread.slug}`,
    meta: `${thread.commentCount} ${thread.commentCount === 1 ? 'comment' : 'comments'}`,
  })),
})

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') || '').trim()
  const [tab, setTab] = useState('all')
  const [text, setText] = useState(query)
  const [seenQuery, setSeenQuery] = useState(query)
  const [state, setState] = useState({ key: '', status: 'idle', data: null })
  const [attempt, setAttempt] = useState(0)

  // The URL is the source of truth (the navbar search and shared links land here); follow it when it changes.
  if (query !== seenQuery) {
    setSeenQuery(query)
    setText(query)
  }

  // Typing updates the URL after a short pause, so each keystroke is not a request.
  useEffect(() => {
    const trimmed = text.trim()
    if (trimmed === query) return undefined
    const timer = window.setTimeout(
      () => setParams(trimmed ? { q: trimmed } : {}, { replace: true }),
      300,
    )
    return () => window.clearTimeout(timer)
  }, [text, query, setParams])

  const searchable = query.length >= MIN_LENGTH
  const key = `${query}|${attempt}`
  useEffect(() => {
    if (!searchable) return undefined
    let active = true
    searchApi
      .globalSearch(query, { limit: PER_TYPE })
      .then((data) => active && setState({ key, status: 'ready', data }))
      .catch(() => active && setState({ key, status: 'error', data: null }))
    return () => {
      active = false
    }
  }, [query, key, searchable])

  const status = !searchable
    ? 'idle'
    : state.key === key
      ? state.status
      : 'loading'
  const data = status === 'ready' ? state.data : null
  const cards = useMemo(() => (data ? toCards(data) : null), [data])
  const counts = data?.counts || {}
  const visible = cards
    ? tab === 'all'
      ? TAB_KEYS.flatMap((name) => cards[name])
      : cards[tab]
    : []
  const shownCount = tab === 'all' ? data?.total : counts[tab]
  const search = (value) => setText(value)

  return (
    <div>
      <PageHeader
        title="Search"
        subtitle={
          searchable
            ? `Results for “${query}”`
            : 'Search books, projects, people, and discussions.'
        }
      />
      <SearchBar
        value={text}
        onChange={search}
        placeholder="Search Colearn..."
        shortcut="/"
        containerClassName="max-w-2xl"
      />
      <div className="mt-7">
        <Tabs value={tab} onChange={setTab}>
          <TabsList>
            <TabTrigger value="all" badge={data ? data.total : undefined}>
              All
            </TabTrigger>
            <TabTrigger value="books" badge={data ? counts.books : undefined}>
              Books
            </TabTrigger>
            <TabTrigger
              value="projects"
              badge={data ? counts.projects : undefined}
            >
              Projects
            </TabTrigger>
            <TabTrigger value="people" badge={data ? counts.people : undefined}>
              People
            </TabTrigger>
            <TabTrigger
              value="threads"
              badge={data ? counts.threads : undefined}
            >
              Discussions
            </TabTrigger>
          </TabsList>
        </Tabs>
      </div>
      {status === 'idle' ? (
        <div className="mt-12 rounded-brand-lg border border-dashed border-c-border bg-c-surface p-12 text-center">
          <SearchIcon className="mx-auto h-8 w-8 text-c-blue" />
          <h2 className="mt-4 text-xl font-bold text-c-text">
            {query ? 'Keep typing' : 'Start with a question'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-c-text-muted">
            {query
              ? `Type at least ${MIN_LENGTH} characters to search.`
              : 'Try a skill, a person’s name, or the kind of project you want to build.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['React', 'PostgreSQL', 'portfolio', 'testing'].map(
              (suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => setParams({ q: suggestion })}
                  className="rounded-full bg-c-blue-wash px-3 py-1.5 text-xs font-semibold text-c-blue hover:bg-c-blue-soft"
                >
                  {suggestion}
                </button>
              ),
            )}
          </div>
        </div>
      ) : status === 'loading' ? (
        <div className="mt-6 space-y-3" aria-label="Searching">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} height="96px" />
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="mt-8">
          <EmptyState
            title="Search is unavailable"
            description="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => setAttempt((count) => count + 1)}
          />
        </div>
      ) : visible.length ? (
        <>
          <div className="mt-6 space-y-3">
            {visible.map((result) => (
              <ResultCard key={result.to} result={result} query={query} />
            ))}
          </div>
          {shownCount > visible.length && tab !== 'all' && (
            <p className="mt-4 text-center text-sm text-c-text-muted">
              Showing the first {visible.length} of {shownCount}. Add another
              word to narrow it down.
            </p>
          )}
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No results found"
            description="Try a broader search or fewer words."
            actionLabel="Clear search"
            onAction={() => setParams({})}
          />
        </div>
      )}
    </div>
  )
}
