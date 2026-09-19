import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Settings2, SlidersHorizontal, X } from 'lucide-react'
import LibraryBookCard from '../components/books/LibraryBookCard'
import {
  Button,
  EmptyState,
  Modal,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
  useToast,
} from '../components/ui'
import { library } from '../services/api'
import { libraryPreferences } from '../services/libraryPreferences'
import {
  DEFAULT_PREFERENCES,
  LEVELS,
  STUDY_GOALS,
  selectLibraryBooks,
} from '../lib/library'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 6
const TABS = [
  { id: 'all', label: 'All books' },
  { id: 'progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'saved', label: 'Saved' },
]

function LibrarySkeleton() {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Loading books"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-c-border bg-white"
        >
          <Skeleton className="h-16 rounded-none" />
          <div className="space-y-4 p-5">
            <Skeleton width="85%" height="24px" />
            <Skeleton width="60%" height="16px" />
            <Skeleton width="32%" height="20px" />
            <Skeleton width="45%" height="16px" />
            <Skeleton height="6px" className="!mt-7" />
            <Skeleton width="75%" height="16px" />
          </div>
        </div>
      ))}
    </div>
  )
}

function LibraryContent() {
  const toast = useToast()
  const [books, setBooks] = useState(null)
  const [error, setError] = useState('')
  const [personalError, setPersonalError] = useState('')
  const [personalReady, setPersonalReady] = useState(false)
  const [reload, setReload] = useState(0)
  const [savedIds, setSavedIds] = useState([])
  const [savingIds, setSavingIds] = useState([])
  const saveLocks = useRef(new Set())
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [draft, setDraft] = useState(DEFAULT_PREFERENCES)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferencesError, setPreferencesError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [level, setLevel] = useState('all')
  const [duration, setDuration] = useState('all')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    Promise.allSettled([library.getBooks(), libraryPreferences.get()]).then(
      ([content, personal]) => {
        if (!active) return
        if (content.status === 'fulfilled') {
          setBooks(content.value.books)
          setError('')
        } else
          setError(content.reason?.message || 'We could not load the library.')
        if (personal.status === 'fulfilled') {
          setSavedIds(personal.value.savedIds)
          setPreferences(personal.value.preferences || DEFAULT_PREFERENCES)
          setSort(personal.value.preferences ? 'for-you' : 'newest')
          setPersonalReady(true)
          setPersonalError('')
        } else {
          setPersonalReady(false)
          setPersonalError(
            'Your saved books and preferences could not be loaded. You can still browse and read.',
          )
        }
      },
    )
    return () => {
      active = false
    }
  }, [reload])

  const categories = useMemo(
    () => [...new Set((books || []).map((book) => book.category))].sort(),
    [books],
  )
  const filtered = useMemo(
    () =>
      selectLibraryBooks(books || [], {
        query,
        category,
        level,
        duration,
        tab,
        sort,
        savedIds,
        preferences,
      }),
    [books, query, category, level, duration, tab, sort, savedIds, preferences],
  )
  const counts = {
    all: books?.length || 0,
    progress: books?.filter((b) => b.started && !b.finished).length || 0,
    completed: books?.filter((b) => b.finished).length || 0,
    saved: books?.filter((b) => savedIds.includes(b.id)).length || 0,
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const filterCount =
    Number(category !== 'all') +
    Number(level !== 'all') +
    Number(duration !== 'all')
  const hasFilters = Boolean(query.trim() || filterCount)
  const change = (setter) => (value) => {
    setter(value)
    setPage(1)
  }
  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setLevel('all')
    setDuration('all')
    setPage(1)
  }
  const retry = () => {
    setReload((value) => value + 1)
  }

  async function toggleSave(book) {
    if (saveLocks.current.has(book.id)) return
    saveLocks.current.add(book.id)
    setSavingIds((ids) => [...ids, book.id])
    const next = !savedIds.includes(book.id)
    try {
      await libraryPreferences.setSaved(book.id, next)
      setSavedIds((ids) =>
        next
          ? [...new Set([...ids, book.id])]
          : ids.filter((id) => id !== book.id),
      )
      toast.success(
        next ? 'Saved for later' : 'Removed from saved books',
        book.title,
      )
    } catch (e) {
      toast.error('Could not update saved books', e.message)
    } finally {
      saveLocks.current.delete(book.id)
      setSavingIds((ids) => ids.filter((id) => id !== book.id))
    }
  }
  async function savePreferences(event) {
    event.preventDefault()
    if (savingPreferences) return
    setSavingPreferences(true)
    setPreferencesError('')
    try {
      const saved = await libraryPreferences.save(draft)
      setPreferences(saved)
      setSort('for-you')
      setPage(1)
      setPreferencesOpen(false)
      toast.success(
        'Learning preferences saved',
        'Your library is now sorted for you.',
      )
    } catch (e) {
      setPreferencesError(
        e.message || 'Your preferences could not be saved. Please try again.',
      )
    } finally {
      setSavingPreferences(false)
    }
  }
  function moveTab(event) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const available = TABS.filter(
      (item) => item.id !== 'saved' || personalReady,
    )
    const current = available.findIndex((item) => item.id === tab)
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? available.length - 1
          : (current +
              (event.key === 'ArrowRight' ? 1 : -1) +
              available.length) %
            available.length
    setTab(available[index].id)
    setPage(1)
    document.getElementById(`library-tab-${available[index].id}`)?.focus()
  }
  if (error)
    return (
      <EmptyState
        title="Library unavailable"
        description={error}
        actionLabel="Try again"
        onAction={retry}
      />
    )

  return (
    <div data-library="minimal" className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
        <div>
          <h1 className="!text-3xl !font-bold !tracking-tight sm:!text-4xl">
            Library
          </h1>
          <p className="mt-2 text-sm leading-6 text-c-text-muted sm:text-base">
            Continue learning or find your next good read.
          </p>
        </div>
        <button
          type="button"
          disabled={!personalReady}
          onClick={() => {
            setDraft({ ...preferences, topics: [...preferences.topics] })
            setPreferencesError('')
            setPreferencesOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-c-text-muted transition-colors hover:bg-white hover:text-c-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue disabled:opacity-40"
        >
          <Settings2 className="h-4 w-4" />
          Learning preferences
        </button>
      </header>
      {personalError && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-c-border bg-c-yellow-soft p-4 text-sm"
        >
          <p>{personalError}</p>
          <button
            onClick={retry}
            className="font-semibold text-c-blue underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <SearchBar
          value={query}
          onChange={change(setQuery)}
          placeholder="Search books, authors, or topics..."
          aria-label="Search library"
          containerClassName="min-w-0 flex-1"
          className="!h-12 !rounded-xl"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="library-filters"
          aria-label={`Filter books${filterCount ? `, ${filterCount} active` : ''}`}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${filtersOpen || filterCount ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border bg-white text-c-text-muted hover:border-c-blue'}`}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {filterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-c-yellow text-[10px] font-bold text-c-text">
              {filterCount}
            </span>
          )}
        </button>
      </div>
      {filtersOpen && (
        <section
          id="library-filters"
          aria-label="Library filters"
          className="mt-4 rounded-xl border border-c-border bg-white p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Topic"
              value={category}
              onChange={(e) => change(setCategory)(e.target.value)}
              options={[
                { value: 'all', label: 'All topics' },
                ...categories.map((value) => ({ value, label: value })),
              ]}
            />
            <Select
              label="Difficulty"
              value={level}
              onChange={(e) => change(setLevel)(e.target.value)}
              options={LEVELS}
            />
            <Select
              label="Reading time"
              value={duration}
              onChange={(e) => change(setDuration)(e.target.value)}
              options={[
                { value: 'all', label: 'Any reading time' },
                {
                  value: 'session',
                  label: `Next chapter: ${preferences.session_minutes} min or less`,
                },
                { value: 'short', label: 'Whole book: up to 3 hours' },
                { value: 'long', label: 'Whole book: over 3 hours' },
              ]}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-c-text-muted">
              Fit a chapter between classes, or settle in for a longer read.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold text-c-blue hover:underline"
            >
              Reset filters
            </button>
          </div>
        </section>
      )}
      <div className="mb-5 mt-7 flex flex-col gap-3 border-b border-c-border sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div
          role="tablist"
          aria-label="Book collections"
          onKeyDown={moveTab}
          className="flex min-w-0 gap-3 overflow-x-auto sm:gap-6"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              id={`library-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="library-results"
              tabIndex={tab === item.id ? 0 : -1}
              disabled={item.id === 'saved' && !personalReady}
              onClick={() => change(setTab)(item.id)}
              className={`relative shrink-0 whitespace-nowrap border-b-2 px-1 pb-4 pt-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-blue disabled:opacity-40 sm:text-sm ${tab === item.id ? 'border-c-blue text-c-blue' : 'border-transparent text-c-text-muted hover:text-c-text'}`}
            >
              {item.label}
              <span
                className={`ml-1.5 hidden text-[10px] sm:inline ${tab === item.id ? 'text-c-blue' : 'text-c-text-muted/70'}`}
              >
                {books ? counts[item.id] : '–'}
              </span>
            </button>
          ))}
        </div>
        <div className="mb-3 w-full shrink-0 sm:w-44">
          <Select
            aria-label="Sort books"
            value={sort}
            onChange={(e) => change(setSort)(e.target.value)}
            options={[
              { value: 'newest', label: 'Recently added' },
              { value: 'for-you', label: 'For you', disabled: !personalReady },
              { value: 'shortest', label: 'Shortest first' },
              { value: 'popular', label: 'Most read' },
            ]}
          />
        </div>
      </div>
      <section
        id="library-results"
        role="tabpanel"
        aria-labelledby={`library-tab-${tab}`}
        tabIndex={0}
        className="outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
      >
        {!books ? (
          <LibrarySkeleton />
        ) : (
          <>
            <div
              className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-c-text-muted"
              aria-live="polite"
            >
              <p>
                {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
                {sort === 'for-you'
                  ? ' · Ordered by your topics, level, and study goal'
                  : ' · A little progress, every day'}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 font-medium text-c-blue"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}
            </div>
            {visible.length ? (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {visible.map((book) => (
                    <LibraryBookCard
                      key={book.id}
                      book={book}
                      saved={savedIds.includes(book.id)}
                      saving={savingIds.includes(book.id)}
                      disabled={!personalReady}
                      onSave={toggleSave}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-8"
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-c-border bg-white/60 px-4 py-6">
                <EmptyState
                  icon={BookOpen}
                  title={
                    hasFilters
                      ? 'No books match just yet'
                      : tab === 'saved'
                        ? 'Your next reads belong here'
                        : tab === 'completed'
                          ? 'One chapter at a time'
                          : 'Ready when you are'
                  }
                  description={
                    hasFilters
                      ? 'Try a different topic or widen your reading time.'
                      : tab === 'saved'
                        ? 'Use the bookmark on any book to keep it for later.'
                        : tab === 'completed'
                          ? 'Books you finish will appear here. Pick one and make a start.'
                          : 'Start a book and come back here to pick up where you left off.'
                  }
                  actionLabel={
                    hasFilters ? 'Clear filters' : 'Browse all books'
                  }
                  onAction={
                    hasFilters ? clearFilters : () => change(setTab)('all')
                  }
                />
              </div>
            )}
          </>
        )}
      </section>
      <Modal
        isOpen={preferencesOpen}
        onClose={() => {
          if (!savingPreferences) setPreferencesOpen(false)
        }}
        title="Make room for your learning"
        description="Choose what matters this semester. You can change this anytime."
        size="lg"
        className="max-h-[90dvh] overflow-y-auto"
      >
        <form onSubmit={savePreferences} className="space-y-6">
          <Select
            label="What are you working toward?"
            value={draft.goal}
            onChange={(e) =>
              setDraft((value) => ({ ...value, goal: e.target.value }))
            }
            options={STUDY_GOALS}
          />
          <fieldset>
            <legend className="text-sm font-semibold text-c-text">
              Topics you want to explore
            </legend>
            <p className="mb-3 mt-1 text-xs text-c-text-muted">
              Choose a few, or leave this open to discover something new.
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={draft.topics.includes(topic)}
                  disabled={
                    !draft.topics.includes(topic) && draft.topics.length >= 12
                  }
                  onClick={() =>
                    setDraft((value) => ({
                      ...value,
                      topics: value.topics.includes(topic)
                        ? value.topics.filter((t) => t !== topic)
                        : [...value.topics, topic],
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-xs leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${draft.topics.includes(topic) ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border bg-white text-c-text-muted hover:border-c-blue'}`}
                >
                  {draft.topics.includes(topic) && (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {topic}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Your preferred level"
              value={draft.level}
              onChange={(e) =>
                setDraft((value) => ({ ...value, level: e.target.value }))
              }
              options={LEVELS}
            />
            <Select
              label="Time for a reading session"
              value={draft.session_minutes}
              onChange={(e) =>
                setDraft((value) => ({
                  ...value,
                  session_minutes: Number(e.target.value),
                }))
              }
              options={[
                { value: 15, label: '15 min · between classes' },
                { value: 30, label: '30 min · a study break' },
                { value: 60, label: '60 min · a focused session' },
              ]}
            />
          </div>
          <p className="rounded-xl bg-c-blue-wash p-3 text-xs leading-5 text-c-text-muted">
            These preferences help order your “For you” picks. You can still
            browse every book, and your reading progress stays the same.
          </p>
          {preferencesError && (
            <p role="alert" className="text-sm text-c-danger">
              {preferencesError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-c-border pt-5">
            <button
              type="button"
              disabled={savingPreferences}
              onClick={() => setDraft(DEFAULT_PREFERENCES)}
              className="text-xs font-medium text-c-text-muted hover:text-c-blue"
            >
              Reset preferences
            </button>
            <Button type="submit" loading={savingPreferences}>
              Save preferences
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function Library() {
  const userId = useAuthStore((state) => state.user?.id)
  return <LibraryContent key={userId} />
}
