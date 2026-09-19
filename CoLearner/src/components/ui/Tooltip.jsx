import React, { useState, forwardRef } from 'react'
import clsx from 'clsx'

const PLACEMENT_STYLES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const ARROW_STYLES = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-c-text border-x-transparent border-b-transparent border-t-4 border-x-4',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-c-text border-x-transparent border-t-transparent border-b-4 border-x-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-c-text border-y-transparent border-r-transparent border-l-4 border-y-4',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-c-text border-y-transparent border-l-transparent border-r-4 border-y-4',
}

export const Tooltip = forwardRef(function Tooltip(
  { content, placement = 'top', delay = 100, children, className, ...props },
  ref,
) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null)

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setIsVisible(false)
  }

  if (!content) return children

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={clsx(
            'absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-c-text rounded-md shadow-md whitespace-nowrap pointer-events-none select-none',
            'animate-in fade-in zoom-in-95 duration-150',
            PLACEMENT_STYLES[placement] || PLACEMENT_STYLES.top,
            className,
          )}
        >
          {content}
          <div
            className={clsx(
              'absolute w-0 h-0',
              ARROW_STYLES[placement] || ARROW_STYLES.top,
            )}
          />
        </div>
      )}
    </div>
  )
})

Tooltip.displayName = 'Tooltip'
export default Tooltip
