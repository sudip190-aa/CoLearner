import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  CircleSlash,
  ExternalLink,
  Eye,
  Flag,
  RotateCcw,
  Trash2,
  UserX,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  ConfirmModal,
  ListError,
  Pager,
  formatDay,
  useAdminList,
} from '../../components/admin/AdminParts.jsx'
import { admin } from '../../services/api.js'

const STATUS_VARIANT = {
  open: 'warning',
  review: 'blue',
  resolved: 'success',
  dismissed: 'gray',
}
const STATUS_LABEL = {
  open: 'Open',
  review: 'In review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}
const TYPE_LABEL = { thread: 'Discussion', comment: 'Comment', user: 'Profile' }

const targetLink = (target) => {
  if (!target.exists) return null
  if (target.type === 'user') return `/u/${target.username}`
  if (target.slug) return `/community/${target.slug}`
  return null
}

function ReportCard({ report, busy, onAct, onConfirm }) {
  const { target } = report
  const link = targetLink(target)
  const closed = report.status === 'resolved' || report.status === 'dismissed'
  return (
    <article
      data-report={report.id}
      data-status={report.status}
      className="rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-c-text-muted">
            <Badge variant="gray" size="sm">
              {TYPE_LABEL[target.type] || target.type}
            </Badge>
            <span>{formatDay(report.createdAt)}</span>
            {target.author && <span>by @{target.author}</span>}
          </div>
          <h2 className="mt-2 text-base font-bold text-c-text">
            {link ? (
              <Link
                to={link}
                className="inline-flex items-center gap-1.5 hover:text-c-blue"
              >
                {target.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : (
              target.label
            )}
          </h2>
          {target.preview && (
            <p className="mt-2 line-clamp-3 whitespace-pre-line rounded-brand bg-c-blue-wash/60 p-3 text-sm leading-6 text-c-text-muted">
              {target.preview}
            </p>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[report.status] || 'gray'} dot>
          {STATUS_LABEL[report.status] || report.status}
        </Badge>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-c-text-muted">
        <Avatar
          src={report.reporter.avatar}
          name={report.reporter.fullName}
          size="sm"
        />
        <span>
          <span className="font-semibold text-c-text">
            {report.reporter.fullName}
          </span>{' '}
          reported this: “{report.reason}”
        </span>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-c-border pt-4">
        {closed ? (
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            disabled={busy}
            onClick={() => onAct(report, 'reopen', 'Report reopened')}
          >
            Reopen
          </Button>
        ) : (
          <>
            {report.status === 'open' && (
              <Button
                size="sm"
                variant="ghost"
                icon={Eye}
                disabled={busy}
                onClick={() => onAct(report, 'review', 'Marked as in review')}
              >
                Start review
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={CircleSlash}
              disabled={busy}
              onClick={() => onAct(report, 'dismiss', 'Report dismissed')}
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={Check}
              disabled={busy}
              onClick={() => onAct(report, 'resolve', 'Report resolved')}
            >
              Resolve
            </Button>
            {target.exists &&
              (target.type === 'thread' || target.type === 'comment') && (
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  disabled={busy}
                  onClick={() =>
                    onConfirm({
                      title: `Remove this ${TYPE_LABEL[target.type].toLowerCase()}?`,
                      description:
                        'It is deleted for everyone, and every report about it is closed. This cannot be undone.',
                      confirmLabel: 'Remove content',
                      danger: true,
                      onConfirm: () =>
                        onAct(
                          report,
                          'remove_content',
                          'Content removed',
                          true,
                        ),
                    })
                  }
                >
                  Remove content
                </Button>
              )}
            {target.exists && target.type === 'user' && (
              <Button
                size="sm"
                variant="danger"
                icon={UserX}
                disabled={busy}
                onClick={() =>
                  onConfirm({
                    title: `Deactivate @${target.username}?`,
                    description:
                      'They are signed out and cannot log in. You can reactivate them from Users. Staff accounts cannot be deactivated here.',
                    confirmLabel: 'Deactivate account',
                    danger: true,
                    onConfirm: () =>
                      onAct(
                        report,
                        'deactivate_user',
                        'Account deactivated',
                        true,
                      ),
                  })
                }
              >
                Deactivate user
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  )
}

export default function AdminReports() {
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(null)
  const list = useAdminList(admin.adminListReports, {
    status: tab === 'all' ? '' : tab,
    page,
  })
  const { data } = list

  // rethrow=true lets a confirm dialog show the server's reason instead of closing
  const act = async (report, action, message, rethrow = false) => {
    setBusy(report.id)
    try {
      await admin.adminActOnReport(report.id, action)
      toast.success(message)
      list.reload()
    } catch (error) {
      const reason =
        error?.fields?.action?.[0] ||
        error?.message ||
        'Could not update the report'
      if (rethrow) throw new Error(reason, { cause: error })
      toast.error(reason)
    } finally {
      setBusy(null)
    }
  }
  const changeTab = (next) => {
    setTab(next)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Triage community reports and leave a clear moderation trail."
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={changeTab}>
          <TabsList>
            <TabTrigger value="pending">Needs action</TabTrigger>
            <TabTrigger value="resolved">Resolved</TabTrigger>
            <TabTrigger value="dismissed">Dismissed</TabTrigger>
            <TabTrigger value="all">All</TabTrigger>
          </TabsList>
        </Tabs>
        {data && (
          <span className="flex items-center gap-2 text-sm text-c-text-muted">
            <Flag className="h-4 w-4 text-c-warning" />
            {data.count} {data.count === 1 ? 'report' : 'reports'}
          </span>
        )}
      </div>
      {list.status === 'error' && <ListError onRetry={list.reload} />}
      {list.status === 'loading' ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height="150px" />
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <div className="space-y-4">
            {data.items.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                busy={busy === report.id}
                onAct={act}
                onConfirm={setConfirm}
              />
            ))}
          </div>
          <Pager data={data} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title={tab === 'pending' ? 'Queue is clear' : 'Nothing here'}
          description={
            tab === 'pending'
              ? 'New reports will appear here.'
              : 'No reports with this status.'
          }
        />
      )}
      <ConfirmModal request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
