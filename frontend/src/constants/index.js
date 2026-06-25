/**
 * App-wide constants.
 * Centralized values used across multiple components.
 */

// Framer Motion animation variants — reusable across all pages
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

// Stagger children animation — used for lists and grids
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// App metadata
export const APP_NAME = 'GitInsight AI'
export const APP_DESCRIPTION = 'AI-powered GitHub Repository Analyzer'
