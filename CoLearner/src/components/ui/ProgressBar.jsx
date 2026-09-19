import React, { forwardRef } from 'react'
import clsx from 'clsx'

const COLOR_STYLES = {
  blue: 'bg-c-action',
  // Yellow Law: Used for XP bar fill and streak highlights
  yellow: 'bg-c-yellow border-r border-c-text/20',
  success: 'bg-c-success-solid',
  danger: 'bg-c-danger-solid',
}

export const ProgressBar = forwardRef(function ProgressBar(
  {
    value = 0,
    max = 100,
    color = 'blue',
    label,
    showValue = false,
    size = 'md', // 'sm' | 'md' | 'lg'
    className,
    ...props
  },
  ref,
) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div
      ref={ref}
      className={clsx('w-full flex flex-col space-y-1.5', className)}
      {...props}
    >
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold text-c-text">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="text-c-text-muted tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={clsx(
          'w-full bg-c-blue-soft rounded-full overflow-hidden border border-c-border/60',
          heightClasses[size] || heightClasses.md,
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            COLOR_STYLES[color] || COLOR_STYLES.blue,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})

ProgressBar.displayName = 'ProgressBar'
export default ProgressBar
