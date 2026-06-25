/**
 * LandingPage — Premium GitInsight AI Marketing Page
 *
 * Sections (in order):
 *  1. Navbar          — sticky glass nav with CTA
 *  2. Hero            — animated particle background + headline
 *  3. Features        — 6-card grid with icons
 *  4. Workflow        — 4-step animated timeline
 *  5. Testimonials    — avatar cards carousel
 *  6. FAQ             — accordion
 *  7. CTA Banner      — full-width gradient call to action
 *  8. Footer          — columns + social + legal
 *
 * Animations via Framer Motion — scroll-triggered with useInView.
 * Zero backend dependencies — pure UI.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  GitBranch, Search, Shield, Zap, BarChart2, BookOpen,
  Star, ChevronDown, ArrowRight, ExternalLink,
  Code2, Package, Cpu, CheckCircle, Sparkles, Globe, Menu, X,
  TrendingUp, Lock, Eye, Database, GitPullRequest, Send, Loader, Plus
} from 'lucide-react'

/* ─────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  show:    { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5 } },
}

const stagger = (delay = 0.1) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
})

/* Scroll-trigger wrapper */
function Reveal({ children, delay = 0, className = '', once = true }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   1. NAVBAR
───────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#workflow' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

function LandingNavbar({ onSignIn }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  const isLoggedIn = !!user

  const handleSignOut = () => {
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 inset-x-0 z-50 h-16 flex items-center"
    >
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        {/* Glass pill */}
        <div className="flex items-center justify-between w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-glass">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-glow-blue">
              <GitBranch size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">
              GitInsight<span className="bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">AI</span>
            </span>
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="px-3.5 py-2 rounded-xl text-sm text-surface-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-surface-400 hover:text-white transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-sm font-medium transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onSignIn}
                  className="text-sm text-surface-400 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all duration-200 shadow-glow-blue hover:shadow-glow-blue-lg"
                >
                  <Sparkles size={13} />
                  Try Free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(o => !o)} className="md:hidden text-surface-400 hover:text-white transition-colors">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full mt-2 inset-x-4 bg-surface-900 border border-surface-700 rounded-2xl shadow-modal p-4 space-y-1 md:hidden"
          >
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm text-surface-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-surface-800 flex gap-2">
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={() => { setOpen(false); navigate('/dashboard'); }}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm text-white bg-primary-600 font-medium"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm text-surface-300 border border-surface-700 hover:bg-white/[0.05] transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setOpen(false); onSignIn(); }}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm text-surface-300 border border-surface-700 hover:bg-white/[0.05] transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => { setOpen(false); onSignIn(); }}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm bg-primary-600 text-white font-medium"
                  >
                    Try Free
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

/* ─────────────────────────────────────────────
   2. HERO
───────────────────────────────────────────── */
/* Animated background grid + orbs */
function HeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-primary-600/20 blur-[120px] animate-pulse-soft" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-accent-purple/15 blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.2s' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-accent-cyan/10 blur-[100px]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Floating code snippets */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-32 left-8 lg:left-24 hidden lg:block"
      >
        <div className="glass-sm px-4 py-3 text-xs font-mono text-accent-green shadow-glow-green/20">
          <span className="text-surface-500">// Analysis complete</span><br />
          score: <span className="text-accent-cyan">94</span> / 100
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute top-48 right-8 lg:right-24 hidden lg:block"
      >
        <div className="glass-sm px-4 py-3 text-xs font-mono text-accent-purple shadow-glow-purple/20">
          security: <span className="text-accent-green">✓ Safe</span><br />
          <span className="text-surface-500">0 critical issues</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute bottom-40 right-12 lg:right-40 hidden lg:block"
      >
        <div className="glass-sm px-4 py-3 text-xs font-mono text-primary-300">
          <span className="text-surface-500">agents running: </span><span className="text-accent-cyan">3</span><br />
          <span className="text-accent-green">● </span>code ● security ● docs
        </div>
      </motion.div>
    </div>
  )
}

