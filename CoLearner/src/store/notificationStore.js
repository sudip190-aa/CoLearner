import { create } from 'zustand'
import { notifs } from '../services/api.js'

// Server-backed. The bell's unread number comes from the server's own count (the list is capped), and marking
// something read updates the screen first and rolls back if the request fails.
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  status: 'idle', // idle | loading | ready | error

  refresh: async () => {
    if (get().status === 'idle') set({ status: 'loading' })
    try {
      const [{ notifications }, unreadCount] = await Promise.all([
        notifs.getNotifications({ limit: 50 }),
        notifs.getUnreadCount(),
      ])
      set({ notifications, unreadCount, status: 'ready' })
    } catch {
      set({ status: get().notifications.length ? 'ready' : 'error' })
    }
  },

  markRead: async (id) => {
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
      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === target.id ? { ...item, isRead: false } : item,
        ),
        unreadCount: state.unreadCount + 1,
      }))
    }
  },

  markAllRead: async () => {
    const before = get()
    set({
      notifications: before.notifications.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    })
    try {
      await notifs.markAllRead()
    } catch {
      set({ notifications: before.notifications, unreadCount: before.unreadCount })
    }
  },

  reset: () => set({ notifications: [], unreadCount: 0, status: 'idle' }),
}))

export default useNotificationStore
