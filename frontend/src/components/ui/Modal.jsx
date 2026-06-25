/**
 * Modal — Accessible dialog overlay with animated entrance.
 *
 * Sizes: sm | md | lg | xl | full
 * Features: backdrop blur, click-outside close, keyboard Escape, scroll lock
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm Action">
 *     <Modal.Body>Are you sure?</Modal.Body>
 *     <Modal.Footer>
 *       <Button variant="ghost" onClick={...}>Cancel</Button>
 *       <Button variant="danger" onClick={...}>Delete</Button>
 *     </Modal.Footer>
 *   </Modal>
 */

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { IconButton } from './Button'

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw]',
}

/* ── Backdrop ────────────────────────────────────────────────────── */
const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
}

/* ── Dialog ──────────────────────────────────────────────────────── */
const dialogVariants = {
  hidden:  { opacity: 0, scale: 0.93, y: 16 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', damping: 26, stiffness: 380 } },
  exit:    { opacity: 0, scale: 0.95, y: 8,  transition: { duration: 0.18 } },
}

/* ── Root Modal ──────────────────────────────────────────────────── */
function Modal({ isOpen, onClose, title, size = 'md', closable = true, children }) {
  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* Close on Escape key */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closable) onClose?.()
  }, [onClose, closable])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── Portal overlay ── */
        <motion.div
          className="fixed inset-0 z-80 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closable ? onClose : undefined}
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={[
              'relative w-full',
              SIZES[size] || SIZES.md,
              'bg-surface-900 border border-surface-700/80',
              'rounded-2xl shadow-modal',
              'flex flex-col max-h-[90vh]',
            ].join(' ')}
          >
            {/* Header */}
            {(title || closable) && (
              <div className="flex items-center justify-between px-6 py-5 border-b border-surface-800 shrink-0">
                {title && (
                  <h2 className="text-base font-semibold text-white">{title}</h2>
                )}
                {closable && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-auto -mr-1"
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Modal.Body ──────────────────────────────────────────────────── */
function ModalBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 text-sm text-surface-300 leading-relaxed ${className}`}>
      {children}
    </div>
  )
}

/* ── Modal.Footer ────────────────────────────────────────────────── */
function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-800 shrink-0 ${className}`}>
      {children}
    </div>
  )
}

Modal.Body   = ModalBody
Modal.Footer = ModalFooter

export default Modal
