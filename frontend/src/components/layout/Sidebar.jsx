/**
 * Sidebar — Collapsible left navigation panel.
 *
 * Features:
 *   - Collapsible (icon-only mode at 64px wide)
 *   - Section grouping with dividers
 *   - Tooltip labels when collapsed
 *   - Active state with animated indicator
 *   - Bottom user/settings section
 *
 * Usage:
 *   <Sidebar />  — self-contained, reads route from React Router
 *
 * Sidebar is typically used in dashboard / results layouts,
 * not on the main landing page.
 */

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Search, History, BarChart2, Settings,
  GitBranch, ChevronLeft, ChevronRight,
  BookOpen, Zap, Shield, Package,
} from 'lucide-react'

/* ── Nav items config ────────────────────────────────────────────── */
const PRIMARY_NAV = [
  { to: '/',        icon: Home,     label: 'Dashboard' },
  { to: '/analyze', icon: Search,   label: 'Analyze'   },
  { to: '/history', icon: History,  label: 'History'   },
  { to: '/results', icon: BarChart2, label: 'Results'  },
]

const ANALYSIS_NAV = [
  { to: '/results/code',     icon: Zap,     label: 'Code Quality'    },
  { to: '/results/security', icon: Shield,  label: 'Security'        },
  { to: '/results/deps',     icon: Package, label: 'Dependencies'    },
  { to: '/results/docs',     icon: BookOpen, label: 'Documentation'  },
]

/* ── Single nav item ─────────────────────────────────────────────── */
function SidebarItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => [
        'relative group flex items-center gap-3 rounded-xl transition-all duration-200',
        collapsed ? 'w-9 h-9 justify-center mx-auto' : 'px-3 py-2.5 w-full',
        isActive
          ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
          : 'text-surface-400 hover:text-white hover:bg-white/[0.05]',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {/* Active left bar */}
          {isActive && !collapsed && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary-400"
            />
          )}

          <Icon size={16} className="shrink-0" />

          {/* Label — hidden when collapsed */}
          {!collapsed && (
            <span className="text-sm font-medium truncate">{label}</span>
          )}

          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-card">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="my-2 border-t border-surface-800" />
  return (
    <p className="px-3 mb-1 text-[10px] font-semibold text-surface-600 uppercase tracking-widest">
      {label}
    </p>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────── */
export default function Sidebar({ defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={[
        'relative flex flex-col h-screen',
        'bg-surface-950 border-r border-surface-800',
        'overflow-hidden',
      ].join(' ')}
    >
      {/* ── Logo section ── */}
      <div className={`flex items-center h-16 shrink-0 border-b border-surface-800 ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
        <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-glow-blue">
          <GitBranch size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-bold text-white">GitInsight</span>
              <span className="text-sm font-bold gradient-text-blue">AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Primary nav ── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-1">
        <SectionLabel label="Navigation" collapsed={collapsed} />
        {PRIMARY_NAV.map((item) => (
          <SidebarItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div className="my-3" />
        <SectionLabel label="Analysis" collapsed={collapsed} />
        {ANALYSIS_NAV.map((item) => (
          <SidebarItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div className="shrink-0 border-t border-surface-800 p-2">
        <SidebarItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
      </div>

      {/* ── Collapse toggle button ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={[
          'absolute top-[72px] -right-3 z-10',
          'w-6 h-6 rounded-full',
          'bg-surface-800 border border-surface-700',
          'flex items-center justify-center',
          'text-surface-400 hover:text-white',
          'transition-all duration-200 hover:bg-surface-700',
          'shadow-card',
        ].join(' ')}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft  size={12} />
        }
      </button>
    </motion.aside>
  )
}
