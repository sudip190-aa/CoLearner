import React from 'react'
import clsx from 'clsx'
import { Logo } from './Logo'

export function PageLoader({
  message = 'Loading Colearn...',
  fullScreen = true,
  className,
}) {
  const containerClasses = clsx(
    'flex flex-col items-center justify-center bg-c-surface text-c-text select-none',
    fullScreen ? 'fixed inset-0 z-50 min-h-screen' : 'py-24 w-full',
    className,
  )

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Logo with gentle pulsing animation */}
        <div className="animate-pulse">
          <Logo variant="mark" size="xl" />
        </div>

        {/* Loading message */}
        {message && (
          <p className="text-sm font-semibold tracking-tight text-c-text-muted animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default PageLoader
