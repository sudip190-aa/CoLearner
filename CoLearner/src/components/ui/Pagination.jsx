import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Pagination = forwardRef(function Pagination(
  {
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    siblingCount = 1,
    className,
    ...props
  },
  ref,
) {
  if (totalPages <= 1) return null

  const range = (start, end) => {
    const length = end - start + 1
    return Array.from({ length }, (_, idx) => idx + start)
  }

  const generatePagination = () => {
    const totalNumbers = siblingCount + 5

    if (totalNumbers >= totalPages) {
      return range(1, totalPages)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2

    const firstPageIndex = 1
    const lastPageIndex = totalPages

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = range(1, leftItemCount)
      return [...leftRange, '...', totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = range(totalPages - rightItemCount + 1, totalPages)
      return [firstPageIndex, '...', ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex)
      return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex]
    }

    return range(1, totalPages)
  }

  const pages = generatePagination()

  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label="Pagination Navigation"
      className={clsx(
        'flex items-center justify-center gap-1.5 select-none font-sans',
        className,
      )}
      {...props}
    >
      {/* Previous Button */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        className={clsx(
          'p-2 rounded-brand border border-c-border text-c-text text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue',
          currentPage <= 1
            ? 'opacity-40 cursor-not-allowed bg-c-blue-wash'
            : 'hover:bg-c-blue-soft hover:text-c-blue bg-c-surface',
        )}
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages List */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`dots-${index}`}
              className="px-2 text-c-text-muted text-sm select-none"
            >
              …
            </span>
          )
        }

        const isCurrent = page === currentPage

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange?.(page)}
            aria-current={isCurrent ? 'page' : undefined}
            className={clsx(
              'min-w-[36px] h-9 px-2.5 text-xs font-semibold rounded-brand border transition-colors flex items-center justify-center',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue',
              isCurrent
                ? 'bg-c-action text-white border-c-blue shadow-sm'
                : 'bg-c-surface text-c-text border-c-border hover:bg-c-blue-wash hover:text-c-blue',
            )}
          >
            {page}
          </button>
        )
      })}

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        className={clsx(
          'p-2 rounded-brand border border-c-border text-c-text text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue',
          currentPage >= totalPages
            ? 'opacity-40 cursor-not-allowed bg-c-blue-wash'
            : 'hover:bg-c-blue-soft hover:text-c-blue bg-c-surface',
        )}
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
})

Pagination.displayName = 'Pagination'
export default Pagination
