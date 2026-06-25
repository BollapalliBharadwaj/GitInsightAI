/**
 * Badge — Status and label indicators.
 *
 * Variants: default | primary | success | warning | error | info |
 *           purple | cyan | outline
 * Sizes: sm | md | lg
 * Dot: shows a pulsing dot before the label
 *
 * Usage:
 *   <Badge variant="success">Healthy</Badge>
 *   <Badge variant="warning" dot>Pending</Badge>
 *   <Badge variant="error" size="sm">Critical</Badge>
 */

const VARIANTS = {
  default: 'bg-surface-800 text-surface-300 border border-surface-700',
  primary: 'bg-primary-500/15 text-primary-300 border border-primary-500/25',
  success: 'bg-success/10 text-emerald-300 border border-success/25',
  warning: 'bg-warning/10 text-amber-300 border border-warning/25',
  error:   'bg-error/10 text-red-300 border border-error/25',
  info:    'bg-info/10 text-blue-300 border border-info/25',
  purple:  'bg-accent-purple/10 text-violet-300 border border-accent-purple/25',
  cyan:    'bg-accent-cyan/10 text-cyan-300 border border-accent-cyan/25',
  outline: 'bg-transparent text-surface-300 border border-surface-600',
}

const DOT_COLORS = {
  default: 'bg-surface-400',
  primary: 'bg-primary-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error:   'bg-red-400',
  info:    'bg-blue-400',
  purple:  'bg-violet-400',
  cyan:    'bg-cyan-400',
  outline: 'bg-surface-400',
}

const SIZES = {
  sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-md',
  md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg',
  lg: 'text-sm px-3 py-1.5 gap-2 rounded-xl',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
}) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium tracking-wide',
        'whitespace-nowrap',
        VARIANTS[variant] || VARIANTS.default,
        SIZES[size] || SIZES.md,
        className,
      ].join(' ')}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="relative flex shrink-0 h-1.5 w-1.5">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${DOT_COLORS[variant]}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${DOT_COLORS[variant] || DOT_COLORS.default}`}
          />
        </span>
      )}
      {children}
    </span>
  )
}
