import React from 'react'
import { Breadcrumb } from '../ui/Breadcrumb'

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  children,
}) {
  return (
    <header className="mb-8 border-b border-c-border pb-6">
      {breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} className="mb-3" />
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1>{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-base leading-6 text-c-text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {(actions || children) && (
          <div className="shrink-0">{actions || children}</div>
        )}
      </div>
    </header>
  )
}

export default PageHeader
