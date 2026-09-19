import React, { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'

export const Checkbox = forwardRef(function Checkbox(
  {
    label,
    description,
    error,
    disabled = false,
    checked,
    defaultChecked,
    onChange,
    className,
    containerClassName,
    id: explicitId,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const checkboxId = explicitId || generatedId

  return (
    <div className={clsx('flex flex-col space-y-1', containerClassName)}>
      <label
        htmlFor={checkboxId}
        className={clsx(
          'inline-flex items-start gap-3 select-none',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        <div className="pointer-events-none relative mt-0.5 flex shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            className="peer sr-only pointer-events-auto absolute inset-0 h-full w-full cursor-pointer opacity-0"
            {...props}
          />
          <div
            className={clsx(
              'pointer-events-none flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-c-blue peer-focus-visible:ring-offset-2',
              error ? 'border-c-danger' : 'border-c-border',
              'bg-c-surface peer-checked:border-c-blue peer-checked:bg-c-action text-transparent peer-checked:text-white',
              'hover:border-c-blue/70',
              className,
            )}
          >
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
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
          </div>
        )}
      </label>

      {error && (
        <p className="text-xs text-c-danger font-medium pl-8">{error}</p>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'
export default Checkbox
