/**
 * PageWrapper — Animated page container.
 *
 * Wraps each page with:
 *   - Entry animation (fade + slide up)
 *   - Consistent max-width + padding
 *   - Top padding to clear fixed Navbar
 *
 * Usage:
 *   <PageWrapper>
 *     <h1>Page Title</h1>
 *     ...
 *   </PageWrapper>
 *
 *   <PageWrapper fullWidth noPadding>
 *     ...
 *   </PageWrapper>
 */

import { motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
}

export default function PageWrapper({
  children,
  fullWidth = false,
  noPadding = false,
  className = '',
}) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={[
        'min-h-screen',
        /* Top padding to clear fixed Navbar */
        'pt-20',
        !noPadding ? 'px-4 sm:px-6 pb-16' : '',
        !fullWidth ? 'max-w-7xl mx-auto' : '',
        className,
      ].join(' ')}
    >
      {children}
    </motion.main>
  )
}

/**
 * SectionWrapper — Animated section within a page.
 * Staggers entrance when used with AnimatePresence.
 */
export function SectionWrapper({ children, delay = 0, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
