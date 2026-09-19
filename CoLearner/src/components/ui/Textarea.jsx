import React, { forwardRef, useId, useState } from 'react'
import clsx from 'clsx'
import { FormField } from './FormField'

export const Textarea = forwardRef(function Textarea(
  {
    label,
    hint,
    error,
    required = false,
    optional = false,
    showCount = false,
    maxLength,
    disabled = false,
    rows = 4,
    className,
    containerClassName,
    id: explicitId,
    value,
    defaultValue,
    onChange,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const textareaId = explicitId || generatedId

  const [currentLength, setCurrentLength] = useState(() =>
    value !== undefined
      ? String(value).length
      : defaultValue !== undefined
        ? String(defaultValue).length
        : 0,
  )

  const handleChange = (e) => {
    setCurrentLength(e.target.value.length)
    if (onChange) {
      onChange(e)
    }
  }

  const counterText =
    showCount || maxLength ? (
      <span>
        {value !== undefined ? String(value).length : currentLength}
        {maxLength ? ` / ${maxLength}` : ''}
      </span>
    ) : null

  const textareaElement = (
    <textarea
      ref={ref}
      id={textareaId}
      rows={rows}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      aria-invalid={Boolean(error)}
      aria-describedby={
        error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
      }
      className={clsx(
        'w-full p-3.5 text-sm bg-white text-c-text rounded-brand border transition-colors font-sans resize-y',
        'placeholder:text-c-text-muted/60',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        error
          ? 'border-c-danger focus:border-c-danger focus:ring-c-danger/20 text-c-text'
          : 'border-c-border focus:border-c-blue focus:ring-c-blue',
        disabled &&
          'bg-slate-100 text-c-text-muted/70 cursor-not-allowed border-c-border opacity-75',
        className,
      )}
      {...props}
    />
  )

  if (label || hint || error || counterText) {
    return (
      <FormField
        label={label}
        htmlFor={textareaId}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
        counter={counterText}
        className={containerClassName}
      >
        {textareaElement}
      </FormField>
    )
  }

  return textareaElement
})

Textarea.displayName = 'Textarea'
export default Textarea
