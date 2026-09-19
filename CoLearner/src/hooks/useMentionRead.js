import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { result, supabase } from '../services/supabase/client'
import { useNotificationStore } from '../store/notificationStore'

export function useMentionRead(thread) {
  const cache = useQueryClient()
  useEffect(() => {
    if (!thread?.id) return
    let timer,
      disposed = false
    const pending = new Set(),
      seen = new Set()
    const flush = async () => {
      if (document.hidden || !pending.size) return
      const batch = [...pending]
      pending.clear()
      try {
        await result(
          supabase.rpc('colearn_read_mentions', {
            discussion: Number(thread.id),
            comment_ids: batch.filter((id) => id !== 'post').map(Number),
            post_seen: batch.includes('post'),
          }),
        )
        if (disposed) return
        batch.forEach((id) => seen.add(id))
        void cache.invalidateQueries({ queryKey: ['navigation-counts'] })
        void useNotificationStore.getState().refresh()
      } catch {
        if (!disposed) {
          batch.forEach((id) => pending.add(id))
          timer = setTimeout(flush, 5000)
        }
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (document.hidden) return
        for (const entry of entries) {
          const id = entry.target.dataset.mentionId
          if (
            entry.isIntersecting &&
            (entry.intersectionRect.height >= 24 ||
              entry.intersectionRatio >= 0.8) &&
            !seen.has(id)
          )
            pending.add(id)
        }
        clearTimeout(timer)
        timer = setTimeout(flush, 400)
      },
      { threshold: [0, 0.1, 0.8], rootMargin: '-76px 0px -64px 0px' },
    )
    const observe = () => {
      observer.disconnect()
      if (!document.hidden)
        document
          .querySelectorAll('[data-mention-id]')
          .forEach((element) => observer.observe(element))
    }
    observe()
    document.addEventListener('visibilitychange', observe)
    return () => {
      disposed = true
      clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', observe)
    }
  }, [thread, cache])
}
