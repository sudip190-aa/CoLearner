import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { messages } from '../services/messages'
import { useAuthStore } from '../store/authStore'

export function useMessageInbox() {
  const id = useAuthStore((state) => state.user?.id)
  return useQuery({
    queryKey: ['message-contacts', id],
    queryFn: messages.contacts,
    enabled: !!id,
    refetchInterval: 30000,
  })
}

// One subscription per signed-in app shell. RLS also applies to Realtime delivery.
export function useMessageSync() {
  const id = useAuthStore((state) => state.user?.id)
  const cache = useQueryClient()
  useEffect(() => {
    if (!id) return
    const refresh = () => {
      void cache.invalidateQueries({ queryKey: ['message-contacts', id] })
      void cache.invalidateQueries({ queryKey: ['messages', id] })
    }
    return messages.subscribe(id, refresh, (connected) => {
      if (connected) refresh()
    })
  }, [id, cache])
}
