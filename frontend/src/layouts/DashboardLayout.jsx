/**
 * DashboardLayout — Shell wrapper for all dashboard pages.
 *
 * Composes:
 *   - DashSidebar (collapsible, width-animated)
 *   - DashTopbar  (search, notifications, user)
 *   - Main content area with scroll + page padding
 *
 * Usage:
 *   <DashboardLayout>
 *     <Dashboard />
 *   </DashboardLayout>
 */

import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, LayoutDashboard, Search, History, BarChart2,
  Settings, ChevronLeft, ChevronRight, Zap, Shield, Package,
  BookOpen, Bell, X, Plus, LogOut,
} from 'lucide-react'

/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */

const PRIMARY_NAV = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/analyze',  icon: Search,          label: 'Analyze'   },
  { to: '/dashboard/history',  icon: History,         label: 'History'   },
  { to: '/dashboard/results',  icon: BarChart2,       label: 'Results'   },
]

const ANALYSIS_NAV = [
  { to: '/dashboard/code',     icon: Zap,     label: 'Code Quality'   },
  { to: '/dashboard/security', icon: Shield,  label: 'Security'       },
  { to: '/dashboard/deps',     icon: Package, label: 'Dependencies'   },
  { to: '/dashboard/docs',     icon: BookOpen,label: 'Documentation'  },
]

/* Sidebar nav item */
function SidebarItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => [
        'relative group flex items-center gap-3 rounded-xl transition-all duration-150 select-none',
        collapsed ? 'w-9 h-9 justify-center mx-auto' : 'px-3 py-2.5 w-full',
        isActive
          ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
          : 'text-surface-400 hover:text-white hover:bg-white/[0.05]',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <motion.span
              layoutId="dash-sidebar-bar"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary-400"
            />
          )}
          <Icon size={16} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-card">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

/* Section divider label */
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="my-2 border-t border-surface-800" />
  return (
    <p className="px-3 mb-1 text-[10px] font-semibold text-surface-600 uppercase tracking-widest">
      {label}
    </p>
  )
}

