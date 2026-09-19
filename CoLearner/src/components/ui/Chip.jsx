import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'

export const Chip = forwardRef(function Chip(
  {
    children,
    onRemove,
    onClick,
    selected = false,
    disabled = false,
    icon: Icon,
    className,
    ...props
  },
  ref,
) {
  const isClickable = Boolean(onClick) && !disabled

  return (
    <div
      ref={ref}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-sans select-none border transition-colors',
        selected
          ? 'bg-c-blue-soft text-c-blue border-c-blue font-semibold'
          : 'bg-white text-c-text border-c-border hover:bg-slate-50',
        isClickable &&
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue focus-visible:ring-offset-1',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-c-text-muted" />}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) onRemove(e)
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-slate-200/80 text-c-text-muted hover:text-c-text transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-blue"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
})

Chip.displayName = 'Chip'
export default Chip
