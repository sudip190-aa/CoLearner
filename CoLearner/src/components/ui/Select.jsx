import React, { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { FormField } from './FormField'

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    required = false,
    optional = false,
    options,
    children,
    placeholder,
    disabled = false,
    className,
    containerClassName,
    id: explicitId,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const selectId = explicitId || generatedId

  const selectElement = (
    <div className="relative flex items-center w-full">
      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
        }
        className={clsx(
          'w-full h-10 pl-3.5 pr-10 text-sm bg-white text-c-text rounded-brand border appearance-none transition-colors font-sans cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          error
            ? 'border-c-danger focus:border-c-danger focus:ring-c-danger/20 text-c-text'
            : 'border-c-border focus:border-c-blue focus:ring-c-blue',
          disabled &&
            'bg-slate-100 text-c-text-muted/70 cursor-not-allowed border-c-border opacity-75',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => (
              <option
                key={typeof opt === 'object' ? opt.value : opt}
                value={typeof opt === 'object' ? opt.value : opt}
                disabled={typeof opt === 'object' ? opt.disabled : false}
              >
                {typeof opt === 'object' ? opt.label : opt}
              </option>
            ))
          : children}
      </select>

      <div className="absolute right-3.5 flex items-center justify-center pointer-events-none text-c-text-muted">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  )

  if (label || hint || error) {
    return (
      <FormField
        label={label}
        htmlFor={selectId}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
        className={containerClassName}
      >
        {selectElement}
      </FormField>
    )
  }

  return selectElement
})

Select.displayName = 'Select'
export default Select
