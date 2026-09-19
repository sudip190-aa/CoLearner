import React, { forwardRef, useState } from 'react'
import clsx from 'clsx'
import { initials as getInitials } from '../../lib/formatters'

const SIZE_MAP = {
  xs: { box: 'w-5 h-5 text-[10px]', status: 'w-1.5 h-1.5' },
  sm: { box: 'w-6 h-6 text-xs', status: 'w-2 h-2' },
  md: { box: 'w-8 h-8 text-xs', status: 'w-2.5 h-2.5' },
  lg: { box: 'w-12 h-12 text-base', status: 'w-3.5 h-3.5' },
  xl: { box: 'w-16 h-16 text-xl', status: 'w-4 h-4' },
}

export const Avatar = forwardRef(function Avatar(
  {
    src,
    alt = '',
    name,
    size = 'md',
    online,
    className,
    fallbackClassName,
    ...props
  },
  ref,
) {
  const [imageFailed, setImageFailed] = useState(!src)
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md
  const computedInitials = name
    ? getInitials(name)
    : alt
      ? getInitials(alt)
      : '?'

  return (
    <div
      ref={ref}
      className={clsx(
        'relative inline-flex items-center justify-center shrink-0 rounded-full select-none font-semibold font-sans',
        sizeConfig.box,
        className,
      )}
      {...props}
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div
          className={clsx(
            'w-full h-full flex items-center justify-center rounded-full bg-c-blue-soft text-c-blue border border-c-blue/20 font-bold',
            fallbackClassName,
          )}
        >
          {computedInitials}
        </div>
      )}

      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            sizeConfig.status,
            online ? 'bg-c-success' : 'bg-c-text-muted',
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
})

export const AvatarGroup = forwardRef(function AvatarGroup(
  { children, max = 4, size = 'md', className, ...props },
  ref,
) {
  const childrenArray = React.Children.toArray(children)
  const visibleAvatars = childrenArray.slice(0, max)
  const remainingCount = childrenArray.length - max
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md

  return (
    <div
      ref={ref}
      className={clsx(
        'flex items-center -space-x-2 overflow-hidden py-1',
        className,
      )}
      {...props}
    >
      {visibleAvatars.map((child, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          {React.isValidElement(child)
            ? React.cloneElement(child, { size })
            : child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'ring-2 ring-white rounded-full flex items-center justify-center bg-slate-100 text-c-text font-semibold select-none shrink-0',
            sizeConfig.box,
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'
AvatarGroup.displayName = 'AvatarGroup'
export default Avatar
