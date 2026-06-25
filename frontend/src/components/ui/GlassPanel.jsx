/**
 * GlassPanel — Standalone glassmorphism container.
 *
 * Usage:
 *   <GlassPanel>...</GlassPanel>
 *   <GlassPanel size="sm" className="p-4">...</GlassPanel>
 */

import { motion } from 'framer-motion'

const SIZES = {
  xs: 'p-3',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
  none: '',
}

export default function GlassPanel({ children, size = 'md', hoverable = false, className = '', ...props }) {
  const classes = [
    'glass',
    hoverable ? 'cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.14] hover:shadow-glass-lg' : '',
    SIZES[size] || SIZES.md,
    className,
  ].join(' ')

  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={classes}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={classes} {...props}>{children}</div>
}
