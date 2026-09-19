import React, { createContext, useContext, forwardRef, useRef } from 'react'
import clsx from 'clsx'

const TabsContext = createContext(null)

export const Tabs = forwardRef(function Tabs(
  { value, defaultValue, onChange, children, className, ...props },
  ref,
) {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue)

  const currentTab = value !== undefined ? value : activeTab

  const handleTabChange = (val) => {
    if (value === undefined) setActiveTab(val)
    onChange?.(val)
  }

  return (
    <TabsContext.Provider value={{ currentTab, setTab: handleTabChange }}>
      <div
        ref={ref}
        className={clsx('w-full flex flex-col', className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
})

export const TabsList = forwardRef(function TabsList(
  { children, className, ...props },
  ref,
) {
  const listRef = useRef(null)

  const handleKeyDown = (e) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll('[role="tab"]:not([disabled])') || [],
    )
    const currentIndex = tabs.indexOf(document.activeElement)

    if (currentIndex === -1) return

    let nextIndex
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1
    } else {
      return
    }

    e.preventDefault()
    tabs[nextIndex]?.focus()
    tabs[nextIndex]?.click()
  }

  return (
    <div
      ref={(node) => {
        listRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={clsx(
        'flex items-center gap-6 border-b border-c-border overflow-x-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

export const TabTrigger = forwardRef(function TabTrigger(
  { value, children, disabled = false, badge, icon: Icon, className, ...props },
  ref,
) {
  const context = useContext(TabsContext)
  const isActive = context?.currentTab === value

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      disabled={disabled}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => context?.setTab(value)}
      className={clsx(
        'relative inline-flex items-center gap-2 pb-3 pt-2 text-sm font-medium transition-colors border-b-2 font-sans select-none whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue focus-visible:rounded-t',
        isActive
          ? 'border-c-blue text-c-blue font-semibold'
          : 'border-transparent text-c-text-muted hover:text-c-text hover:border-c-border',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={clsx(
            'px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
            isActive
              ? 'bg-c-action text-white'
              : 'bg-c-blue-soft text-c-text-muted',
          )}
        >
          {badge}
        </span>
      )}
    </button>
  )
})

export const TabContent = forwardRef(function TabContent(
  { value, children, className, ...props },
  ref,
) {
  const context = useContext(TabsContext)
  if (context?.currentTab !== value) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      tabIndex={0}
      className={clsx(
        'pt-4 focus-visible:outline-none animate-in fade-in-50 duration-150',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Tabs.displayName = 'Tabs'
TabsList.displayName = 'TabsList'
TabTrigger.displayName = 'TabTrigger'
TabContent.displayName = 'TabContent'
export default Tabs
