import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { Logo } from './Logo'
import { Button } from './Button'

export const EmptyState = forwardRef(function EmptyState(
  {
    title = 'No items found',
    description = 'There are no records to display at this time.',
    actionLabel,
    onAction,
    actionTo,
    secondaryActionLabel,
    onSecondaryAction,
    secondaryActionTo,
    icon: CustomIcon,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'w-full py-16 px-6 rounded-brand-lg border border-dashed border-c-border bg-c-blue-wash/30 flex flex-col items-center justify-center text-center',
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex items-center justify-center">
        {CustomIcon ? (
          <div className="w-12 h-12 rounded-full bg-c-blue-soft text-c-blue flex items-center justify-center">
            <CustomIcon className="w-6 h-6" />
          </div>
        ) : (
          <div className="opacity-40 select-none grayscale-[20%] transition-opacity hover:opacity-60">
            <Logo variant="mark" size="lg" />
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-c-text tracking-tight">{title}</h3>
      <p className="text-sm text-c-text-muted mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              as={actionTo ? 'Link' : 'button'}
              to={actionTo}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSecondaryAction}
              as={secondaryActionTo ? 'Link' : 'button'}
              to={secondaryActionTo}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

EmptyState.displayName = 'EmptyState'
export default EmptyState
