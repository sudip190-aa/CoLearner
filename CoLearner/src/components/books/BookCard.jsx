import React from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Badge, Chip, ProgressBar } from '../ui'
import { BookCover } from './BookCover'

const difficultyVariants = {
  beginner: 'success',
  intermediate: 'blue',
  advanced: 'warning',
}

export function BookCard({ book }) {
  return (
    <article className="group overflow-hidden rounded-brand border border-c-border bg-c-surface shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/library/${book.slug}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-c-blue-wash">
          <BookCover
            book={book}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <Chip>{book.category}</Chip>
            <Badge
              variant={difficultyVariants[book.difficulty] || 'gray'}
              size="sm"
            >
              {book.difficulty}
            </Badge>
          </div>
          <h3 className="mt-3 line-clamp-2 min-h-12 text-base font-bold leading-6 text-c-text group-hover:text-c-blue">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-c-text-muted">{book.author}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-c-text-muted">
            <Clock className="h-3.5 w-3.5" />
            {book.estMinutes} minutes
          </p>
          {book.started && (
            <div className="mt-4">
              <ProgressBar value={book.progress} size="sm" />
              <p className="mt-1 text-xs font-semibold text-c-blue">
                {book.finished ? 'Finished' : `${book.progress}% complete`}
              </p>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

export default BookCard
