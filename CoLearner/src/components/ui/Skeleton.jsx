import React, { forwardRef } from 'react'
import clsx from 'clsx'

export const Skeleton = forwardRef(function Skeleton(
  {
    variant = 'rect', // 'text' | 'circle' | 'rect'
    width,
    height,
    className,
    ...props
  },
  ref,
) {
  const variantStyles = {
    text: 'h-4 rounded w-full',
    circle: 'rounded-full shrink-0',
    rect: 'rounded-brand',
  }

  return (
    <div
      ref={ref}
      className={clsx(
        'animate-pulse bg-slate-200/75',
        variantStyles[variant] || variantStyles.rect,
        className,
      )}
      style={{
        width: width,
        height: height,
      }}
      aria-hidden="true"
      {...props}
    />
  )
})

Skeleton.displayName = 'Skeleton'
export default Skeleton
