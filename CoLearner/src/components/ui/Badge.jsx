import React, { forwardRef } from 'react'
import clsx from 'clsx'

const VARIANT_STYLES = {
  blue: 'bg-c-blue-soft text-c-blue border-c-blue/20',
  // Yellow Law: yellow always uses dark text.
  yellow: 'bg-c-yellow-soft text-c-text border-c-yellow/60 font-semibold',
  gray: 'bg-slate-100 text-c-text-muted border-slate-200',
  success: 'bg-emerald-50 text-c-success border-emerald-200',
  warning: 'bg-amber-50 text-c-warning border-amber-200',
  danger: 'bg-rose-50 text-c-danger border-rose-200',
}

const DOT_COLORS = {
  blue: 'bg-c-blue',
  yellow: 'bg-c-yellow',
  gray: 'bg-c-text-muted',
  success: 'bg-c-success',
  warning: 'bg-c-warning',
  danger: 'bg-c-danger',
}

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-[11px] gap-1 rounded-md font-medium',
  md: 'px-2.5 py-1 text-xs gap-1.5 rounded-md font-medium',
}

export const Badge = forwardRef(function Badge(
  {
    children,
    variant = 'blue',
    size = 'md',
    dot = false,
    icon: Icon,
    className,
    ...props
  },
  ref,
) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.blue
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md
  const dotColorClass = DOT_COLORS[variant] || DOT_COLORS.blue

  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center border font-sans tracking-tight leading-none select-none shrink-0',
        variantClass,
        sizeClass,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColorClass)}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children && <span>{children}</span>}
    </span>
  )
})

Badge.displayName = 'Badge'
export default Badge
