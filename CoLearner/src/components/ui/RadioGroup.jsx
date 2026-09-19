import React, { createContext, useContext, forwardRef } from 'react'
import clsx from 'clsx'
import { FormField } from './FormField'

export const RadioGroupContext = createContext(null)

export const RadioGroup = forwardRef(function RadioGroup(
  {
    name,
    value,
    defaultValue,
    onChange,
    label,
    hint,
    error,
    required = false,
    optional = false,
    className,
    containerClassName,
    children,
    ...props
  },
  ref,
) {
  const contextValue = {
    name,
    value,
    defaultValue,
    onChange,
    error: Boolean(error),
  }

  const groupContent = (
    <div
      ref={ref}
      role="radiogroup"
      className={clsx('flex flex-col space-y-2.5', className)}
      {...props}
    >
      <RadioGroupContext.Provider value={contextValue}>
        {children}
      </RadioGroupContext.Provider>
    </div>
  )

  if (label || hint || error) {
    return (
      <FormField
        label={label}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
        className={containerClassName}
      >
        {groupContent}
      </FormField>
    )
  }

  return groupContent
})

export const useRadioGroup = () => useContext(RadioGroupContext)

RadioGroup.displayName = 'RadioGroup'
export default RadioGroup
