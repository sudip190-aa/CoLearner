import React from 'react'
import { useFadeUp } from '../../hooks/useFadeUp'

export const FadeUp = ({ children, delay = 0, className = '' }) => {
  const { ref, visible } = useFadeUp(0.08)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
      }}
    >
      {children}
    </div>
  )
}
