import React, { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { FormField } from './FormField'

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    required = false,
    optional = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    disabled = false,
    className,
    containerClassName,
    id: explicitId,
    type = 'text',
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = explicitId || generatedId

  const inputElement = (
    <div className="relative flex items-center w-full">
      {LeftIcon && (
        <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-c-text-muted">
          <LeftIcon className="w-4 h-4" />
        </div>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={clsx(
          'w-full h-10 px-3.5 text-sm bg-white text-c-text rounded-brand border transition-colors',
          'placeholder:text-c-text-muted/60 font-sans',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          LeftIcon ? 'pl-10' : 'pl-3.5',
          RightIcon ? 'pr-10' : 'pr-3.5',
          error
            ? 'border-c-danger focus:border-c-danger focus:ring-c-danger/20 text-c-text'
            : 'border-c-border focus:border-c-blue focus:ring-c-blue',
          disabled &&
            'bg-slate-100 text-c-text-muted/70 cursor-not-allowed border-c-border opacity-75',
          className,
        )}
        {...props}
      />

      {RightIcon && (
        <button
          type="button"
          tabIndex={onRightIconClick ? 0 : -1}
          onClick={onRightIconClick}
          aria-label={
            onRightIconClick ? 'Toggle password visibility' : undefined
          }
          className={clsx(
            'absolute right-3.5 flex items-center justify-center text-c-text-muted',
            onRightIconClick
              ? 'pointer-events-auto hover:text-c-text'
              : 'pointer-events-none',
          )}
        >
          <RightIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  )

  if (label || hint || error) {
    return (
      <FormField
        label={label}
        htmlFor={inputId}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
        className={containerClassName}
      >
        {inputElement}
      </FormField>
    )
  }

  return inputElement
})

Input.displayName = 'Input'
export default Input
