import React, { useState, useEffect, useRef, forwardRef } from 'react'
import clsx from 'clsx'
import { Search, X } from 'lucide-react'

// Search boxes currently on screen, oldest first. The page's own box mounts after the navbar's,
// so pressing the shortcut focuses the most specific one instead of fighting over focus.
const shortcutOwners = []

export const SearchBar = forwardRef(function SearchBar(
  {
    value: controlledValue,
    defaultValue = '',
    onChange,
    onClear,
    onSearch,
    placeholder = 'Search books, projects, peers...',
    debounceMs = 400,
    shortcut = '/',
    disabled = false,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  // The text being typed always lives here, so the box works whether or not the parent passes `value`.
  // A `value` prop acts as "set/reset the text" (e.g. a parent's "Clear filters"), and `onChange`
  // receives the debounced text.
  const [internalValue, setInternalValue] = useState(
    controlledValue ?? defaultValue,
  )
  const [seenControlled, setSeenControlled] = useState(controlledValue)
  if (controlledValue !== seenControlled) {
    setSeenControlled(controlledValue)
    if (controlledValue !== undefined) setInternalValue(controlledValue)
  }
  const query = internalValue
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  // Keep the latest handler in a ref so an inline `onChange` does not restart the debounce on every render.
  const onChangeRef = useRef(onChange)
  const lastEmittedRef = useRef(controlledValue ?? defaultValue)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (query === lastEmittedRef.current) return undefined
    const timer = window.setTimeout(() => {
      lastEmittedRef.current = query
      onChangeRef.current?.(query)
    }, debounceMs)

    debounceRef.current = timer
    return () => window.clearTimeout(timer)
  }, [query, debounceMs])

  useEffect(() => {
    if (!shortcut) return undefined
    const owner = {}
    shortcutOwners.push(owner)
    const onKey = (event) => {
      if (
        event.key !== shortcut ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return
      if (shortcutOwners[shortcutOwners.length - 1] !== owner) return
      const target = event.target
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
      )
        return
      if (document.querySelector('[role="dialog"]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      shortcutOwners.splice(shortcutOwners.indexOf(owner), 1)
    }
  }, [shortcut])

  const handleClear = () => {
    setInternalValue('')
    lastEmittedRef.current = ''
    window.clearTimeout(debounceRef.current)
    onClear?.()
    onChangeRef.current?.('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      window.clearTimeout(debounceRef.current)
      lastEmittedRef.current = query
      // Enter means "search now": use onSearch when given, otherwise flush the pending onChange.
      ;(onSearch ?? onChangeRef.current)?.(query)
    }
  }

  return (
    <div
      className={clsx('relative flex items-center w-full', containerClassName)}
    >
      <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-c-text-muted">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type="text"
        disabled={disabled}
        value={query}
        onChange={(e) => setInternalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className={clsx(
          'w-full h-10 pl-10 pr-12 text-sm bg-c-surface text-c-text rounded-brand border border-c-border transition-colors font-sans',
          'placeholder:text-c-text-muted/60',
          'focus:outline-none focus:border-c-blue focus:ring-2 focus:ring-c-blue focus:ring-offset-2',
          disabled &&
            'bg-c-blue-soft text-c-text-muted/70 cursor-not-allowed border-c-border opacity-75',
          className,
        )}
        {...props}
      />

      <div className="absolute right-3 flex items-center gap-1.5">
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-c-text-muted hover:text-c-text hover:bg-c-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-blue"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcut && !query && (
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-c-text-muted bg-c-blue-soft border border-c-border rounded select-none">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  )
})

SearchBar.displayName = 'SearchBar'
export default SearchBar
