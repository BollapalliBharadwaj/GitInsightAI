/**
 * Toast — Notification system with context provider + hook.
 *
 * Types: success | error | warning | info
 * Auto-dismiss: configurable duration (default 4s)
 * Stackable: multiple toasts stack from bottom-right
 *
 * Setup:
 *   // Wrap app with <ToastProvider>
 *   // Use hook: const { toast } = useToast()
 *   // Fire: toast.success('Analysis complete!')
 *
 * Usage:
 *   toast.success('Repository analyzed!')
 *   toast.error('Failed to fetch repo')
 *   toast.warning('Rate limit approaching')
 *   toast.info('Using cached results')
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

/* ── Icons + colors per type ─────────────────────────────────────── */
const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    border: 'border-l-4 border-l-emerald-500',
    iconClass: 'text-emerald-400',
    label: 'Success',
  },
  error: {
    icon: XCircle,
    border: 'border-l-4 border-l-red-500',
    iconClass: 'text-red-400',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-4 border-l-amber-500',
    iconClass: 'text-amber-400',
    label: 'Warning',
  },
  info: {
    icon: Info,
    border: 'border-l-4 border-l-blue-500',
    iconClass: 'text-blue-400',
    label: 'Info',
  },
}

/* ── Context ─────────────────────────────────────────────────────── */
const ToastContext = createContext(null)

/* ── Single Toast item ───────────────────────────────────────────── */
function ToastItem({ id, type = 'info', title, message, onRemove }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 28, stiffness: 380 }}
      className={[
        'relative w-80 max-w-[calc(100vw-2rem)]',
        'bg-surface-900 border border-surface-700',
        'rounded-2xl shadow-modal',
        'overflow-hidden',
        config.border,
      ].join(' ')}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary-500 to-accent-cyan"
        initial={{ scaleX: 1, originX: 0 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
      />

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`shrink-0 mt-0.5 ${config.iconClass}`}>
          <Icon size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
          )}
          {message && (
            <p className="text-xs text-surface-400 leading-relaxed">{message}</p>
          )}
          {!title && !message && (
            <p className="text-sm text-white font-medium">{config.label}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onRemove(id)}
          className="shrink-0 text-surface-500 hover:text-white transition-colors ml-1 -mt-0.5"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </motion.div>
  )
}

/* ── Provider ────────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((type, titleOrMessage, message, duration = 4000) => {
    const id = ++counterRef.current
    const hasTitle = message !== undefined

    setToasts((prev) => [...prev, {
      id,
      type,
      title:   hasTitle ? titleOrMessage : undefined,
      message: hasTitle ? message : titleOrMessage,
    }])

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }, [remove])

  /* Convenience methods */
  const toast = {
    success: (msg, detail, dur) => add('success', msg, detail, dur),
    error:   (msg, detail, dur) => add('error',   msg, detail, dur),
    warning: (msg, detail, dur) => add('warning', msg, detail, dur),
    info:    (msg, detail, dur) => add('info',    msg, detail, dur),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast portal — fixed bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem {...t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/* ── Hook ────────────────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export default ToastProvider
