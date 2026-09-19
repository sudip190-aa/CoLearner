import React, { createContext, useContext, useState, forwardRef } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

const AccordionContext = createContext(null)

export const Accordion = forwardRef(function Accordion(
  {
    type = 'single', // 'single' | 'multiple'
    value,
    defaultValue,
    onChange,
    children,
    className,
    ...props
  },
  ref,
) {
  const [internalValue, setInternalValue] = useState(() => {
    if (defaultValue !== undefined) return defaultValue
    return type === 'multiple' ? [] : null
  })

  const activeValue = value !== undefined ? value : internalValue

  const toggleItem = (itemValue) => {
    let nextValue
    if (type === 'multiple') {
      const arr = Array.isArray(activeValue) ? activeValue : []
      nextValue = arr.includes(itemValue)
        ? arr.filter((v) => v !== itemValue)
        : [...arr, itemValue]
    } else {
      nextValue = activeValue === itemValue ? null : itemValue
    }

    if (value === undefined) setInternalValue(nextValue)
    onChange?.(nextValue)
  }

  const isExpanded = (itemValue) => {
    if (type === 'multiple') {
      return Array.isArray(activeValue) && activeValue.includes(itemValue)
    }
    return activeValue === itemValue
  }

  return (
    <AccordionContext.Provider value={{ toggleItem, isExpanded }}>
      <div
        ref={ref}
        className={clsx(
          'divide-y divide-c-border border-y border-c-border',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
})

export const AccordionItem = forwardRef(function AccordionItem(
  { value, title, children, disabled = false, className, ...props },
  ref,
) {
  const context = useContext(AccordionContext)
  const expanded = context ? context.isExpanded(value) : false

  return (
    <div ref={ref} className={clsx('py-2', className)} {...props}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={expanded}
        onClick={() => context?.toggleItem(value)}
        className={clsx(
          'w-full py-3 flex items-center justify-between text-left font-semibold text-c-text transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue focus-visible:rounded',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        <span className="text-sm md:text-base">{title}</span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-c-text-muted transition-transform duration-200 shrink-0 ml-4',
            expanded && 'transform rotate-180 text-c-blue',
          )}
        />
      </button>

      {expanded && (
        <div className="pb-4 pt-1 text-sm text-c-text-muted leading-relaxed animate-in fade-in-50 duration-150">
          {children}
        </div>
      )}
    </div>
  )
})

Accordion.displayName = 'Accordion'
AccordionItem.displayName = 'AccordionItem'
export default Accordion
