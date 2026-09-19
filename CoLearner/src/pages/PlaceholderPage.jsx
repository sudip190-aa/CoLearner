import React from 'react'
import { PageHeader } from '../components/layout/PageHeader'

export function PlaceholderPage({ title }) {
  return (
    <div>
      <PageHeader
        title={title}
        subtitle="This Colearn page is ready for its feature implementation."
      />
      <div className="rounded-brand-lg border border-dashed border-c-border bg-c-surface p-10 text-center text-sm text-c-text-muted">
        {title} content will appear here.
      </div>
    </div>
  )
}

export default PlaceholderPage
