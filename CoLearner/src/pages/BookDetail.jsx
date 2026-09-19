import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Check, Clock, Play, Tag } from 'lucide-react'
import { Badge, Button, Chip, EmptyState, Skeleton } from '../components/ui'
import { library } from '../services/api.js'
import { BookCard } from '../components/books/BookCard'
import { BookCover } from '../components/books/BookCover'

const difficultyVariants = {
  beginner: 'success',
  intermediate: 'blue',
  advanced: 'warning',
}

function ProgressRing({ value }) {
  const radius = 27
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 64 64"
        aria-label={`${value}% complete`}
        role="img"
      >
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--c-border)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--c-blue)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * value) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-c-text">
        {value}%
      </span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <Skeleton className="aspect-[3/4]" />
        <div className="space-y-4">
          <Skeleton width="70%" height="42px" />
          <Skeleton width="40%" height="18px" />
          <Skeleton height="80px" />
          <Skeleton width="150px" height="44px" />
        </div>
      </div>
      <Skeleton height="300px" />
    </div>
  )
}

export default function BookDetail() {
  const { slug } = useParams()
  const [book, setBook] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    library
      .getBook(slug)
      .then(({ book: result }) => {
        if (active) setBook(result)
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError?.code === 'not_found'
              ? 'This book could not be found.'
              : requestError?.message || 'This book could not be loaded.',
          )
      })
    return () => {
      active = false
    }
  }, [slug])
  if (error)
    return (
      <EmptyState
        title="Book not found"
        description={error}
        actionLabel="Back to library"
        actionTo="/library"
      />
    )
  if (!book) return <DetailSkeleton />
  const related = book.related || []
  // Continue where the reader left off (the API remembers the last chapter opened).
  const resumeChapter = book.chapters.find(
    (chapter) => chapter.id === book.currentChapterId,
  )
  const readerPath = `/read/${book.slug}${resumeChapter ? `?chapter=${resumeChapter.order}` : ''}`
  return (
    <div className="space-y-10">
      <Link
        to="/library"
        className="inline-flex items-center gap-2 text-sm font-semibold text-c-text-muted hover:text-c-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>
      <section className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <BookCover
          book={book}
          className="mx-auto aspect-[3/4] w-full max-w-[280px] rounded-brand-lg shadow-md"
        />
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>{book.category}</Chip>
            <Badge variant={difficultyVariants[book.difficulty] || 'gray'}>
              {book.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-c-text-muted">
              <Clock className="h-4 w-4" />
              {book.estMinutes} minutes
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-c-text md:text-4xl">
            {book.title}
          </h1>
          <p className="mt-2 text-base font-medium text-c-text-muted">
            By {book.author}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-c-text-muted">
            {book.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              as={Link}
              to={book.finished ? `/read/${book.slug}?chapter=1` : readerPath}
              icon={book.started ? Play : BookOpen}
            >
              {book.finished
                ? 'Read again'
                : book.started
                  ? 'Continue reading'
                  : 'Start reading'}
            </Button>
            {book.started && (
              <div className="flex items-center gap-3">
                <ProgressRing value={book.progress} />
                <span className="text-sm text-c-text-muted">
                  Overall progress
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h2 className="text-2xl font-bold text-c-text">Chapters</h2>
          <div className="mt-4 divide-y divide-c-border rounded-brand-lg border border-c-border bg-white shadow-sm">
            {book.chapters.map((chapter) => {
              const complete = chapter.isCompleted
              return (
                <Link
                  to={`/read/${book.slug}?chapter=${chapter.order}`}
                  key={chapter.order}
                  className="flex items-center gap-4 p-4 hover:bg-c-blue-wash"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${complete ? 'bg-c-success text-white' : 'bg-c-blue-soft text-c-blue'}`}
                  >
                    {complete ? <Check className="h-4 w-4" /> : chapter.order}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-c-text">
                      {chapter.title}
                    </p>
                    <p className="mt-1 text-xs text-c-text-muted">
                      Chapter {chapter.order}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-c-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {chapter.estMinutes} min
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
        <aside className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-c-text">Topics</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <Chip key={tag} icon={Tag}>
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        </aside>
      </section>
      {related.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-c-text">Related books</h2>
            <Link to="/library" className="text-sm font-semibold text-c-blue">
              View library
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((relatedBook) => (
              <BookCard key={relatedBook.id} book={relatedBook} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
