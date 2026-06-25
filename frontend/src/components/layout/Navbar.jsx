/**
 * Navbar — Top navigation bar with logo, nav links, and action buttons.
 *
 * Features:
 *   - Glassmorphism with backdrop blur
 *   - Scroll-based shadow intensification
 *   - Active link highlighting via React Router
 *   - Mobile hamburger menu
 *
 * Usage:
 *   <Navbar />  (no props needed — self-contained)
 */

import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Search, History, Home, Menu, X, Sparkles, ExternalLink } from 'lucide-react'
import Button from './Button'

/* ── Nav links definition ────────────────────────────────────────── */
const NAV_LINKS = [
  { to: '/',        label: 'Home',    icon: Home     },
  { to: '/analyze', label: 'Analyze', icon: Search   },
  { to: '/history', label: 'History', icon: History  },
]

/* ── Logo ────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 group">
      {/* Icon mark */}
      <div className="relative w-8 h-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-glow-blue group-hover:shadow-glow-blue-lg transition-shadow duration-300">
          <GitBranch size={15} className="text-white" />
        </div>
        {/* Subtle glow ring on hover */}
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-primary-600/40 to-accent-purple/40 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </div>

      {/* Wordmark */}
      <div>
        <span className="text-sm font-bold text-white tracking-tight">GitInsight</span>
        <span className="text-sm font-bold gradient-text-blue ml-0.5">AI</span>
      </div>
    </NavLink>
  )
}

/* ── Desktop Nav Link ────────────────────────────────────────────── */
function DesktopNavLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => [
        'relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
        isActive
          ? 'text-white bg-white/[0.08] border border-white/[0.1]'
          : 'text-surface-400 hover:text-white hover:bg-white/[0.05]',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} />
          {label}
          {/* Active indicator dot */}
          {isActive && (
            <motion.div
              layoutId="nav-active-dot"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-400"
            />
          )}
        </>
      )}
    </NavLink>
  )
}

/* ── Mobile Menu ─────────────────────────────────────────────────── */
function MobileMenu({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 right-0 mt-2 mx-4 glass rounded-2xl overflow-hidden shadow-glass-xl z-50"
        >
          <nav className="p-3 space-y-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white bg-primary-500/15 border border-primary-500/20'
                    : 'text-surface-300 hover:text-white hover:bg-white/[0.06]',
                ].join(' ')}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-surface-800 mt-2">
              <Button variant="primary" size="sm" fullWidth leftIcon={<Sparkles size={14} />}>
                Analyze Repo
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Navbar ──────────────────────────────────────────────────────── */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const location = useLocation()

  /* Close mobile menu on route change */
  useEffect(() => { setMobileOpen(false) }, [location])

  /* Intensify border on scroll */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-70',
        'h-16 flex items-center',
        'transition-all duration-300',
        scrolled
          ? 'bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.08] shadow-glass'
          : 'bg-transparent border-b border-transparent',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <DesktopNavLink key={link.to} {...link} />
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* GitHub star CTA */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors duration-200"
          >
            <ExternalLink size={12} />
            <span>GitHub</span>
          </a>

          {/* Primary CTA */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles size={13} />}
            className="hidden sm:inline-flex"
          >
            Analyze
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-surface-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </header>
  )
}
