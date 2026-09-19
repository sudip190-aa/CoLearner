import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BookOpen } from 'lucide-react'
import { Button, ProgressBar } from '../ui'
import { readingLink } from '../../lib/library'
import LibraryBookCover from './LibraryBookCover'

export function LibraryHighlights({ books }) {
  const [featured, ...picks] = books
  if (!featured) return null
  return (
    <section aria-label="Book highlights" className="grid gap-5 sm:grid-cols-2">
      <div className="relative flex flex-col overflow-hidden rounded-3xl border border-c-blue/10 bg-c-blue-soft p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-c-blue">
          Discover a new read
        </p>
        <div className="relative my-5 flex min-h-32 items-center gap-5">
          <LibraryBookCover
            book={featured}
            className="h-36 w-24 shrink-0 -rotate-6 rounded-md shadow-[8px_10px_20px_-9px_rgba(24,54,94,0.5)]"
          />
          <div className="min-w-0">
            <span className="line-clamp-2 text-[10px] font-medium leading-4 text-c-blue">
              {featured.category}
            </span>
            <h2 className="mt-2 line-clamp-3 !text-lg !font-bold !leading-6 !tracking-tight">
              {featured.title}
            </h2>
            <p className="mt-2 line-clamp-1 text-xs text-c-text-muted">
              {featured.author}
            </p>
          </div>
        </div>
        <Link
          to={`/library/${featured.slug}`}
          className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-c-surface px-4 py-2.5 text-xs font-semibold text-c-blue transition hover:bg-c-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          Explore book <ArrowRight size={14} />
        </Link>
      </div>
      {!!picks.length && (
        <div className="hidden rounded-3xl border border-c-border/70 bg-c-surface p-5 sm:block sm:p-6">
          <h2 className="!text-sm !font-semibold">Worth a read</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {picks.map((book) => (
              <Link
                key={book.id}
                to={`/library/${book.slug}`}
                className="group min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
              >
                <div className="flex h-32 items-center justify-center rounded-xl bg-c-blue-wash transition-colors group-hover:bg-c-blue-soft">
                  <LibraryBookCover
                    book={book}
                    compact
                    className="h-28 w-20 rounded-md shadow-sm transition-transform motion-safe:group-hover:-translate-y-1"
                  />
                </div>
                <h3 className="mt-3 line-clamp-2 !text-xs !font-semibold !leading-5 group-hover:text-c-blue">
                  {book.title}
                </h3>
                <p className="mt-1 truncate text-[10px] text-c-text-muted">
                  {book.author}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function LibraryReadingShelf({
  current,
  saved,
  personalReady,
  onViewSaved,
}) {
  return (
    <aside
      aria-label="Your reading shelf"
      className="grid min-w-0 gap-5 sm:grid-cols-2 xl:block xl:space-y-5"
    >
      {current && (
        <section className="rounded-3xl border border-c-border/70 bg-c-surface p-6 text-center">
          <h2 className="!text-sm !font-semibold">
            {current.started && !current.finished
              ? 'Continue reading'
              : 'Start here'}
          </h2>
          <div className="relative my-6 flex justify-center">
            <div
              aria-hidden="true"
              className="absolute bottom-0 h-28 w-36 rounded-full bg-c-blue-soft/70"
            />
            <LibraryBookCover
              book={current}
              className="relative h-40 w-28 rounded-md shadow-[8px_12px_18px_-10px_rgba(24,54,94,0.45)]"
            />
          </div>
          <h3 className="line-clamp-2 !text-sm !font-semibold !leading-5">
            {current.title}
          </h3>
          <p className="mt-2 truncate text-[11px] text-c-text-muted">
            {current.author}
          </p>
          {current.started ? (
            <div className="mt-5 text-left">
              <ProgressBar
                value={current.progress}
                size="sm"
                aria-label="Current book progress"
              />
              <p className="mt-2 text-[10px] text-c-text-muted">
                {Math.round(current.progress || 0)}% complete
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[11px] text-c-text-muted">
              {current.chapterCount} chapters{' '}
              <span className="px-1">&middot;</span> {current.estMinutes} min
            </p>
          )}
          <Button
            to={readingLink(current)}
            icon={BookOpen}
            className="mt-5 w-full !rounded-xl !text-xs"
          >
            {current.started ? 'Pick up your book' : 'Start reading'}
          </Button>
        </section>
      )}
      {personalReady && (
        <section className="rounded-3xl border border-c-border/70 bg-c-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="!text-sm !font-semibold">Saved for later</h2>
            <Bookmark size={15} className="text-c-blue" />
          </div>
          {saved.length ? (
            <>
              <div className="mt-5 space-y-4">
                {saved.slice(0, 3).map((book) => (
                  <Link
                    key={book.id}
                    to={`/library/${book.slug}`}
                    className="group flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
                  >
                    <LibraryBookCover
                      book={book}
                      compact
                      thumbnail
                      className="h-12 w-9 shrink-0 rounded"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-medium leading-4 group-hover:text-c-blue">
                        {book.title}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-c-text-muted">
                        {book.author}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                onClick={onViewSaved}
                className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-c-blue hover:underline"
              >
                View saved books <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <p className="mt-4 text-xs leading-5 text-c-text-muted">
              Bookmark a book to keep your next read close.
            </p>
          )}
        </section>
      )}
    </aside>
  )
}
