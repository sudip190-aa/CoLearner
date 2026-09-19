import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore.js'
import { useNotificationStore } from '../store/notificationStore.js'

// Keeps the bell current while the app is open: on mount, when the tab becomes visible again, and every minute.
// A different person signing in (no page reload) starts from an empty list, never the previous person's.
export function useNotificationSync(intervalMs = 60000) {
  const userId = useAuthStore((state) => state.user?.id)
  const refresh = useNotificationStore((state) => state.refresh)
  const reset = useNotificationStore((state) => state.reset)
  useEffect(() => {
    if (!userId) return undefined
    reset()
    void refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const timer = window.setInterval(onVisible, intervalMs)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, refresh, reset, intervalMs])
}

export default useNotificationSync
