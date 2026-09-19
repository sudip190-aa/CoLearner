import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Modal, Pagination } from '../ui'

// Loads a paginated admin list. Changing the filters or calling reload() refetches; the previous rows stay on screen
// while that happens (no skeleton flash after every action). Only the latest request may write its result.
export function useAdminList(fetcher, params) {
  const paramsKey = JSON.stringify(params)
  const [reloads, setReloads] = useState(0)
  const key = `${paramsKey}|${reloads}`
  const [state, setState] = useState({ key: '', status: 'loading', data: null })

  useEffect(() => {
    let active = true
    fetcher(JSON.parse(paramsKey))
      .then((data) => active && setState({ key, status: 'ready', data }))
      .catch(
        (error) =>
          active &&
          setState((current) => ({
            key,
            status: 'error',
            data: current.data,
            error,
          })),
      )
    return () => {
      active = false
    }
  }, [fetcher, paramsKey, key])

  const reload = useCallback(() => setReloads((count) => count + 1), [])
  const settled = state.key === key
  return {
    data: state.data,
    // 'loading' only matters when there is nothing to show yet
    status: settled ? state.status : state.data ? 'refreshing' : 'loading',
    error: state.error,
    reload,
  }
}

// Text that reaches the list only after the person stops typing.
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  const timer = useRef(null)
  useEffect(() => {
    timer.current = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer.current)
  }, [value, delay])
  return debounced
}

export function Pager({ data, onPage }) {
  if (!data || data.pages <= 1) return null
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-c-text-muted">
        Page {data.page} of {data.pages} · {data.count.toLocaleString()} total
      </p>
      <Pagination
        currentPage={data.page}
        totalPages={data.pages}
        onPageChange={onPage}
      />
    </div>
  )
}

// A small "are you sure" dialog. `onConfirm` may be async; the dialog stays open and shows the error if it throws.
export function ConfirmModal({ request, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!request) return null
  const run = async () => {
    setBusy(true)
    setError('')
    try {
      await request.onConfirm()
      onClose()
    } catch (failure) {
      setError(failure?.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      isOpen
      onClose={busy ? undefined : onClose}
      title={request.title}
      description={request.description}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={request.danger ? 'danger' : 'primary'}
            onClick={run}
            loading={busy}
            data-confirm="yes"
          >
            {request.confirmLabel || 'Confirm'}
          </Button>
        </div>
      }
    >
      {error && (
        <p
          role="alert"
          className="rounded-brand bg-c-danger-soft p-3 text-sm text-c-danger"
        >
          {error}
        </p>
      )}
    </Modal>
  )
}

export const formatDay = (value) =>
  value ? new Date(value).toLocaleDateString() : '—'

export function TableShell({ children, minWidth = 760 }) {
  return (
    <div className="overflow-x-auto rounded-brand-lg border border-c-border bg-c-surface shadow-sm">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export const THead = ({ columns }) => (
  <thead className="bg-c-blue-wash text-xs uppercase tracking-wide text-c-text-muted">
    <tr>
      {columns.map(([label, align]) => (
        <th
          key={label}
          className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''}`}
        >
          {label}
        </th>
      ))}
    </tr>
  </thead>
)

export function ListError({ onRetry }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between rounded-brand border border-c-danger/30 bg-c-danger-soft p-3 text-sm text-c-danger"
    >
      Could not load this list.
      <Button size="sm" variant="ghost" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
