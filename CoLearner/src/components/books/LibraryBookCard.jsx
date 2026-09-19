import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Loader2,
} from 'lucide-react'
import { ProgressBar } from '../ui'
import { readingLink } from '../../lib/library'

const bands = [
  'bg-c-blue-soft text-c-blue',
  'bg-c-yellow-soft text-c-text',
  'bg-c-blue-wash text-c-blue',
]

export default function LibraryBookCard({
  book,
  saved,
  saving,
  disabled,
  onSave,
}) {
  const tone =
    [...book.category].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) %
    bands.length
  const progress = Math.min(100, Math.max(0, Math.round(book.progress || 0)))
  return (
    <article
      data-library-book={book.slug}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-white text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`flex h-16 shrink-0 items-center justify-between gap-3 px-5 py-3 ${bands[tone]}`}
      >
        <span
          title={book.category}
          className="min-w-0 line-clamp-2 text-[10px] font-bold uppercase leading-4 tracking-[0.1em]"
        >
          {book.category}
        </span>
        <button
          type="button"
          onClick={() => onSave(book)}
          disabled={disabled || saving}
          aria-pressed={saved}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${book.title}`}
          title={saved ? 'Remove from saved books' : 'Save for later'}
          className="-mr-2 shrink-0 rounded-lg p-2 transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/library/${book.slug}`}
          title={book.title}
          className="block min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          <h2 className="h-12 line-clamp-2 break-words text-lg font-bold leading-6 tracking-tight text-c-text transition-colors hover:text-c-blue">
            {book.title}
          </h2>
        </Link>
        <p
          title={book.author}
          className="mt-2 h-5 truncate text-sm leading-5 text-c-text-muted"
        >
          {book.author}
        </p>
        <div className="mt-3 flex min-h-6 items-center">
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${book.difficulty === 'advanced' ? 'bg-c-yellow-soft text-c-text' : 'bg-c-blue-soft text-c-blue'}`}
          >
            {book.difficulty}
          </span>
        </div>
        <p className="mb-5 mt-3 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-c-text-muted">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{book.estMinutes} minutes</span>
          </span>
          <span className="shrink-0 text-c-border" aria-hidden="true">
            ·
          </span>
          <span className="whitespace-nowrap tabular-nums">
            {book.chapterCount} chapters
          </span>
        </p>
        <div className="mt-auto">
          <ProgressBar
            value={progress}
            size="sm"
            aria-label={`${book.title} progress`}
          />
          <div className="mt-3 flex min-h-5 items-center justify-between gap-2 text-xs leading-5">
            <span className="whitespace-nowrap tabular-nums text-c-text-muted">
              {book.finished
                ? 'Completed'
                : book.started
                  ? `${progress}% complete`
                  : 'Not started'}
            </span>
            <Link
              to={readingLink(book)}
              aria-label={`${book.finished ? 'Review' : book.started ? 'Continue' : 'Start'} ${book.title}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded font-semibold text-c-blue hover:text-c-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
            >
              {book.finished ? 'Review' : book.started ? 'Continue' : 'Start'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
