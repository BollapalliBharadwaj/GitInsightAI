/**
 * Card — Versatile container with multiple surface styles.
 *
 * Variants:
 *   glass     — glassmorphism (blurred, translucent border)
 *   surface   — solid dark surface card
 *   outlined  — transparent with border only
 *   gradient  — gradient border accent
 *
 * Sub-components: Card.Header, Card.Body, Card.Footer
 *
 * Usage:
 *   <Card variant="glass" hoverable>
 *     <Card.Header title="Code Quality" icon={<Code />} badge={<Badge>95</Badge>} />
 *     <Card.Body>...</Card.Body>
 *     <Card.Footer>...</Card.Footer>
 *   </Card>
 */

import { motion } from 'framer-motion'

/* ── Variants ────────────────────────────────────────────────────── */
const VARIANTS = {
  glass:    'glass shadow-glass',
  surface:  'surface-card',
  outlined: 'bg-transparent border border-surface-700/60 rounded-2xl',
  gradient: [
    'relative rounded-2xl bg-surface-900',
    'before:absolute before:inset-0 before:rounded-2xl before:p-[1px]',
    'before:bg-gradient-to-br before:from-primary-500/40 before:via-accent-purple/30 before:to-accent-cyan/40',
    'before:-z-10',
  ].join(' '),
}

/* ── Root Card ───────────────────────────────────────────────────── */
function Card({
  children,
  variant = 'surface',
  hoverable = false,
  padding = true,
  className = '',
  onClick,
  ...props
}) {
  const base = [
    VARIANTS[variant] || VARIANTS.surface,
    hoverable ? 'cursor-pointer transition-all duration-300 hover:border-surface-600 hover:shadow-card-hover hover:-translate-y-0.5' : '',
    padding ? 'p-6' : '',
    className,
  ].join(' ')

  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={base}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={base} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

/* ── Card.Header ─────────────────────────────────────────────────── */
function CardHeader({ title, subtitle, icon, badge, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-5 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon container */}
        {icon && (
          <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
            {icon}
          </div>
        )}
        {/* Title + subtitle */}
        <div className="min-w-0">
          {title && (
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-surface-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {/* Right side: badge or action */}
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        {action}
      </div>
    </div>
  )
}

/* ── Card.Body ───────────────────────────────────────────────────── */
function CardBody({ children, className = '' }) {
  return <div className={`text-surface-300 text-sm leading-relaxed ${className}`}>{children}</div>
}

/* ── Card.Footer ─────────────────────────────────────────────────── */
function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-5 pt-4 border-t border-surface-800/60 flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  )
}

/* ── Stat Card — quick metric card ──────────────────────────────── */
export function StatCard({ label, value, change, icon, color = 'blue', className = '' }) {
  const COLOR_MAP = {
    blue:   { bg: 'bg-primary-500/10', border: 'border-primary-500/20', text: 'text-primary-400', change: 'text-primary-300' },
    green:  { bg: 'bg-success/10',     border: 'border-success/20',     text: 'text-emerald-400', change: 'text-emerald-300' },
    purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', text: 'text-violet-400', change: 'text-violet-300' },
    orange: { bg: 'bg-warning/10',     border: 'border-warning/20',     text: 'text-amber-400',   change: 'text-amber-300'  },
    red:    { bg: 'bg-error/10',       border: 'border-error/20',       text: 'text-red-400',     change: 'text-red-300'    },
  }
  const c = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div className={`surface-card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {change && <p className={`text-xs mt-1 font-medium ${c.change}`}>{change}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.bg} border ${c.border} ${c.text}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

/* Attach sub-components */
Card.Header = CardHeader
Card.Body   = CardBody
Card.Footer = CardFooter

export default Card
