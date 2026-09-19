import React, { forwardRef } from 'react'
import clsx from 'clsx'

export const Card = forwardRef(function Card(
  { children, hoverable = false, className, header, footer, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'bg-c-surface rounded-brand-lg border border-c-border transition-all duration-150 overflow-hidden',
        hoverable && 'hover:border-c-blue hover:shadow-md cursor-pointer',
        className,
      )}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-c-border bg-c-surface">
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className="px-6 py-4 border-t border-c-border bg-c-blue-wash/30">
          {footer}
        </div>
      )}
    </div>
  )
})

export const CardHeader = forwardRef(function CardHeader(
  { className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx('px-6 pt-6 pb-4 border-b border-c-border', className)}
      {...props}
    >
      {children}
    </div>
  )
})

export const CardTitle = forwardRef(function CardTitle(
  { className, children, as: Tag = 'h3', ...props },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={clsx(
        'text-lg font-bold text-c-text tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

export const CardDescription = forwardRef(function CardDescription(
  { className, children, ...props },
  ref,
) {
  return (
    <p
      ref={ref}
      className={clsx('text-sm text-c-text-muted mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
})

export const CardContent = forwardRef(function CardContent(
  { className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={clsx('p-6', className)} {...props}>
      {children}
    </div>
  )
})

export const CardFooter = forwardRef(function CardFooter(
  { className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'px-6 py-4 border-t border-c-border bg-c-blue-wash/30 flex items-center justify-between',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardDescription.displayName = 'CardDescription'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'

export default Card
