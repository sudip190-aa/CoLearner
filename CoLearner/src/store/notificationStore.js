import { create } from 'zustand'
import { notifs } from '../services/api.js'
let generation = 0
let inFlight = null

// Server-backed. The bell's unread number comes from the server's own count (the list is capped), and marking
// something read updates the screen first and rolls back if the request fails.
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  loadingMore: false,
  status: 'idle', // idle | loading | ready | error

  refresh: async () => {
    if (inFlight) return inFlight
    const current = generation
    const request = (async () => {
      if (get().status === 'idle') set({ status: 'loading' })
      try {
        const [{ notifications }, unreadCount] = await Promise.all([
          notifs.getNotifications({ limit: 50 }),
          notifs.getUnreadCount(),
        ])
        if (current === generation)
          set((state) => ({
            notifications: [
              ...notifications,
              ...state.notifications.filter(
                (item) => !notifications.some((fresh) => fresh.id === item.id),
              ),
            ],
            unreadCount,
            hasMore:
              state.notifications.length > 50
                ? state.hasMore
                : notifications.length === 50,
            status: 'ready',
          }))
      } catch {
        if (current === generation)
          set({ status: get().notifications.length ? 'ready' : 'error' })
      }
    })()
    inFlight = request
    try {
      await request
    } finally {
      if (inFlight === request) inFlight = null
    }
  },

  loadMore: async () => {
    if (get().loadingMore || !get().hasMore) return
    const current = generation
    set({ loadingMore: true })
    try {
      const { notifications } = await notifs.getNotifications({
        offset: get().notifications.length,
      })
      if (current === generation)
        set((state) => ({
          notifications: [
            ...state.notifications,
            ...notifications.filter(
              (item) =>
                !state.notifications.some(
                  (existing) => existing.id === item.id,
                ),
            ),
          ],
          hasMore: notifications.length === 50,
        }))
    } finally {
      if (current === generation) set({ loadingMore: false })
    }
  },

  markRead: async (id) => {
    const current = generation
    const target = get().notifications.find((item) => item.id === String(id))
    if (!target || target.isRead) return
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === target.id ? { ...item, isRead: true } : item,
      ),
      unreadCount: Math.max(state.unreadCount - 1, 0),
    }))
    try {
      await notifs.markRead(target.id)
    } catch {
      if (current !== generation) return
      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === target.id ? { ...item, isRead: false } : item,
        ),
        unreadCount: state.unreadCount + 1,
      }))
    }
  },

  markAllRead: async () => {
    const current = generation
    const before = get()
    set({
      notifications: before.notifications.map((item) => ({
        ...item,
        isRead: true,
      })),
      unreadCount: 0,
    })
    try {
      await notifs.markAllRead()
    } catch {
      if (current !== generation) return
      set({
        notifications: before.notifications,
        unreadCount: before.unreadCount,
      })
    }
  },

  reset: () => {
    generation += 1
    inFlight = null
    set({
      notifications: [],
      unreadCount: 0,
      hasMore: false,
      loadingMore: false,
      status: 'idle',
    })
  },
}))

export default useNotificationStore
