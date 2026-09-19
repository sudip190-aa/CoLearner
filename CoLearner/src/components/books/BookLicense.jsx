import React from 'react'

export function BookLicense({ book }) {
  const safeLink = (url, label) =>
    /^https:\/\//.test(url || '') ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-c-blue underline underline-offset-4"
      >
        {label}
      </a>
    ) : (
      <span>{label}</span>
    )
  return (
    <section
      className="rounded-2xl border border-c-border bg-c-blue-wash/40 p-5 text-sm leading-6"
      aria-label="Source and license"
    >
      <h2 className="font-semibold text-c-text">Source & license</h2>
      <p className="mt-2">
        {safeLink(book.sourceUrl, 'Original source')} ·{' '}
        {safeLink(
          book.licenseUrl,
          book.licenseName || 'License pending review',
        )}{' '}
        · {book.language}
      </p>
      <details className="mt-3 text-c-text-muted">
        <summary className="cursor-pointer font-medium">
          Attribution & full license notice
        </summary>
        <p className="mt-2 whitespace-pre-line">{book.attribution}</p>
      </details>
      <p className="mt-3 text-c-text-muted">
        <span className="font-medium text-c-text">Changes: </span>
        {book.changesMade || 'None documented.'}
      </p>
      {!book.redistributionConfirmed && (
        <p className="mt-2 text-c-text-muted">
          Available for reading in CoLearn. File downloads are not permitted.
        </p>
      )}
    </section>
  )
}
