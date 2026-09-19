import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowUpRight } from 'lucide-react'
import {
  Input,
  Select,
  EmptyState,
  Skeleton,
  ProgressBar,
} from '../components/ui'
import { BookCover } from '../components/books/BookCover'
import { library } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function BookCatalog() {
  const signedIn = useAuthStore((s) => s.isAuthenticated)
  const [books, setBooks] = useState(null),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [category, setCategory] = useState(''),
    [language, setLanguage] = useState('')
  useEffect(() => {
    let alive = true
    library
      .getBooks()
      .then((r) => {
        if (alive)
          setBooks(r.books.filter((b) => b.publicationStatus === 'APPROVED'))
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    return () => {
      alive = false
    }
  }, [signedIn])
  const shown = (books || []).filter(
    (b) =>
      (!category || b.category === category) &&
      (!language || b.language === language) &&
      `${b.title} ${b.author} ${b.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <div className="container py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-c-blue">
            The learning library
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            A good place to begin.
          </h1>
          <p className="mt-4 text-c-text-muted">
            Open educational books. One chapter at a time.
          </p>
        </div>
        {signedIn && (
          <Link to="/library" className="text-sm font-semibold text-c-blue">
            My books <ArrowUpRight className="inline h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="my-8 grid gap-3 sm:grid-cols-[1fr_200px_170px]">
        <Input
          leftIcon={Search}
          aria-label="Search books"
          placeholder="Search books or topics"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: '', label: 'All subjects' },
            ...[...new Set((books || []).map((b) => b.category))].sort(),
          ]}
        />
        <Select
          aria-label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            { value: '', label: 'All languages' },
            ...[...new Set((books || []).map((b) => b.language))].sort(),
          ]}
        />
      </div>
      {error ? (
        <EmptyState title="Could not load books" description={error} />
      ) : !books ? (
        <Skeleton height="300px" />
      ) : !shown.length ? (
        <EmptyState
          title="No books found"
          description="Try another subject or search."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b) => (
            <Link
              key={b.id}
              to={`/books/${b.slug}`}
              className="group overflow-hidden rounded-2xl border border-c-border bg-white transition-shadow hover:shadow-md"
            >
              <div className="flex h-40 items-center justify-between gap-5 bg-c-blue-wash px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-c-blue">
                    {b.category}
                  </p>
                  <p className="mt-2 text-xs text-c-text-muted">
                    {b.chapterCount} chapters · {b.language}
                  </p>
                </div>
                <BookCover
                  book={b}
                  compact
                  className="h-32 w-24 shrink-0 rounded-lg shadow-sm"
                />
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold leading-6 group-hover:text-c-blue">
                  {b.title}
                </h2>
                <p className="mt-2 text-sm text-c-text-muted">{b.author}</p>
                <div className="mt-5 flex items-center justify-between text-xs text-c-text-muted">
                  <span>{b.licenseName}</span>
                  <span className="font-semibold text-c-blue">
                    {b.started ? 'Continue' : 'Explore'} →
                  </span>
                </div>
                {signedIn && b.started && (
                  <div className="mt-4">
                    <ProgressBar value={b.progress} />
                    <p className="mt-2 text-xs text-c-text-muted">
                      {b.completedChapterIds.length} / {b.chapterCount} chapters
                      completed
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