/* Animated terminal preview */
function TerminalPreview() {
  const lines = [
    { text: '$ gitinsight analyze facebook/react', type: 'cmd' },
    { text: '✦ Fetching repository metadata...', type: 'info' },
    { text: '✦ Running code quality agent...', type: 'info' },
    { text: '✦ Running security scan agent...', type: 'info' },
    { text: '✦ Generating AI recommendations...', type: 'info' },
    { text: '', type: 'blank' },
    { text: '✅ Analysis complete — Score: 94/100', type: 'success' },
    { text: '   Code Quality:  96   Security: 91', type: 'data' },
    { text: '   Dependencies:  88   Docs:     89', type: 'data' },
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden border border-surface-700 shadow-modal bg-surface-950">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-900 border-b border-surface-800">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-surface-500 font-mono">gitinsight — terminal</span>
      </div>
      {/* Lines */}
      <div className="p-5 space-y-1.5 font-mono text-xs">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.18, duration: 0.3 }}
            className={
              l.type === 'cmd'     ? 'text-white' :
              l.type === 'info'    ? 'text-primary-400' :
              l.type === 'success' ? 'text-accent-green font-semibold' :
              l.type === 'data'    ? 'text-surface-300' :
              'h-2'
            }
          >
            {l.text}
            {l.type === 'cmd' && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-0.5 inline-block w-2 h-3.5 bg-white align-middle"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Hero({ onSignIn }) {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('user')

  const handleCTAClick = () => {
    if (isLoggedIn) navigate('/dashboard')
    else onSignIn()
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
      <HeroBg />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-xs text-primary-300 font-medium">Powered by Llama 3.1 + LangGraph</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tightest leading-tighter mb-6"
          >
            Understand any{' '}
            <span className="bg-gradient-to-r from-primary-400 via-accent-purple to-accent-cyan bg-clip-text text-transparent">
              GitHub repo
            </span>{' '}
            in seconds.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg text-surface-300 leading-relaxed mb-10 max-w-lg"
          >
            Drop any public GitHub URL. Our AI agents scan code quality, security vulnerabilities,
            architecture, and dependencies — then deliver a full report in under 60 seconds.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <button
              onClick={handleCTAClick}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-base transition-all duration-200 shadow-glow-blue hover:shadow-glow-blue-lg group"
            >
              <Sparkles size={16} />
              Analyze a Repository
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#workflow"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white font-medium text-base transition-all duration-200">
              See how it works
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="flex items-center gap-4 text-sm text-surface-400"
          >
            <div className="flex -space-x-2">
              {['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-surface-950 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: c }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span><strong className="text-white">2,400+</strong> repos analyzed this week</span>
          </motion.div>
        </div>

        {/* Right — terminal preview */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Glow halo */}
          <div className="absolute -inset-8 bg-gradient-to-r from-primary-600/20 via-accent-purple/15 to-accent-cyan/20 rounded-3xl blur-3xl" />
          <div className="relative">
            <TerminalPreview />
            {/* Score badges floating above terminal */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-5 glass-sm px-4 py-2.5 shadow-glow-blue flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <TrendingUp size={14} className="text-primary-400" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400">Overall Score</p>
                <p className="text-base font-bold text-white">94<span className="text-xs text-surface-400 font-normal">/100</span></p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-5 -left-5 glass-sm px-4 py-2.5 shadow-glow-green flex items-center gap-2"
            >
              <CheckCircle size={16} className="text-accent-green" />
              <span className="text-xs font-medium text-white">0 critical issues</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-surface-600 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] uppercase tracking-widest">scroll</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   3. FEATURES
───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Code2,
    color: 'blue',
    gradient: 'from-primary-500 to-primary-700',
    glow: 'shadow-glow-blue',
    title: 'Code Quality Analysis',
    desc: 'Deep scan of code structure, complexity, naming conventions, and maintainability scores powered by AI.',
  },
  {
    icon: Shield,
    color: 'green',
    gradient: 'from-accent-green to-emerald-700',
    glow: 'shadow-glow-green',
    title: 'Security Vulnerability Scan',
    desc: 'Detect exposed secrets, outdated packages with CVEs, and insecure patterns across the entire codebase.',
  },
  {
    icon: Package,
    color: 'orange',
    gradient: 'from-accent-orange to-orange-700',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    title: 'Dependency Intelligence',
    desc: 'Track outdated packages, license risks, and transitive dependency chains with upgrade recommendations.',
  },
  {
    icon: BookOpen,
    color: 'cyan',
    gradient: 'from-accent-cyan to-cyan-700',
    glow: 'shadow-glow-cyan',
    title: 'Documentation Coverage',
    desc: 'Measure README completeness, inline comment density, and auto-generate missing documentation outlines.',
  },
  {
    icon: BarChart2,
    color: 'purple',
    gradient: 'from-accent-purple to-purple-800',
    glow: 'shadow-glow-purple',
    title: 'Architecture Insights',
    desc: 'Visualize module coupling, identify circular dependencies, and understand the overall repository structure.',
  },
  {
    icon: Cpu,
    color: 'blue',
    gradient: 'from-primary-400 to-accent-cyan',
    glow: 'shadow-glow-cyan',
    title: 'Agentic AI Pipeline',
    desc: 'Multiple specialised LangGraph agents work in parallel, each an expert in a different dimension of software quality.',
  },
]

function FeatureCard({ icon: Icon, gradient, glow, title, desc, index }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group glass-hover p-6 cursor-default"
    >
      {/* Icon */}
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 ${glow}`}>
        <Icon size={20} className="text-white" />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-surface-400 leading-relaxed">{desc}</p>

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)' }} />
    </motion.div>
  )
}

function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="py-28 relative overflow-hidden">
      {/* Subtle bg orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        {/* Heading */}
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 mb-4">
            <Zap size={11} className="text-accent-purple" />
            <span className="text-xs text-accent-purple font-medium">Six AI Agents</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tightest text-white mb-4">
            Everything you need to<br />
            <span className="bg-gradient-to-r from-primary-400 to-accent-purple bg-clip-text text-transparent">understand any codebase</span>
          </h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            Each analysis runs six specialised AI agents in parallel — giving you comprehensive insights in under a minute.
          </p>
        </Reveal>

        {/* Cards grid */}
        <motion.div
          ref={ref}
          variants={stagger(0.08)}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   4. WORKFLOW
───────────────────────────────────────────── */
const STEPS = [
  {
    number: '01',
    icon: Globe,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10 border-primary-500/20',
    title: 'Paste the GitHub URL',
    desc: 'Drop any public GitHub repository link into the analyzer. No authentication required for public repos.',
  },
  {
    number: '02',
    icon: Cpu,
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10 border-accent-purple/20',
    title: 'AI Agents Go to Work',
    desc: 'Six LangGraph agents fan out in parallel — each specialised in code quality, security, deps, architecture, docs, and testing.',
  },
  {
    number: '03',
    icon: BarChart2,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10 border-accent-cyan/20',
    title: 'Receive Full Report',
    desc: 'A structured, human-readable report with scores, findings, and prioritised recommendations lands in under 60 seconds.',
  },
  {
    number: '04',
    icon: Database,
    color: 'text-accent-green',
    bg: 'bg-accent-green/10 border-accent-green/20',
    title: 'Save & Track History',
    desc: 'Results are cached and stored. Re-run analyses to track improvement over time as your team ships code.',
  },
]

function Workflow() {
  return (
    <section id="workflow" className="py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-4">
            <ArrowRight size={11} className="text-accent-cyan" />
            <span className="text-xs text-accent-cyan font-medium">Simple 4-Step Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tightest text-white mb-4">
            From URL to insights in{' '}
            <span className="bg-gradient-to-r from-accent-cyan to-primary-400 bg-clip-text text-transparent">60 seconds</span>
          </h2>
          <p className="text-surface-400 text-lg max-w-xl mx-auto">
            No setup. No configuration. Just paste and go.
          </p>
        </Reveal>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gradient-to-r from-primary-500/0 via-surface-700 to-primary-500/0 hidden lg:block" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 0.12}>
                <div className="flex flex-col items-start">
                  {/* Number + icon */}
                  <div className="relative mb-6">
                    <div className={`w-14 h-14 rounded-2xl border ${step.bg} flex items-center justify-center mb-1`}>
                      <step.icon size={24} className={step.color} />
                    </div>
                    <span className="absolute -top-3 -right-3 text-[11px] font-black text-surface-600 font-mono">{step.number}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   5. TESTIMONIALS
───────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Senior Engineer @ Stripe',
    initials: 'SC',
    color: '#3b82f6',
    stars: 5,
    quote: 'GitInsight caught a hardcoded API key and three outdated packages with known CVEs in our codebase. Saved us from a potential breach. Absolutely essential.',
  },
  {
    name: 'Marcus Williams',
    role: 'CTO @ Nexus Labs',
    initials: 'MW',
    color: '#8b5cf6',
    stars: 5,
    quote: 'We run this on every new open-source dependency before we adopt it. The architecture insights and dependency chain analysis are world-class.',
  },
  {
    name: 'Priya Patel',
    role: 'Lead Developer @ Notion',
    initials: 'PP',
    color: '#06b6d4',
    stars: 5,
    quote: 'The documentation coverage scores gave our team a shared language around code quality. We went from 42% to 91% doc coverage in 3 sprints.',
  },
  {
    name: 'Alex Torres',
    role: 'Open Source Maintainer',
    initials: 'AT',
    color: '#10b981',
    stars: 5,
    quote: 'As a solo maintainer, this is like having a team of reviewers available 24/7. The AI recommendations are genuinely actionable — not just generic advice.',
  },
  {
    name: 'Jordan Kim',
    role: 'Staff Engineer @ Vercel',
    initials: 'JK',
    color: '#f59e0b',
    stars: 5,
    quote: 'The speed is insane. 60 seconds for a full quality analysis of a 200k LOC repo. We integrated this into our internal tooling immediately.',
  },
  {
    name: 'Emma Larsson',
    role: 'Engineering Manager @ Linear',
    initials: 'EL',
    color: '#ec4899',
    stars: 5,
    quote: 'Our code review process improved overnight. We now reference GitInsight scores in PRs. It has fundamentally changed how we talk about code quality.',
  },
]

function TestimonialCard({ name, role, initials, color, stars, quote }) {
  return (
    <motion.div variants={fadeUp} className="glass p-6 flex flex-col gap-4">
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} size={13} className="text-accent-orange fill-accent-orange" />
        ))}
      </div>
      {/* Quote */}
      <p className="text-sm text-surface-300 leading-relaxed flex-1">"{quote}"</p>
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: color, borderColor: color + '66' }}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-surface-500">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="testimonials" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-primary-950/20 to-surface-950 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-orange/10 border border-accent-orange/20 mb-4">
            <Star size={11} className="text-accent-orange fill-accent-orange" />
            <span className="text-xs text-accent-orange font-medium">Loved by engineers</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tightest text-white mb-4">
            Trusted by teams at{' '}
            <span className="bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">top companies</span>
          </h2>
          <p className="text-surface-400 text-lg max-w-xl mx-auto">
            Join thousands of engineers and teams using GitInsight to ship better software.
          </p>
        </Reveal>

        <motion.div
          ref={ref}
          variants={stagger(0.07)}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {TESTIMONIALS.map(t => <TestimonialCard key={t.name} {...t} />)}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   6. FAQ
───────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Which repositories can I analyze?',
    a: 'Any public GitHub repository. Private repos require a Personal Access Token with read access. We never store your token — it is used only during the analysis session.',
  },
  {
    q: 'How long does an analysis take?',
    a: 'Most repositories are fully analyzed in 30–90 seconds depending on size. Very large monorepos (500k+ lines) may take up to 3 minutes.',
  },
  {
    q: 'What AI models power the analysis?',
    a: 'The agentic pipeline is built with LangGraph and runs on Llama 3.1 via Ollama locally. You can configure a different model or use a cloud provider like OpenAI or Anthropic.',
  },
  {
    q: 'Is my code sent to any external server?',
    a: 'No. When running locally, all analysis happens on your own machine — your code never leaves your environment. The only external call is to GitHub\'s public API to fetch repository data.',
  },
  {
    q: 'Are results cached?',
    a: 'Yes. Analysis results are cached in a local SQLite database for 24 hours. Re-running an analysis on an unchanged repo returns cached results instantly.',
  },
  {
    q: 'Can I integrate GitInsight into CI/CD?',
    a: 'A REST API is available so you can trigger analyses and retrieve reports programmatically. CI integration guides for GitHub Actions and GitLab CI are in the docs.',
  },
]

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <Reveal delay={index * 0.06}>
      <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-primary-500/30 bg-primary-500/[0.03]' : 'border-surface-800 bg-surface-900/50'}`}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <span className="text-sm font-semibold text-white">{q}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={16} className={open ? 'text-primary-400' : 'text-surface-500'} />
          </motion.div>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <p className="px-6 pb-5 text-sm text-surface-400 leading-relaxed border-t border-surface-800/60 pt-4">
                {a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

function FAQ() {
  return (
    <section id="faq" className="py-28">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tightest text-white mb-4">
            Frequently asked questions
          </h2>
          <p className="text-surface-400 text-base">
            Can't find the answer? <a href="#cta" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">Reach out →</a>
          </p>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((f, i) => <FAQItem key={f.q} {...f} index={i} />)}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   7. CTA BANNER
───────────────────────────────────────────── */
function CTABanner({ onSignIn }) {
  const [repoUrl, setRepoUrl] = useState('')
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('user')

  const handleAnalyze = () => {
    if (repoUrl.trim()) {
      if (isLoggedIn) {
        navigate(`/explorer?url=${encodeURIComponent(repoUrl.trim())}`)
      } else {
        onSignIn()
      }
    }
  }

  return (
    <section id="cta" className="py-20 px-5 sm:px-8">
      <Reveal>
        <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-purple to-accent-cyan opacity-90" />
          <div className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative px-10 py-16 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 mb-6">
              <Sparkles size={12} className="text-white" />
              <span className="text-xs text-white font-medium">Free to use · No credit card required</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tightest">
              Ready to understand your codebase?
            </h2>
            <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
              Paste any GitHub URL below and our AI agents will deliver a full analysis report in under 60 seconds.
            </p>

            {/* URL input */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
                <GitPullRequest size={16} className="text-white/60 shrink-0" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://github.com/owner/repository"
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm outline-none"
                />
              </div>
              <button 
                onClick={handleAnalyze}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-primary-700 font-bold text-sm hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl shrink-0"
              >
                <Sparkles size={14} />
                Analyze Now
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/60 text-xs">
              {['No signup required', 'Runs locally', 'Open source', 'GDPR safe'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-white/40" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ─────────────────────────────────────────────
   8. FOOTER
───────────────────────────────────────────── */
const FOOTER_LINKS = {
  Product:  ['Features', 'How it Works', 'Pricing', 'Changelog'],
  Docs:     ['Getting Started', 'API Reference', 'CI Integration', 'Self-Hosting'],
  Company:  ['About', 'Blog', 'Careers', 'Contact'],
  Legal:    ['Privacy', 'Terms', 'Security', 'Cookie Policy'],
}

function Footer() {
  return (
    <footer className="border-t border-surface-800 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-glow-blue">
                <GitBranch size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white">
                GitInsight<span className="bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">AI</span>
              </span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed mb-5 max-w-[200px]">
              AI-powered GitHub repository analysis for modern engineering teams.
            </p>
            <div className="flex items-center gap-3">
              {[GitPullRequest, Send, ExternalLink].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-8 h-8 rounded-xl bg-surface-800 hover:bg-surface-700 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-white transition-all duration-150">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-4">{section}</p>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm text-surface-500 hover:text-white transition-colors duration-150">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-800">
          <p className="text-xs text-surface-600">© 2025 GitInsight AI. Built with ❤️ using LangGraph + Llama 3.1.</p>
          <div className="flex items-center gap-1.5 text-xs text-surface-600">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────
   AuthModal COMPONENT
───────────────────────────────────────────── */
function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [showChooser, setShowChooser] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const navigate = useNavigate()

  const handleGoogleClick = () => {
    setLoading(true)
    setStatusText('Connecting to Google...')
    setTimeout(() => {
      setLoading(false)
      setShowChooser(true)
    }, 800)
  }

  const selectAccount = (account) => {
    setLoading(true)
    setStatusText(`Signing in as ${account.name}...`)
    setTimeout(() => {
      const mockUser = {
        name: account.name,
        email: account.email,
        avatarUrl: account.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}`
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      setLoading(false)
      onClose()
      navigate('/dashboard')
    }, 1000)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customName.trim() || !customEmail.trim()) return

    setLoading(true)
    setStatusText(`Signing in as ${customName.trim()}...`)
    setTimeout(() => {
      const mockUser = {
        name: customName.trim(),
        email: customEmail.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName.trim())}`
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      setLoading(false)
      onClose()
      navigate('/dashboard')
    }, 1000)
  }

  const MOCK_GOOGLE_ACCOUNTS = [
    {
      name: 'Bollapalli Bharadwaj',
      email: 'b.bharadwaj@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@design.io',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@tech.co',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80&q=80',
    }
  ]

  // Reset states when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setLoading(false)
      setShowChooser(false)
      setShowCustom(false)
      setCustomName('')
      setCustomEmail('')
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-sm bg-surface-900 border border-surface-800 rounded-3xl p-6 shadow-modal overflow-hidden text-center"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-accent-purple to-accent-cyan" />
            
            <button onClick={onClose} className="absolute right-4 top-4 text-surface-500 hover:text-white transition-colors">
              <X size={16} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
              <GitBranch size={20} className="text-white" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Sign in to GitInsight AI</h3>
            <p className="text-xs text-surface-400 mb-6 leading-relaxed">
              Analyze your code repositories, scan credentials, map architecture dependencies, and generate roadmaps.
            </p>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Loader size={24} className="text-primary-400 animate-spin" />
                <p className="text-xs text-primary-300 font-medium animate-pulse">{statusText}</p>
              </div>
            ) : showCustom ? (
              <form onSubmit={handleCustomSubmit} className="space-y-4 text-left">
                <h4 className="text-sm font-semibold text-white mb-1">Create Simulated Account</h4>
                <p className="text-[11px] text-surface-400 mb-4">
                  Enter your custom name and email to proceed.
                </p>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-surface-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Bollapalli Bharadwaj"
                    className="w-full h-10 bg-surface-950 border border-surface-800 focus:border-primary-500/50 rounded-xl px-3 text-xs text-white placeholder:text-surface-600 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-surface-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    placeholder="e.g. b.bharadwaj@gmail.com"
                    className="w-full h-10 bg-surface-950 border border-surface-800 focus:border-primary-500/50 rounded-xl px-3 text-xs text-white placeholder:text-surface-600 outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustom(false)
                      setShowChooser(true)
                    }}
                    className="flex-1 h-10 border border-surface-800 text-surface-400 hover:text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl transition-all shadow-glow-blue"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            ) : showChooser ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="flex justify-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Choose an account</h4>
                  <p className="text-[10px] text-surface-500">to continue to GitInsight AI</p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {MOCK_GOOGLE_ACCOUNTS.map((account, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectAccount(account)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-surface-950/40 hover:bg-white/[0.04] border border-surface-800/60 hover:border-surface-700 text-left transition-all duration-150 group"
                    >
                      <img
                        src={account.avatarUrl}
                        alt={account.name}
                        className="w-8 h-8 rounded-full object-cover border border-surface-800 group-hover:border-primary-500/30 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-primary-300 transition-colors truncate">{account.name}</p>
                        <p className="text-[10px] text-surface-500 truncate">{account.email}</p>
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setShowChooser(false)
                      setShowCustom(true)
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-surface-800 hover:border-surface-700 text-left hover:bg-white/[0.02] transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
                      <Plus size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">Use another account</p>
                      <p className="text-[10px] text-surface-500">Sign in with custom info</p>
                    </div>
                  </button>
                </div>
                
                <div className="pt-2 border-t border-surface-800">
                  <button
                    onClick={() => {
                      setShowChooser(false)
                    }}
                    className="w-full py-2 text-xs text-surface-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleClick}
                  className="w-full flex items-center justify-center gap-3 h-12 bg-white hover:bg-white/95 text-surface-900 text-sm font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl duration-150"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </button>
                
                <div className="relative flex py-2 items-center text-surface-600">
                  <div className="flex-grow border-t border-surface-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider">or</span>
                  <div className="flex-grow border-t border-surface-800"></div>
                </div>

                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-surface-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      disabled
                      className="w-full h-10 bg-surface-950 border border-surface-800 rounded-xl px-3 text-xs text-surface-500 placeholder:text-surface-700 outline-none cursor-not-allowed"
                    />
                  </div>
                  <button
                    disabled
                    className="w-full h-10 bg-surface-800 text-surface-500 text-xs font-semibold rounded-xl cursor-not-allowed"
                  >
                    Continue with Email
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────── */
export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-x-hidden">
      <LandingNavbar onSignIn={() => setShowAuthModal(true)} />
      <Hero onSignIn={() => setShowAuthModal(true)} />
      <Features />
      <Workflow />
      <Testimonials />
      <FAQ />
      <CTABanner onSignIn={() => setShowAuthModal(true)} />
      <Footer />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
