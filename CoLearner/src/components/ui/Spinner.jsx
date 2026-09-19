import React, { forwardRef } from 'react'
import clsx from 'clsx'

const SIZE_MAP = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const COLOR_MAP = {
  blue: 'text-c-blue',
  white: 'text-white',
  gray: 'text-c-text-muted',
  yellow: 'text-c-yellow',
}

export const Spinner = forwardRef(function Spinner(
  { size = 'md', color = 'blue', className, ...props },
  ref,
) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md
  const colorClass = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <svg
      ref={ref}
      className={clsx(
        'animate-spin shrink-0',
        sizeClass,
        colorClass,
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
})

Spinner.displayName = 'Spinner'
export default Spinner
