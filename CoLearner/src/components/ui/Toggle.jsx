import React, { forwardRef, useId } from 'react'
import clsx from 'clsx'

export const Toggle = forwardRef(function Toggle(
  {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    className,
    containerClassName,
    id: explicitId,
    size = 'md',
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const toggleId = explicitId || generatedId

  const isSmall = size === 'sm'

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-4',
        containerClassName,
      )}
    >
      {(label || description) && (
        <label
          htmlFor={toggleId}
          className={clsx(
            'flex flex-col select-none',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          )}
        >
          {label && (
            <span className="text-sm font-medium text-c-text leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-c-text-muted mt-0.5 leading-normal">
              {description}
            </span>
          )}
        </label>
      )}

      <div className="relative inline-flex items-center shrink-0">
        <input
          ref={ref}
          id={toggleId}
          type="checkbox"
          role="switch"
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={toggleId}
          className={clsx(
            'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-c-blue peer-focus-visible:ring-offset-2',
            isSmall ? 'w-9 h-5' : 'w-11 h-6',
            'bg-slate-200 peer-checked:bg-c-blue',
            disabled && 'cursor-not-allowed opacity-60',
            className,
          )}
        >
          <span
            className={clsx(
              'pointer-events-none inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out',
              isSmall ? 'w-4 h-4' : 'w-5 h-5',
              isSmall
                ? 'translate-x-0.5 peer-checked:translate-x-4.5'
                : 'translate-x-0.5 peer-checked:translate-x-5.5',
            )}
          />
        </label>
      </div>
    </div>
  )
})

Toggle.displayName = 'Toggle'
export default Toggle
