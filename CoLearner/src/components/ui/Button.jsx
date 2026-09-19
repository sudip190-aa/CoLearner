import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const VARIANT_STYLES = {
  primary:
    'bg-c-blue hover:bg-c-blue-hover active:bg-c-blue-hover text-white shadow-sm border border-transparent',
  secondary:
    'bg-c-blue-soft hover:bg-c-blue-soft/80 active:bg-blue-100 text-c-blue border border-transparent font-medium',
  outline:
    'bg-white hover:bg-c-blue-soft/40 active:bg-c-blue-soft text-c-blue border border-c-blue font-medium',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-c-text border border-transparent font-medium',
  danger:
    'bg-c-danger hover:bg-red-700 active:bg-red-800 text-white shadow-sm border border-transparent font-medium',
  // Yellow Law: yellow always uses dark text.
  yellow:
    'bg-c-yellow hover:bg-c-yellow-soft active:bg-c-yellow-soft text-c-text font-bold shadow-sm border border-transparent',
}

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs rounded-brand gap-1.5 h-8',
  md: 'px-4 py-2 text-sm rounded-brand gap-2 h-10',
  lg: 'px-6 py-3 text-base rounded-brand-lg gap-2.5 h-12',
}

const ICON_SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    as = 'button',
    to,
    href,
    className,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md
  const iconSizeClass = ICON_SIZES[size] || ICON_SIZES.md

  const baseClasses = clsx(
    'inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue focus-visible:ring-offset-2',
    fullWidth ? 'w-full' : 'w-auto',
    sizeClass,
    variantClass,
    isDisabled &&
      'opacity-50 cursor-not-allowed pointer-events-none shadow-none',
    className,
  )

  const content = (
    <>
      {loading && (
        <Loader2 className={clsx('animate-spin shrink-0', iconSizeClass)} />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx('shrink-0', iconSizeClass)} />
      )}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx('shrink-0', iconSizeClass)} />
      )}
    </>
  )

  if (as === Link || as === 'Link' || (to && as !== 'a')) {
    return (
      <Link
        ref={ref}
        to={to || '#'}
        className={baseClasses}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        {...props}
      >
        {content}
      </Link>
    )
  }

  if (as === 'a' || href) {
    return (
      <a
        ref={ref}
        href={href || '#'}
        className={baseClasses}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={baseClasses}
      {...props}
    >
      {content}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
