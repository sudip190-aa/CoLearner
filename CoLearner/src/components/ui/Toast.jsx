import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: 'bg-white border-emerald-200 text-c-text',
  error: 'bg-white border-rose-200 text-c-text',
  warning: 'bg-white border-amber-200 text-c-text',
  info: 'bg-white border-c-blue/30 text-c-text',
}

const ICON_STYLES = {
  success: 'text-c-success',
  error: 'text-c-danger',
  warning: 'text-c-warning',
  info: 'text-c-blue',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, message, type }])

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
    },
    [],
  )

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    show: (props) => addToast(props),
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context.toast
}

export function ToastContainer({ toasts, onDismiss }) {
  if (typeof document === 'undefined' || toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.type] || Info
        return (
          <div
            key={item.id}
            role="status"
            className={clsx(
              'pointer-events-auto p-4 rounded-brand border shadow-md flex items-start gap-3 transition-all',
              'animate-in slide-in-from-bottom-5 duration-200 ease-out',
              STYLES[item.type] || STYLES.info,
            )}
          >
            <Icon
              className={clsx(
                'w-5 h-5 shrink-0 mt-0.5',
                ICON_STYLES[item.type],
              )}
            />
            <div className="flex-1">
              {item.title && (
                <h4 className="text-xs font-bold text-c-text">{item.title}</h4>
              )}
              <p className="text-xs text-c-text-muted mt-0.5 leading-snug">
                {item.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="p-1 rounded text-c-text-muted hover:text-c-text hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-blue"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

export default ToastProvider
