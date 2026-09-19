import React, { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog.js'

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  showClose = true,
  className,
}) {
  const drawerRef = useRef(null)

  const titleId = useId()
  useDialog(isOpen, drawerRef, onClose)

  if (!isOpen) return null

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex justify-end items-end sm:items-stretch pointer-events-none">
        {/* Panel — slides from bottom on mobile, from right on tablet/desktop */}
        <div
          ref={drawerRef}
          tabIndex={-1}
          className={clsx(
            'pointer-events-auto w-full sm:max-w-md bg-white border-c-border shadow-md z-10 flex flex-col',
            'max-h-[85vh] sm:max-h-full rounded-t-brand-lg sm:rounded-t-none sm:border-l',
            'animate-in slide-in-from-bottom sm:slide-in-from-right duration-250 ease-out focus:outline-none',
            className,
          )}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-c-border">
              <div>
                {title && (
                  <h3
                    id={titleId}
                    className="text-lg font-bold text-c-text tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-c-text-muted mt-1">
                    {description}
                  </p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 -mr-2 -mt-2 rounded-brand text-c-text-muted hover:text-c-text hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-c-border bg-c-blue-wash/30 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(drawerContent, document.body)
}

export default Drawer
