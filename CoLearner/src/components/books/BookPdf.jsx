import React, { useEffect, useState } from 'react'
import { Button, Input } from '../ui'
import { bookLearning } from '../../services/bookLearning'

export function BookPdf({ book, page, onPage }) {
  const [url, setUrl] = useState(''),
    [error, setError] = useState(''),
    [version, setVersion] = useState(0)
  useEffect(() => {
    let alive = true
    bookLearning
      .file(book.id)
      .then((r) => {
        if (alive) setUrl(r.url)
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    return () => {
      alive = false
    }
  }, [book.id, version])
  return (
    <section className="my-6">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Input
          type="number"
          min={1}
          max={book.totalPages}
          label="PDF page"
          value={page}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (n >= 1 && n <= book.totalPages) onPage(n)
          }}
          containerClassName="w-28"
        />
        <span className="pb-3 text-xs text-c-text-muted">
          of {book.totalPages} · This page is saved for next time.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVersion((v) => v + 1)}
        >
          Reload PDF
        </Button>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : url ? (
        <iframe
          key={`${url}-${page}`}
          title={`${book.title}, PDF page ${page}`}
          src={`${url}#page=${page}&toolbar=0`}
          className="h-[65vh] w-full rounded-xl border border-c-border"
        />
      ) : (
        <p className="text-sm text-c-text-muted">Opening PDF…</p>
      )}
      <p className="mt-2 text-xs text-c-text-muted">
        Use the page control above to save your place. If your browser cannot
        display PDFs, use the permitted download on the book page.
      </p>
    </section>
  )
}
