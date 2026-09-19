import React, { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { useRadioGroup } from './RadioGroup'

export const Radio = forwardRef(function Radio(
  {
    label,
    description,
    value,
    name: explicitName,
    checked: explicitChecked,
    defaultChecked,
    onChange: explicitOnChange,
    disabled = false,
    className,
    containerClassName,
    id: explicitId,
    ...props
  },
  ref,
) {
  const group = useRadioGroup()
  const generatedId = useId()
  const radioId = explicitId || generatedId

  const isControlledByGroup = group && group.value !== undefined
  const isChecked = isControlledByGroup
    ? group.value === value
    : explicitChecked

  const groupName = group ? group.name : explicitName
  const isError = group ? group.error : false

  const handleChange = (e) => {
    if (explicitOnChange) explicitOnChange(e)
    if (group && group.onChange) group.onChange(e)
  }

  return (
    <label
      htmlFor={radioId}
      className={clsx(
        'inline-flex items-start gap-3 select-none',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        containerClassName,
      )}
    >
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          name={groupName}
          value={value}
          disabled={disabled}
          checked={isChecked}
          defaultChecked={defaultChecked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={clsx(
            'w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-c-blue peer-focus-visible:ring-offset-2',
            isError ? 'border-c-danger' : 'border-c-border',
            'bg-white peer-checked:border-c-blue hover:border-c-blue/70',
            className,
          )}
        >
          <div
            className={clsx(
              'w-2.5 h-2.5 rounded-full bg-c-blue transform scale-0 peer-checked:scale-100 transition-transform duration-150',
              disabled && 'bg-c-text-muted',
            )}
          />
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
  )
})

Radio.displayName = 'Radio'
export default Radio
