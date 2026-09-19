import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, MessageCircle, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useNotificationSync } from '../../hooks/useNotificationSync'
import { describeNotification } from '../../lib/notifications'

import { useNavigationSync } from '../../hooks/useNavigationCounts'
import { useVoiceCall } from '../calls/VoiceCallProvider'

function Popup({ item, dismiss, navigate }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 10000)
    return () => clearTimeout(timer)
  }, [item.id, dismiss])
  const description = describeNotification(item)
  const isMessage = ['direct_message', 'project_message'].includes(item.verb)
  const Icon = isMessage ? MessageCircle : Bell
  return (
    <div
      data-notification-popup={item.id}
      className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-c-blue/20 bg-c-surface p-4 pl-5 shadow-[0_12px_40px_-12px_rgba(24,54,94,0.3)] sm:gap-4 sm:p-5 sm:pl-6"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-c-action"
      />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-c-blue-soft text-c-blue">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <button
        className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue focus-visible:ring-offset-2"
        onClick={() => {
          void useNotificationStore.getState().markRead(item.id)
          dismiss(item.id)
          navigate(description.to)
        }}
      >
        <span className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-c-blue">
          {isMessage ? 'New message' : 'New notification'}
          <span
            className="h-1.5 w-1.5 rounded-full bg-c-action"
            aria-hidden="true"
          />
        </span>
        {isMessage ? (
          <>
            <span className="block truncate text-sm font-semibold leading-5 text-c-text">
              {description.actorName || 'Someone'}
            </span>
            <span className="mt-1 line-clamp-2 break-words text-xs leading-5 text-c-text-muted">
              {description.label || 'Sent you a message'}
            </span>
          </>
        ) : (
          <>
            <span className="block text-[13px] leading-5 text-c-text">
              <span className="font-semibold">{description.actorName} </span>
              {description.phrase}
            </span>
            {description.label && (
              <span className="mt-1 line-clamp-2 break-words text-xs leading-5 text-c-text-muted">
                {description.label}
              </span>
            )}
          </>
        )}
      </button>
      <button
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-c-text-muted transition-colors hover:bg-c-blue-soft hover:text-c-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        onClick={() => dismiss(item.id)}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function NotificationHub({
  navigate,
  bottomControlsVisible = false,
}) {
  useNotificationSync()
  useNavigationSync()
  const call = useVoiceCall()
  const user = useAuthStore((state) => state.user)
  const notifications = useNotificationStore((state) => state.notifications)
  const [popups, setPopups] = useState([])
  const session = useRef({ user: null, since: 0, seen: new Set() })
  const audio = useRef(null)
  const dismiss = useCallback(
    (id) => setPopups((items) => items.filter((item) => item.id !== id)),
    [],
  )
  useEffect(() => {
    const unlock = () => {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext
        if (Audio) {
          audio.current ||= new Audio()
          void audio.current.resume().catch(() => {})
        }
      } catch {
        /* Browser audio restriction. */
      }
    }
    document.addEventListener('pointerdown', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
      void audio.current?.close()
      audio.current = null
    }
  }, [])
  useEffect(() => {
    if (session.current.user !== user?.id) {
      let stored = []
      try {
        stored = JSON.parse(
          sessionStorage.getItem(`colearn:notification-seen:${user?.id}`) ||
            '[]',
        )
      } catch {
        /* Unavailable browser storage. */
      }
      session.current = {
        user: user?.id,
        since: Date.now(),
        seen: new Set(stored),
      }
      setPopups([])
    }
    if (!user) return
    const fresh = notifications.filter(
      (item) =>
        !item.isRead &&
        new Date(item.createdAt).getTime() >= session.current.since &&
        !session.current.seen.has(item.id),
    )
    notifications.forEach((item) => session.current.seen.add(item.id))
    try {
      sessionStorage.setItem(
        `colearn:notification-seen:${user.id}`,
        JSON.stringify([...session.current.seen].slice(-2000)),
      )
    } catch {
      /* No persistent storage. */
    }
    if (!fresh.length) return
    setPopups((items) => [...items, ...fresh.reverse()].slice(-3))
    if (
      user.notificationSound !== false &&
      !call?.busy &&
      !fresh.every((item) => item.verb === 'voice_call') &&
      audio.current?.state === 'running' &&
      !document.hidden
    ) {
      const context = audio.current,
        tone = context.createOscillator(),
        gain = context.createGain()
      tone.type = 'sine'
      tone.frequency.setValueAtTime(740, context.currentTime)
      gain.gain.setValueAtTime(0.035, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25)
      tone.connect(gain)
      gain.connect(context.destination)
      tone.start()
      tone.stop(context.currentTime + 0.26)
    }
  }, [notifications, user, call?.busy])
  return (
    <aside
      aria-label="New notifications"
      aria-live="polite"
      className={`pointer-events-none fixed right-4 z-[80] w-[calc(100%-2rem)] max-w-[420px] space-y-3 lg:right-6 ${call?.busy || bottomControlsVisible ? 'top-24' : 'bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6'}`}
    >
      {popups.map((item) => (
        <Popup
          key={item.id}
          item={item}
          dismiss={dismiss}
          navigate={navigate}
        />
      ))}
    </aside>
  )
}
