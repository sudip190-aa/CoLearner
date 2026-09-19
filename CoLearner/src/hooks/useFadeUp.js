import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref to attach to any element.
 * The element will fade-up when it enters the viewport.
 */
export const useFadeUp = (threshold = 0.1) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el) // Fire once
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}
