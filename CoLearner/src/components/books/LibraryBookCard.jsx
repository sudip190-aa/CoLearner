import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { ProgressBar } from '../ui'
import { readingLink } from '../../lib/library'
import LibraryBookCover from './LibraryBookCover'

export default function LibraryBookCard({
  book,
  saved,
  saving,
  disabled,
  onSave,
}) {
  const progress = Math.min(100, Math.max(0, Math.round(book.progress || 0)))
  const action = book.finished ? 'Review' : book.started ? 'Continue' : 'Read'
  return (
    <article
      data-library-book={book.slug}
      className="group flex min-w-0 gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-c-blue/10 hover:bg-c-blue-wash/70"
    >
      <Link
        to={`/library/${book.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="shrink-0 self-start overflow-hidden rounded-md shadow-sm transition-transform motion-safe:group-hover:-translate-y-0.5"
      >
        <LibraryBookCover book={book} compact className="h-28 w-20" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-1">
          <Link
            to={`/library/${book.slug}`}
            title={book.title}
            className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
          >
            <h3 className="line-clamp-2 min-h-10 !text-[13px] !font-semibold !leading-5 text-c-text hover:text-c-blue">
              {book.title}
            </h3>
          </Link>
          <button
            type="button"
            onClick={() => onSave(book)}
            disabled={disabled || saving}
            aria-pressed={saved}
            aria-label={`${saved ? 'Unsave' : 'Save'} ${book.title}`}
            title={saved ? 'Remove from saved books' : 'Save for later'}
            className={`-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-c-blue-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue disabled:opacity-40 ${saved ? 'text-c-blue' : 'text-c-text-muted'}`}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : saved ? (
              <BookmarkCheck size={15} />
            ) : (
              <Bookmark size={15} />
            )}
          </button>
        </div>
        <p
          title={book.author}
          className="mt-1 truncate text-[11px] text-c-text-muted"
        >
          {book.author}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[10px] leading-4 text-c-text-muted">
          <span className="capitalize">{book.difficulty}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{book.estMinutes} min</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {book.started ? (
            <span className="text-[10px] font-medium text-c-text-muted">
              {book.finished ? 'Completed' : `${progress}% read`}
            </span>
          ) : (
            <span className="truncate text-[10px] text-c-text-muted">
              {book.chapterCount} chapters
            </span>
          )}
          <Link
            to={readingLink(book)}
            aria-label={`${action} ${book.title}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-c-blue hover:text-c-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
          >
            {action}
            <ArrowRight size={13} />
          </Link>
        </div>
        {book.started && (
          <ProgressBar
            value={progress}
            size="sm"
            className="mt-2"
            aria-label={`${book.title} progress`}
          />
        )}
      </div>
    </article>
  )
}
