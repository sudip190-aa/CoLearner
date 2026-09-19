import React, { useEffect, useMemo, useState } from 'react'
import { BookCard } from '../components/books/BookCard'
import {
  EmptyState,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { library } from '../services/api.js'

const PAGE_SIZE = 6
const difficulties = [
  { value: 'all', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]
const durations = [
  { value: 'all', label: 'Any duration' },
  { value: 'short', label: 'Under 3 hours' },
  { value: 'medium', label: '3–5 hours' },
  { value: 'long', label: '5+ hours' },
]

function LibrarySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-brand border border-c-border bg-white"
        >
          <Skeleton className="aspect-[3/4] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton width="80%" height="18px" />
            <Skeleton width="55%" height="16px" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Library() {
  const [books, setBooks] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [duration, setDuration] = useState('all')
  const [myLibrary, setMyLibrary] = useState(false)
  const [sort, setSort] = useState('popular')
  const [page, setPage] = useState(1)
  useEffect(() => {
    let active = true
    library
      .getBooks()
      .then(({ books: result }) => {
        if (active) setBooks(result)
      })
      .catch((requestError) => {
        if (active)
          setError(requestError?.message || 'We could not load the library.')
      })
    return () => {
      active = false
    }
  }, [])
  const categories = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...(books
        ? [...new Set(books.map((book) => book.category))].map((value) => ({
            value,
            label: value,
          }))
        : []),
    ],
    [books],
  )
  const filtered = useMemo(() => {
    if (!books) return []
    const result = books.filter((book) => {
      const matchesQuery =
        !query ||
        `${book.title} ${book.author} ${book.description}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesCategory = category === 'all' || book.category === category
      const matchesDifficulty =
        difficulty === 'all' || book.difficulty === difficulty
      const matchesDuration =
        duration === 'all' ||
        (duration === 'short' && book.estMinutes < 180) ||
        (duration === 'medium' &&
          book.estMinutes >= 180 &&
          book.estMinutes <= 300) ||
        (duration === 'long' && book.estMinutes > 300)
      const matchesLibrary = !myLibrary || book.started
      return (
        matchesQuery &&
        matchesCategory &&
        matchesDifficulty &&
        matchesDuration &&
        matchesLibrary
      )
    })
    // popular = most readers; newest = most recently added (both come from the API)
    return result.sort((a, b) =>
      sort === 'shortest'
        ? a.estMinutes - b.estMinutes
        : sort === 'newest'
          ? b.createdAt.localeCompare(a.createdAt)
          : b.readersCount - a.readersCount || a.title.localeCompare(b.title),
    )
  }, [books, query, category, difficulty, duration, myLibrary, sort])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleBooks = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setDifficulty('all')
    setDuration('all')
    setMyLibrary(false)
    setSort('popular')
  }
  if (error)
    return (
      <EmptyState
        title="Library unavailable"
        description={error}
        actionLabel="Try again"
        onAction={() => window.location.reload()}
      />
    )
  return (
    <div>
      <PageHeader
        title="Library"
        subtitle="Curated books to help you learn with direction."
      />
      <div className="mb-8 space-y-4 rounded-brand-lg border border-c-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <SearchBar
            value={query}
            onChange={setQuery}
            containerClassName="flex-1 lg:min-w-[260px]"
            placeholder="Search books, authors, and topics..."
          />
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={categories}
            aria-label="Filter by category"
          />
          <Select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            options={difficulties}
            aria-label="Filter by difficulty"
          />
          <Select
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            options={durations}
            aria-label="Filter by duration"
          />
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-c-border pt-4 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-c-text">
            <input
              type="checkbox"
              checked={myLibrary}
              onChange={(event) => setMyLibrary(event.target.checked)}
              className="h-4 w-4 rounded border-c-border text-c-blue focus:ring-c-blue"
            />
            My library
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-c-text-muted">Sort by</span>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              options={[
                { value: 'popular', label: 'Popular' },
                { value: 'newest', label: 'Newest' },
                { value: 'shortest', label: 'Shortest' },
              ]}
              aria-label="Sort books"
            />
          </div>
        </div>
      </div>
      {!books ? (
        <LibrarySkeleton />
      ) : visibleBooks.length ? (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-c-text-muted">
              Showing {visibleBooks.length} of {filtered.length} books
            </p>
            {myLibrary && (
              <span className="text-sm font-semibold text-c-blue">
                Your saved learning
              </span>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <Pagination
            currentPage={safePage}
            totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          title="No books match those filters"
          description="Try broadening your search or clearing a filter."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      )}
    </div>
  )
}
