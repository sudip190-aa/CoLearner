import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '../ui'
import { bookLearning } from '../../services/bookLearning'

export function MyLearning() {
  const [items, setItems] = useState([]),
    [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    bookLearning
      .learning()
      .then((r) => {
        if (alive) setItems(r.filter((p) => p.book))
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    return () => {
      alive = false
    }
  }, [])
  return (
    <section className="rounded-2xl border border-c-border bg-c-surface p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold">My learning</h2>
        <Link to="/library" className="text-xs font-semibold text-c-blue">
          My books →
        </Link>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-c-text-muted">
          {error}
        </p>
      ) : !items.length ? (
        <p className="text-sm text-c-text-muted">
          Your next chapter starts in the{' '}
          <Link to="/books" className="text-c-blue">
            book library
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-5">
          {items.slice(0, 4).map((p) => (
            <div key={p.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {p.book.title}
                  </h3>
                  <p className="mt-1 text-xs text-c-text-muted">
                    {p.completed
                      ? 'Completed'
                      : p.chapter?.title || 'Ready to read'}{' '}
                    · {p.completed_chapters.length} chapters complete
                  </p>
                </div>
                <Link
                  to={`/books/${p.book.slug}/read`}
                  className="shrink-0 text-xs font-semibold text-c-blue"
                >
                  {p.completed ? 'Review' : 'Continue'} →
                </Link>
              </div>
              <ProgressBar
                value={p.progress_percent}
                size="sm"
                className="mt-3"
              />
              <p className="mt-1 text-right text-xs text-c-text-muted">
                {p.progress_percent}%
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
