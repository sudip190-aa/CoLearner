import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import {
  Avatar,
  Button,
  EmptyState,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { formatRelative } from '../lib/formatters.js'
import { describeNotification, isMention } from '../lib/notifications.js'
import { useNotificationStore } from '../store/notificationStore.js'

const groupFor = (date) => {
  const days = (Date.now() - new Date(date).getTime()) / 86400000
  return days < 1 ? 'Today' : days < 7 ? 'This week' : 'Earlier'
}

function NotificationRow({ notification, onOpen }) {
  const { actorName, phrase, label } = describeNotification(notification)
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      data-notification-id={notification.id}
      className={`flex w-full items-start gap-3 border-b border-c-border p-4 text-left transition-colors hover:bg-c-blue-wash ${notification.isRead ? 'bg-c-surface' : 'bg-c-blue-soft'}`}
    >
      <Avatar
        src={notification.actor?.avatar}
        name={notification.actor?.fullName || 'Colearn'}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-c-text">
          {actorName && <span className="font-semibold">{actorName} </span>}
          {phrase}
          {label && <span className="font-semibold text-c-blue"> {label}</span>}
        </p>
        <p className="mt-1 text-xs text-c-text-muted">
          {formatRelative(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-c-action"
          aria-label="Unread"
        />
      )}
    </button>
  )
}

export default function Notifications() {
  const navigate = useNavigate()
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const status = useNotificationStore((state) => state.status)
  const refresh = useNotificationStore((state) => state.refresh)
  const markRead = useNotificationStore((state) => state.markRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const [tab, setTab] = useState('all')
  const [historyError, setHistoryError] = useState('')
  const hasMore = useNotificationStore((state) => state.hasMore)
  const loadingMore = useNotificationStore((state) => state.loadingMore)
  const loadMore = useNotificationStore((state) => state.loadMore)

  const filtered = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          tab === 'all' ||
          (tab === 'unread' && !notification.isRead) ||
          (tab === 'mentions' && isMention(notification)),
      ),
    [notifications, tab],
  )
  const groups = ['Today', 'This week', 'Earlier']
  const openNotification = (notification) => {
    void markRead(notification.id)
    navigate(describeNotification(notification).to)
  }
  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Keep up with the people, projects, and conversations connected to your learning."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            Mark all as read
          </Button>
        }
      />
      <div className="mb-5">
        <Tabs value={tab} onChange={setTab}>
          <TabsList>
            <TabTrigger value="all">All</TabTrigger>
            <TabTrigger value="unread">
              Unread{unreadCount ? ` (${unreadCount})` : ''}
            </TabTrigger>
            <TabTrigger value="mentions">Mentions</TabTrigger>
          </TabsList>
        </Tabs>
      </div>
      {status === 'loading' || status === 'idle' ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} width="100%" height="64px" />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState
          title="Could not load notifications"
          description="Check your connection and try again."
          icon={Bell}
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="You are all caught up"
          description={
            tab === 'mentions'
              ? 'Nobody has mentioned you yet.'
              : 'New activity from your peers will appear here.'
          }
          icon={Bell}
        />
      ) : (
        <div className="overflow-hidden rounded-brand-lg border border-c-border bg-c-surface shadow-sm">
          {groups.map((group) => {
            const items = filtered.filter(
              (notification) => groupFor(notification.createdAt) === group,
            )
            return items.length ? (
              <section key={group}>
                <h2 className="border-b border-c-border bg-c-blue-wash px-4 py-3 text-xs font-bold uppercase tracking-wide text-c-text-muted">
                  {group}
                </h2>
                {items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={openNotification}
                  />
                ))}
              </section>
            ) : null
          })}
        </div>
      )}
      {hasMore && (
        <div className="mt-5 text-center">
          <Button
            variant="outline"
            loading={loadingMore}
            onClick={async () => {
              try {
                setHistoryError('')
                await loadMore()
              } catch {
                setHistoryError(
                  'Earlier notifications could not load. Try again.',
                )
              }
            }}
          >
            Load earlier notifications
          </Button>
        </div>
      )}
      {historyError && (
        <p role="alert" className="mt-3 text-sm text-c-danger">
          {historyError}
        </p>
      )}
    </div>
  )
}
