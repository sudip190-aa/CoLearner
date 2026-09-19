import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { result, supabase } from '../services/supabase/client'

export function useNavigationCounts() {
  const id = useAuthStore((state) => state.user?.id)
  return useQuery({
    queryKey: ['navigation-counts', id],
    queryFn: () => result(supabase.rpc('colearn_navigation_counts')),
    enabled: !!id,
    staleTime: 10000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })
}

// Owned by the app, including public profiles. RLS scopes every delivered row.
export function useNavigationSync() {
  const id = useAuthStore((state) => state.user?.id)
  const cache = useQueryClient()
  useEffect(() => {
    if (!id) return
    let timer
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        for (const key of [
          'navigation-counts',
          'project-inbox',
          'message-contacts',
        ])
          void cache.invalidateQueries({ queryKey: [key, id] })
      }, 150)
    }
    let channel = supabase.channel(`navigation:${id}:${crypto.randomUUID()}`)
    for (const table of [
      'direct_messages',
      'project_messages',
      'project_message_reads',
      'project_members',
      'join_requests',
      'connections',
      'notifications',
    ])
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        refresh,
      )
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') refresh()
    })
    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [id, cache])
}
