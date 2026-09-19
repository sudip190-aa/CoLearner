import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useNotificationSync } from '../../hooks/useNotificationSync'
import { describeNotification } from '../../lib/notifications'

function Popup({ item, dismiss, navigate }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 10000)
    return () => clearTimeout(timer)
  }, [item.id, dismiss])
  const description = describeNotification(item)
  return (
    <div
      data-notification-popup={item.id}
      className="pointer-events-auto flex gap-3 rounded-2xl border border-c-border bg-white p-4 shadow-lg"
    >
      <Bell size={18} className="mt-1 shrink-0 text-c-blue" />
      <button
        className="min-w-0 flex-1 text-left text-sm leading-6"
        onClick={() => {
          void useNotificationStore.getState().markRead(item.id)
          dismiss(item.id)
          navigate(description.to)
        }}
      >
        <span className="font-semibold">{description.actorName} </span>
        {description.phrase}{' '}
        <span className="font-medium">{description.label}</span>
      </button>
      <button
        aria-label="Dismiss notification"
        className="self-start rounded p-1 text-c-text-muted hover:bg-c-blue-wash"
        onClick={() => dismiss(item.id)}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function NotificationHub({ navigate }) {
  useNotificationSync()
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
  }, [notifications, user])
  return (
    <aside
      aria-label="New notifications"
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 z-[80] w-[calc(100%-2rem)] max-w-sm space-y-3 md:bottom-6"
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
