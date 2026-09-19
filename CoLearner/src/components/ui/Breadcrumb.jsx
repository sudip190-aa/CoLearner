import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

export const Breadcrumb = forwardRef(function Breadcrumb(
  {
    items = [], // [{ label: 'Library', href: '/library' }, { label: 'Distributed Systems' }]
    separator: CustomSeparator,
    className,
    ...props
  },
  ref,
) {
  if (!items || items.length === 0) return null

  return (
    <nav
      ref={ref}
      aria-label="Breadcrumbs"
      className={clsx(
        'flex items-center text-xs text-c-text-muted font-sans',
        className,
      )}
      {...props}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.label || index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="hover:text-c-blue transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-blue focus-visible:rounded"
                >
                  {item.icon && (
                    <item.icon className="w-3.5 h-3.5 inline mr-1" />
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={clsx(
                    'font-medium',
                    isLast ? 'text-c-text font-semibold' : 'text-c-text-muted',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <item.icon className="w-3.5 h-3.5 inline mr-1" />
                  )}
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span
                  className="text-c-text-muted/60 select-none"
                  aria-hidden="true"
                >
                  {CustomSeparator ? (
                    <CustomSeparator className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
})

Breadcrumb.displayName = 'Breadcrumb'
export default Breadcrumb