/* Sidebar component */
function DashSidebar({ collapsed, setCollapsed, user }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="relative shrink-0 flex flex-col h-screen bg-surface-950 border-r border-surface-800 overflow-visible z-30"
    >
      {/* Logo */}
      <div className={`flex items-center h-16 shrink-0 border-b border-surface-800 ${collapsed ? 'justify-center px-2' : 'px-5 gap-3'}`}>
        <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-glow-blue">
          <GitBranch size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-sm font-bold text-white">GitInsight</span>
              <span className="text-sm font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-0.5">
        <SectionLabel label="Navigation" collapsed={collapsed} />
        {PRIMARY_NAV.map(item => <SidebarItem key={item.to} {...item} collapsed={collapsed} />)}

        <div className="my-3" />
        <SectionLabel label="Analysis" collapsed={collapsed} />
        {ANALYSIS_NAV.map(item => <SidebarItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Bottom */}
      <div className="relative shrink-0 border-t border-surface-800 p-2">
        {/* User avatar */}
        {!collapsed ? (
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer text-left focus:outline-none"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-surface-500 truncate">{user?.email || 'Free Plan'}</p>
            </div>
            <Settings size={13} className="text-surface-500 shrink-0" />
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-full focus:outline-none overflow-hidden"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-xs font-bold text-white cursor-pointer">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
            </button>
          </div>
        )}

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute z-50 bg-surface-900 border border-surface-800 rounded-2xl p-2.5 shadow-modal ${
                  collapsed ? 'left-16 bottom-2 w-52' : 'left-2 bottom-16 w-[232px]'
                }`}
              >
                {/* User info */}
                <div className="px-3 py-2 border-b border-surface-800 mb-1.5 text-left">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-surface-500 truncate">{user?.email || 'Free Plan'}</p>
                </div>
                
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/dashboard')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-surface-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                >
                  <Settings size={13} className="text-surface-500" />
                  Account Settings
                </button>
                
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    localStorage.removeItem('user')
                    navigate('/')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-accent-red hover:bg-accent-red/10 transition-colors text-left mt-1"
                >
                  <LogOut size={13} className="shrink-0" />
                  Log Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute top-[4.5rem] -right-3 w-6 h-6 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-all z-10 shadow-card"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </motion.aside>
  )
}

/* ══════════════════════════════════════════════
   TOPBAR
══════════════════════════════════════════════ */

function DashTopbar({ title = 'Dashboard', subtitle, user }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal]   = useState('')
  const [notifOpen, setNotifOpen]   = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [repoUrl, setRepoUrl]       = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  const handleAnalyze = () => {
    if (repoUrl.trim()) {
      setShowModal(false)
      navigate(`/explorer?url=${encodeURIComponent(repoUrl.trim())}`)
      setRepoUrl('')
    }
  }

  const NOTIFS = [
    { icon: Zap,    color: 'text-primary-400', msg: 'facebook/react scored 96/100', time: '2 min ago' },
    { icon: Shield, color: 'text-accent-green', msg: '0 critical issues found in vuejs/vue', time: '18 min ago' },
    { icon: Bell,   color: 'text-accent-orange', msg: 'tensorflow/tensorflow analysis queued', time: '1 hr ago' },
  ]

  return (
    <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-surface-800 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-20">
      {/* Left — title */}
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              key="search-open"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 h-9 bg-surface-800 border border-surface-700 rounded-xl px-3">
                <Search size={13} className="text-surface-400 shrink-0" />
                <input
                  autoFocus
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search repositories..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-surface-500 outline-none"
                />
                <button onClick={() => { setSearchOpen(false); setSearchVal('') }}>
                  <X size={13} className="text-surface-500 hover:text-white transition-colors" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="search-closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-400 hover:text-white hover:bg-white/[0.06] border border-surface-800 transition-all"
              title="Search (⌘K)"
            >
              <Search size={15} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* New analysis button */}
        <button 
          onClick={() => setShowModal(true)}
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-all shadow-glow-blue hover:shadow-glow-blue-lg"
        >
          <Plus size={14} />
          New Analysis
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-surface-400 hover:text-white hover:bg-white/[0.06] border border-surface-800 transition-all"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-red" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface-900 border border-surface-700 rounded-2xl shadow-modal overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <button onClick={() => setNotifOpen(false)}><X size={13} className="text-surface-500" /></button>
                </div>
                <div className="divide-y divide-surface-800">
                  {NOTIFS.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <n.icon size={14} className={`${n.color} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-surface-200 leading-relaxed">{n.msg}</p>
                        <p className="text-[10px] text-surface-500 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-surface-800">
                  <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">Mark all as read</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="focus:outline-none flex items-center justify-center"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover cursor-pointer border-2 border-surface-800 hover:border-primary-500/50 transition-colors" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-xs font-bold text-white cursor-pointer border-2 border-surface-800 hover:border-primary-500/50 transition-colors">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-surface-900 border border-surface-800 rounded-2xl shadow-modal p-2.5 z-45"
                >
                  <div className="px-3 py-2 border-b border-surface-800 mb-1.5 text-left">
                    <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-surface-500 truncate">{user?.email || 'Free Plan'}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/dashboard')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-surface-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <Settings size={13} className="text-surface-500" />
                    Account Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      localStorage.removeItem('user')
                      navigate('/')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-accent-red hover:bg-accent-red/10 transition-colors text-left mt-1"
                  >
                    <LogOut size={13} className="shrink-0" />
                    Log Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Analysis Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
            />
            {/* Content card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl p-6 shadow-modal overflow-hidden"
            >
              {/* Top gradient glow */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-accent-purple to-accent-cyan" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-glow-blue">
                    <Search size={14} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white">New Repository Analysis</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-surface-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-xs text-surface-400 mb-6 leading-relaxed">
                Enter any public GitHub URL to begin static code analysis, security auditing, and architectural mapping.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-surface-950 border border-surface-800 focus-within:border-primary-500/50 rounded-2xl px-4 py-3 transition-colors">
                  <GitBranch size={16} className="text-surface-500 shrink-0" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-surface-600 outline-none"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-glow-blue hover:shadow-glow-blue-lg"
                  >
                    Start Analysis
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ══════════════════════════════════════════════
   LAYOUT EXPORT
══════════════════════════════════════════════ */
export default function DashboardLayout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false)
  
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : { name: 'User', email: 'user@example.com', avatarUrl: '' }

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Sidebar */}
      <DashSidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashTopbar title={title} subtitle={subtitle} user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
