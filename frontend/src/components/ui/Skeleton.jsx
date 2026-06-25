/**
 * Skeleton — Shimmer placeholder for async content.
 *
 * Primitives: Skeleton (base), SkeletonText, SkeletonAvatar, SkeletonButton
 * Composites: SkeletonCard, SkeletonTable, SkeletonStatRow
 *
 * Usage:
 *   <Skeleton width="w-full" height="h-6" />
 *   <SkeletonText lines={3} />
 *   <SkeletonCard />
 *   <SkeletonTable rows={5} cols={4} />
 */

/* ── Base Skeleton ───────────────────────────────────────────────── */
export default function Skeleton({ width = 'w-full', height = 'h-4', rounded = 'rounded-lg', className = '' }) {
  return (
    <div className={`skeleton ${width} ${height} ${rounded} ${className}`} />
  )
}

/* ── Text block ──────────────────────────────────────────────────── */
export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2']
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? widths[Math.min(i, widths.length - 1)] : 'w-full'}
          height="h-3.5"
        />
      ))}
    </div>
  )
}

/* ── Avatar ──────────────────────────────────────────────────────── */
export function SkeletonAvatar({ size = 'md' }) {
  const SIZES = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' }
  return <Skeleton width={SIZES[size] || SIZES.md} height={SIZES[size] || SIZES.md} rounded="rounded-full" />
}

/* ── Button ──────────────────────────────────────────────────────── */
export function SkeletonButton({ width = 'w-28' }) {
  return <Skeleton width={width} height="h-9" rounded="rounded-xl" />
}

/* ── Card ────────────────────────────────────────────────────────── */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`surface-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton width="w-9" height="h-9" rounded="rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-1/3" height="h-4" />
          <Skeleton width="w-1/2" height="h-3" />
        </div>
        <Skeleton width="w-16" height="h-6" rounded="rounded-lg" />
      </div>

      {/* Body lines */}
      <SkeletonText lines={4} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-800">
        <Skeleton width="w-24" height="h-4" />
        <Skeleton width="w-16" height="h-8" rounded="rounded-xl" />
      </div>
    </div>
  )
}

/* ── Stat card row ───────────────────────────────────────────────── */
export function SkeletonStatRow({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card p-5">
          <Skeleton width="w-20" height="h-3" className="mb-3" />
          <Skeleton width="w-16" height="h-8" className="mb-2" />
          <Skeleton width="w-24" height="h-2.5" />
        </div>
      ))}
    </div>
  )
}

/* ── Table ───────────────────────────────────────────────────────── */
export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  const colWidths = ['w-1/4', 'w-1/4', 'w-1/4', 'w-1/4', 'w-1/3', 'w-1/6', 'w-1/5']

  return (
    <div className={`surface-card overflow-hidden ${className}`}>
      {/* Table header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-surface-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={colWidths[i % colWidths.length]} height="h-3" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex items-center gap-4 px-5 py-4 border-b border-surface-800/50 last:border-none">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} width={colWidths[ci % colWidths.length]} height="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Navbar skeleton ─────────────────────────────────────────────── */
export function SkeletonNavbar() {
  return (
    <div className="h-16 border-b border-surface-800 flex items-center justify-between px-6">
      <Skeleton width="w-32" height="h-7" rounded="rounded-xl" />
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} width="w-16" height="h-4" rounded="rounded-md" />)}
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width="w-9" height="h-9" rounded="rounded-xl" />
        <Skeleton width="w-9" height="h-9" rounded="rounded-full" />
      </div>
    </div>
  )
}
