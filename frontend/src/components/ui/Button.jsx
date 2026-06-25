/**
 * Button — Premium SaaS button component.
 *
 * Variants: primary | secondary | ghost | danger | outline
 * Sizes: sm | md | lg
 * States: loading, disabled, icon-only
 *
 * Usage:
 *   <Button variant="primary" size="md" onClick={...}>Analyze</Button>
 *   <Button variant="primary" loading>Analyzing...</Button>
 *   <Button variant="ghost" leftIcon={<IconName />}>Label</Button>
 */

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/* ── Variant styles ─────────────────────────────────────────────── */
const VARIANTS = {
  primary: [
    'bg-primary-600 hover:bg-primary-500',
    'text-white',
    'border border-primary-500/50 hover:border-primary-400/60',
    'shadow-glow-blue hover:shadow-glow-blue-lg',
  ].join(' '),

  secondary: [
    'bg-surface-800 hover:bg-surface-700',
    'text-surface-100 hover:text-white',
    'border border-surface-700 hover:border-surface-600',
  ].join(' '),

  ghost: [
    'bg-transparent hover:bg-white/[0.06]',
    'text-surface-300 hover:text-white',
    'border border-transparent hover:border-white/[0.08]',
  ].join(' '),

  outline: [
    'bg-transparent hover:bg-primary-500/10',
    'text-primary-400 hover:text-primary-300',
    'border border-primary-500/40 hover:border-primary-400/60',
  ].join(' '),

  danger: [
    'bg-error hover:bg-red-500',
    'text-white',
    'border border-red-500/50 hover:border-red-400/60',
    'hover:shadow-glow-red',
  ].join(' '),
}

/* ── Size styles ────────────────────────────────────────────────── */
const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-8 px-3.5 text-sm gap-2 rounded-xl',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-2xl',
  xl: 'h-14 px-8 text-lg gap-3 rounded-2xl',
}

/* ── Component ──────────────────────────────────────────────────── */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      whileHover={isDisabled ? {} : { scale: 1.01 }}
      className={[
        /* Base */
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 outline-none',
        'select-none cursor-pointer',
        /* Variant + size */
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        /* Full width */
        fullWidth ? 'w-full' : '',
        /* Disabled */
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}

      {/* Label */}
      {children && <span>{children}</span>}

      {/* Right icon */}
      {!loading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  )
}

/**
 * IconButton — square button for icon-only actions.
 *
 * Usage: <IconButton variant="ghost"><X size={16} /></IconButton>
 */
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) {
  const ICON_SIZES = { xs: 'w-7 h-7', sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-10 h-10' }

  return (
    <Button
      variant={variant}
      className={`${ICON_SIZES[size] || ICON_SIZES.md} !px-0 rounded-xl ${className}`}
      {...props}
    >
      {children}
    </Button>
  )
}
