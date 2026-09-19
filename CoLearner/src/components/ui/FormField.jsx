import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { AlertCircle } from 'lucide-react'

export const FormField = forwardRef(function FormField(
  {
    label,
    htmlFor,
    required = false,
    optional = false,
    hint,
    error,
    rightBadge,
    counter,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx('w-full flex flex-col space-y-1.5', className)}
      {...props}
    >
      {(label || rightBadge) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={htmlFor}
              className="block text-sm font-semibold text-c-text select-none cursor-pointer"
            >
              {label}
              {required && (
                <span className="text-c-danger ml-1" aria-hidden="true">
                  *
                </span>
              )}
              {optional && (
                <span className="text-xs font-normal text-c-text-muted ml-1.5">
                  (Optional)
                </span>
              )}
            </label>
          )}
          {rightBadge && <div>{rightBadge}</div>}
        </div>
      )}

      {children}

      <div className="flex items-start justify-between min-h-[20px] text-xs">
        {error ? (
          <p className="flex items-center gap-1.5 text-c-danger font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p className="text-c-text-muted">{hint}</p>
        ) : (
          <span />
        )}

        {counter && (
          <span className="text-c-text-muted tabular-nums ml-auto pl-2">
            {counter}
          </span>
        )}
      </div>
    </div>
  )
})

FormField.displayName = 'FormField'
export default FormField
