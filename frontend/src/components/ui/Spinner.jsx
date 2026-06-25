/**
 * Spinner — Multiple loading indicator styles.
 *
 * Variants: ring | dots | pulse | bars
 * Sizes: xs | sm | md | lg | xl
 *
 * Usage:
 *   <Spinner />
 *   <Spinner variant="dots" size="lg" />
 *   <Spinner variant="pulse" color="purple" />
 *   <PageLoader label="Analyzing repository..." />
 */

/* ── Size map ────────────────────────────────────────────────────── */
const SIZES = {
  xs: { ring: 'w-4 h-4 border-[1.5px]', dot: 'w-1 h-1',    bar: 'w-0.5 h-3', text: 'text-[10px]' },
  sm: { ring: 'w-5 h-5 border-2',        dot: 'w-1.5 h-1.5', bar: 'w-0.5 h-4', text: 'text-xs'     },
  md: { ring: 'w-7 h-7 border-2',        dot: 'w-2 h-2',    bar: 'w-1 h-5',   text: 'text-sm'     },
  lg: { ring: 'w-10 h-10 border-[3px]',  dot: 'w-2.5 h-2.5', bar: 'w-1 h-7',  text: 'text-base'   },
  xl: { ring: 'w-14 h-14 border-[3px]',  dot: 'w-3 h-3',    bar: 'w-1.5 h-9', text: 'text-lg'     },
}

const COLOR_MAP = {
  blue:   { ring: 'border-primary-500', bg: 'bg-primary-500' },
  purple: { ring: 'border-accent-purple', bg: 'bg-accent-purple' },
  cyan:   { ring: 'border-accent-cyan',   bg: 'bg-accent-cyan'   },
  white:  { ring: 'border-white',         bg: 'bg-white'         },
  green:  { ring: 'border-accent-green',  bg: 'bg-accent-green'  },
}

/* ── Ring Spinner ────────────────────────────────────────────────── */
function RingSpinner({ size = 'md', color = 'blue' }) {
  const s = SIZES[size] || SIZES.md
  const c = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div
      className={[
        'rounded-full animate-spin',
        s.ring,
        c.ring,
        'border-t-transparent',
      ].join(' ')}
      role="status"
      aria-label="Loading"
    />
  )
}

/* ── Dots Spinner ────────────────────────────────────────────────── */
function DotsSpinner({ size = 'md', color = 'blue' }) {
  const s = SIZES[size] || SIZES.md
  const c = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${s.dot} ${c.bg} rounded-full animate-bounce-soft`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  )
}

/* ── Pulse Spinner ───────────────────────────────────────────────── */
function PulseSpinner({ size = 'md', color = 'blue' }) {
  const s = SIZES[size] || SIZES.md
  const c = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div className="relative flex" role="status" aria-label="Loading">
      <div className={`${s.ring.split(' ')[0]} ${s.ring.split(' ')[1]} ${c.bg} rounded-full animate-ping absolute opacity-60`} />
      <div className={`${s.ring.split(' ')[0]} ${s.ring.split(' ')[1]} ${c.bg} rounded-full relative`} />
    </div>
  )
}

/* ── Bars Spinner ────────────────────────────────────────────────── */
function BarsSpinner({ size = 'md', color = 'blue' }) {
  const s = SIZES[size] || SIZES.md
  const c = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div className="flex items-end gap-0.5" role="status" aria-label="Loading">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`${s.bar} ${c.bg} rounded-full animate-bounce-soft`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

/* ── Spinner (router) ────────────────────────────────────────────── */
export default function Spinner({ variant = 'ring', size = 'md', color = 'blue' }) {
  switch (variant) {
    case 'dots':  return <DotsSpinner  size={size} color={color} />
    case 'pulse': return <PulseSpinner size={size} color={color} />
    case 'bars':  return <BarsSpinner  size={size} color={color} />
    default:      return <RingSpinner  size={size} color={color} />
  }
}

/**
 * PageLoader — Full-page loading screen.
 * Used while navigating between pages or during initial analysis.
 */
export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-950">
      {/* Animated logo glow */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-glow-blue animate-pulse-soft">
          <span className="text-2xl font-bold text-white">G</span>
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary-600/30 to-accent-purple/30 blur-xl animate-pulse-soft" />
      </div>

      <RingSpinner size="md" color="blue" />

      <p className="mt-4 text-sm text-surface-400 animate-pulse-soft">{label}</p>
    </div>
  )
}
