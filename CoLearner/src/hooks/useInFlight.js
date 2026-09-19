import { useCallback, useRef } from 'react'

/**
 * Double-click / double-Enter guard for actions that have no submit button to disable.
 * `run(key, task)` ignores the call while a task with the same key is still pending, and hands
 * back the task's result otherwise. A ref (not state) so a second click in the same frame,
 * before React re-renders, is still caught.
 */
export function useInFlight() {
  const pending = useRef(new Set())
  return useCallback(async (key, task) => {
    if (pending.current.has(key)) return undefined
    pending.current.add(key)
    try {
      return await task()
    } finally {
      pending.current.delete(key)
    }
  }, [])
}
