import React, { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog.js'

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showClose = true,
  className,
}) {
  const modalRef = useRef(null)

  const uid = useId()
  const titleId = title ? `${uid}-title` : undefined
  const descId = description ? `${uid}-desc` : undefined
  useDialog(isOpen, modalRef, onClose)

  if (!isOpen) return null

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full bg-white rounded-brand-lg border border-c-border shadow-md z-10 overflow-hidden',
          'animate-in zoom-in-95 duration-200 ease-out focus:outline-none',
          sizeClass,
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
                <p id={descId} className="text-xs text-c-text-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -mr-2 -mt-2 rounded-brand text-c-text-muted hover:text-c-text hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-c-border bg-c-blue-wash/30 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default Modal
