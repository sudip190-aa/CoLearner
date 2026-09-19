import React, { useState, useRef, useEffect, forwardRef } from 'react'
import clsx from 'clsx'

export const Dropdown = forwardRef(function Dropdown(
  {
    trigger,
    children,
    align = 'left', // 'left' | 'right'
    className,
    ...props
  },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const menuRef = useRef(null)

  const items = () =>
    Array.from(
      menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)') ||
        [],
    )
  const focusTrigger = () =>
    containerRef.current?.querySelector('button, a, [tabindex]')?.focus()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        focusTrigger()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Arrow keys move through the items; ArrowDown on the closed trigger opens the menu on the first one.
  const handleMenuKey = (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return
    if (!isOpen) {
      if (
        event.key === 'ArrowDown' &&
        containerRef.current?.contains(event.target)
      ) {
        event.preventDefault()
        setIsOpen(true)
        requestAnimationFrame(() => items()[0]?.focus())
      }
      return
    }
    const list = items()
    if (!list.length) return
    event.preventDefault()
    const at = list.indexOf(document.activeElement)
    let next = 0
    if (event.key === 'ArrowDown') next = at + 1 >= list.length ? 0 : at + 1
    if (event.key === 'ArrowUp') next = at <= 0 ? list.length - 1 : at - 1
    if (event.key === 'End') next = list.length - 1
    list[next].focus()
  }

  return (
    <div
      onKeyDown={handleMenuKey}
      ref={(node) => {
        containerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className="relative inline-block text-left"
      {...props}
    >
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-1.5 w-56 rounded-brand border border-c-border bg-c-surface shadow-md py-1 font-sans focus:outline-none',
            'animate-in fade-in zoom-in-95 duration-150',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
          role="menu"
          ref={menuRef}
          tabIndex={-1}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
})

export const DropdownItem = forwardRef(function DropdownItem(
  {
    children,
    icon: Icon,
    danger = false,
    disabled = false,
    onClick,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'w-full px-3.5 py-2 text-xs md:text-sm font-medium flex items-center gap-2.5 text-left transition-colors',
        danger
          ? 'text-c-danger hover:bg-c-danger-soft'
          : 'text-c-text hover:bg-c-blue-soft hover:text-c-blue',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  )
})

export const DropdownDivider = () => (
  <div className="my-1 border-t border-c-border" />
)

Dropdown.displayName = 'Dropdown'
DropdownItem.displayName = 'DropdownItem'
export default Dropdown
