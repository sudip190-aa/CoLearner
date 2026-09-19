import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, Input, Textarea } from '../ui'
import { admin } from '../../services/api'
import { bookLearning } from '../../services/bookLearning'

const textFields = [
  ['language', 'Language'],
  ['sourceUrl', 'Original source URL'],
  ['licenseName', 'License name'],
  ['licenseUrl', 'License URL'],
  ['licenseEvidenceUrl', 'License evidence URL'],
]
const permissionFields = [
  [
    'redistributionConfirmed',
    'I verified permission to redistribute this exact content/file',
  ],
  [
    'inAppPermissionConfirmed',
    'I verified explicit permission to use this content inside CoLearn',
  ],
  ['commercialUseAllowed', 'The license permits commercial use'],
]
export function BookPublishing({ book, onChanged }) {
  const [form, setForm] = useState(() => ({ ...book })),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [jobs, setJobs] = useState([]),
    [audit, setAudit] = useState([]),
    [suggestedChapters, setSuggestedChapters] = useState([])
  const reload = useCallback(async () => {
    const [j, a] = await Promise.all([
      bookLearning.jobs(book.id),
      bookLearning.audit(book.id),
    ])
    setJobs(j)
    setAudit(a)
  }, [book.id])
  useEffect(() => {
    let active = true
    Promise.all([bookLearning.jobs(book.id), bookLearning.audit(book.id)])
      .then(([j, a]) => {
        if (active) {
          setJobs(j)
          setAudit(a)
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    const timer = setInterval(() => reload().catch(() => {}), 10000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [book.id, reload])
  const run = async (fn, message) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await fn()
      if (result?.book) setForm({ ...result.book })
      if (result?.suggestedChapters) {
        setSuggestedChapters(result.suggestedChapters)
        setForm((f) => ({
          ...f,
          redistributionConfirmed: false,
          inAppPermissionConfirmed: false,
        }))
      }
      await onChanged()
      await reload()
      setNotice(message)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      className="space-y-4 border-t border-c-border pt-6"
      aria-label="Book publishing"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Publishing & permissions</h3>
        <span className="rounded-full bg-c-blue-soft px-3 py-1 text-xs font-semibold text-c-blue">
          {book.status.replaceAll('_', ' ')}
        </span>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-c-blue">
          Review source and license
        </summary>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () =>
                admin.adminSaveBook(
                  book.id,
                  Object.fromEntries([
                    ...textFields.map(([k]) => [k, form[k] || '']),
                    ...permissionFields.map(([k]) => [k, Boolean(form[k])]),
                    ...[
                      'attribution',
                      'changesMade',
                      'licenseEvidenceNotes',
                    ].map((k) => [k, form[k] || '']),
                  ]),
                ),
              'License details saved. Review permissions again after replacing a source or file.',
            )
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {textFields.map(([key, label]) => (
              <Input
                key={key}
                name={key}
                label={label}
                type={key.endsWith('Url') ? 'url' : 'text'}
                value={form[key] || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                required
              />
            ))}
          </div>
          {[
            ['attribution', 'Attribution and copyright notice'],
            ['changesMade', 'Changes made (write “None” if unchanged)'],
            [
              'licenseEvidenceNotes',
              'Evidence notes: how this exact content is permitted',
            ],
          ].map(([key, label]) => (
            <Textarea
              key={key}
              name={key}
              label={label}
              rows={3}
              value={form[key] || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              required
            />
          ))}
          {permissionFields.map(([key, label]) => (
            <Checkbox
              key={key}
              name={key}
              label={label}
              checked={Boolean(form[key])}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.checked }))
              }
            />
          ))}
          <p className="text-xs leading-5 text-c-text-muted">
            For reading-only permission, leave redistribution unchecked.
            Downloads stay blocked. Source/file replacements clear these
            confirmations and require another review.
          </p>
          <Button type="submit" size="sm" loading={busy}>
            Save license details
          </Button>
        </form>
      </details>
      <div className="rounded-xl bg-c-blue-wash p-4">
        <label className="text-sm font-medium" htmlFor={`document-${book.id}`}>
          PDF or EPUB
        </label>
        <input
          id={`document-${book.id}`}
          type="file"
          accept="application/pdf,application/epub+zip"
          disabled={busy}
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f)
              run(
                () => bookLearning.upload(book.id, f),
                'Document uploaded. Verify its license and chapter boundaries before approval.',
              )
            e.target.value = ''
          }}
        />
        <p className="mt-2 text-xs text-c-text-muted">
          {book.fileName ||
            'No file attached. Text chapters work without a file.'}{' '}
          · Maximum 20 MB
        </p>
        {book.fileChecksum && (
          <p className="mt-2 break-all font-mono text-[10px] text-c-text-muted">
            SHA-256: {book.fileChecksum}
          </p>
        )}
      </div>
      {suggestedChapters.length > 0 && book.chapters.length === 0 && (
        <div className="rounded-xl border border-c-border p-4">
          <h4 className="text-sm font-semibold">
            Detected PDF outline — review before approval
          </h4>
          <ul className="my-3 space-y-2 text-xs">
            {suggestedChapters.map((c) => (
              <li key={c.pageStart}>
                {c.title} · pages {c.pageStart}–{c.pageEnd}
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run(async () => {
                for (const [index, c] of suggestedChapters.entries())
                  await admin.adminSaveChapter(book.id, null, {
                    title: c.title,
                    chapterNumber: index + 1,
                    pageStart: c.pageStart,
                    pageEnd: c.pageEnd,
                    content: '',
                    status: 'PUBLISHED',
                  })
                setSuggestedChapters([])
              }, 'Chapters added. Review titles and page ranges in the chapter editor below.')
            }
          >
            Use these chapter boundaries
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {[
          ['PENDING_REVIEW', 'Submit for review'],
          ['APPROVED', 'Approve'],
          ['REJECTED', 'Reject'],
          ['ARCHIVED', 'Archive'],
        ].map(([status, label]) => (
          <Button
            key={status}
            size="sm"
            variant={status === 'APPROVED' ? 'primary' : 'outline'}
            disabled={busy || book.status === status}
            onClick={() =>
              run(
                () => admin.adminSaveBook(book.id, { status }),
                `${label}: saved`,
              )
            }
          >
            {label}
          </Button>
        ))}
        <Button
          as={Link}
          to={`/books/${book.slug}/read`}
          size="sm"
          variant="ghost"
        >
          Preview
        </Button>
      </div>
      <div className="border-t border-c-border pt-4">
        <h4 className="text-sm font-semibold">Book assistant</h4>
        <p className="mt-1 text-xs text-c-text-muted">
          {book.aiStatus?.replaceAll('_', ' ')} · Jobs run automatically in the
          background.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || book.status !== 'APPROVED'}
            onClick={() =>
              run(
                () => bookLearning.queue(book.id),
                'Processing queued. This also retries failed indexing jobs.',
              )
            }
          >
            Process / reprocess
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || book.status !== 'APPROVED'}
            onClick={() =>
              run(
                () => bookLearning.queue(book.id, 'summary'),
                'Summary generation queued.',
              )
            }
          >
            Generate / regenerate summaries
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  'Delete the search index and generated summaries? Reading content and progress are kept.',
                )
              )
                run(
                  () => bookLearning.deleteAi(book.id),
                  'Generated data deleted.',
                )
            }}
          >
            Delete AI data
          </Button>
        </div>
        {jobs.map((j) => (
          <div
            key={j.id}
            className="mt-3 rounded-lg border border-c-border p-3 text-xs"
          >
            <span className="font-medium">
              {j.kind} · {j.status}
            </span>
            <span className="ml-2 text-c-text-muted">
              {j.stage} · {new Date(j.created_at).toLocaleString()}
            </span>
            {j.error && <p className="mt-2 text-c-danger">{j.error}</p>}
          </div>
        ))}
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Audit history
        </summary>
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs text-c-text-muted">
          {audit.map((a) => (
            <li key={a.id}>
              {new Date(a.created_at).toLocaleString()} · {a.action}
              {a.details.status ? ` · ${a.details.status}` : ''}
            </li>
          ))}
        </ul>
      </details>
      {error && (
        <p role="alert" className="text-sm text-c-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-c-blue">
          {notice}
        </p>
      )}
    </section>
  )
}
