import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { supabase } from '../services/supabase/client'

export function useNotificationSync() {
  const userId = useAuthStore((state) => state.user?.id)
  useEffect(() => {
    const store = useNotificationStore.getState()
    store.reset()
    if (!userId) return
    let debounce
    const refresh = () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => void store.refresh(), 150)
    }
    const channel = supabase
      .channel(`notifications:${userId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        refresh,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh()
      })
    void store.refresh()
    const visible = () => {
      if (!document.hidden) refresh()
    }
    const interval = setInterval(visible, 15000)
    document.addEventListener('visibilitychange', visible)
    return () => {
      clearTimeout(debounce)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', visible)
      void supabase.removeChannel(channel)
      store.reset()
    }
  }, [userId])
}
