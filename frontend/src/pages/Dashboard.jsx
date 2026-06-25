/**
 * Dashboard — Main overview page for GitInsight AI.
 *
 * Sections:
 *  1. Stat Cards         — 4 KPI metrics
 *  2. Search Bar         — filter repos inline
 *  3. Recent Repositories— table with badges, scores, actions
 *  4. Analysis Cards     — last 3 deep-analysis cards
 *  5. Charts Row         — Score Over Time + Language Distribution + Issue Breakdown
 *  6. Loading Skeleton   — toggleable via top button
 *
 * No backend — all data is mock/static.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnalysisHistory } from '../lib/api'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Shield, Package, BookOpen, Search, GitBranch,
  Star, GitFork, Eye, Clock, ArrowRight, Zap, Code2,
  BarChart2, CheckCircle, AlertTriangle, XCircle, ExternalLink,
  RefreshCw, Filter, ChevronDown, Circle,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import Skeleton, {
  SkeletonCard, SkeletonStatRow, SkeletonTable, SkeletonText,
} from '../components/ui/Skeleton'

/* ── Animation helpers ───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } })

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'}
      transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════ */
const MOCK_REPOS = [
  { id: 1, name: 'facebook/react',        lang: 'JavaScript', stars: '228k', forks: '46k',  score: 96, status: 'success', issues: 2,  lastRun: '2 min ago',  views: '12k' },
  { id: 2, name: 'microsoft/vscode',      lang: 'TypeScript', stars: '165k', forks: '29k',  score: 91, status: 'success', issues: 7,  lastRun: '18 min ago', views: '8k'  },
  { id: 3, name: 'vuejs/vue',             lang: 'JavaScript', stars: '207k', forks: '33k',  score: 88, status: 'warning', issues: 14, lastRun: '1 hr ago',   views: '6k'  },
  { id: 4, name: 'torvalds/linux',        lang: 'C',          stars: '186k', forks: '52k',  score: 82, status: 'warning', issues: 21, lastRun: '3 hr ago',   views: '4k'  },
  { id: 5, name: 'tensorflow/tensorflow', lang: 'Python',     stars: '185k', forks: '74k',  score: 79, status: 'warning', issues: 31, lastRun: '6 hr ago',   views: '9k'  },
  { id: 6, name: 'golang/go',             lang: 'Go',         stars: '123k', forks: '17k',  score: 71, status: 'error',   issues: 44, lastRun: '1 day ago',  views: '3k'  },
  { id: 7, name: 'rust-lang/rust',        lang: 'Rust',       stars: '99k',  forks: '13k',  score: 94, status: 'success', issues: 3,  lastRun: '2 days ago', views: '5k'  },
  { id: 8, name: 'django/django',         lang: 'Python',     stars: '79k',  forks: '32k',  score: 87, status: 'success', issues: 8,  lastRun: '2 days ago', views: '2k'  },
]

const ANALYSIS_CARDS_DATA = [
  {
    id: 1, repo: 'facebook/react', lang: 'JavaScript', score: 96, trend: '+3',
    metrics: [
      { label: 'Code Quality',  value: 97, color: 'bg-primary-500',    icon: Code2  },
      { label: 'Security',      value: 98, color: 'bg-accent-green',   icon: Shield },
      { label: 'Dependencies',  value: 92, color: 'bg-accent-purple',  icon: Package },
      { label: 'Documentation', value: 95, color: 'bg-accent-cyan',    icon: BookOpen },
    ],
    summary: 'Excellent code quality with strong test coverage. 2 minor dependency updates available.',
    analyzedAt: '2 min ago',
  },
  {
    id: 2, repo: 'microsoft/vscode', lang: 'TypeScript', score: 91, trend: '+1',
    metrics: [
      { label: 'Code Quality',  value: 93, color: 'bg-primary-500',    icon: Code2  },
      { label: 'Security',      value: 95, color: 'bg-accent-green',   icon: Shield },
      { label: 'Dependencies',  value: 84, color: 'bg-accent-orange',  icon: Package },
      { label: 'Documentation', value: 88, color: 'bg-accent-cyan',    icon: BookOpen },
    ],
    summary: '7 outdated dependencies found. Architecture is clean but docs coverage can improve.',
    analyzedAt: '18 min ago',
  },
  {
    id: 3, repo: 'vuejs/vue', lang: 'JavaScript', score: 88, trend: '-2',
    metrics: [
      { label: 'Code Quality',  value: 88, color: 'bg-primary-500',    icon: Code2  },
      { label: 'Security',      value: 82, color: 'bg-accent-orange',  icon: Shield },
      { label: 'Dependencies',  value: 79, color: 'bg-accent-red',     icon: Package },
      { label: 'Documentation', value: 91, color: 'bg-accent-cyan',    icon: BookOpen },
    ],
    summary: '14 issues detected. 3 dependencies have known CVEs. Security posture needs attention.',
    analyzedAt: '1 hr ago',
  },
]

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python:     '#3572a5',
  C:          '#555555',
  Go:         '#00add8',
  Rust:       '#dea584',
  default:    '#8b5cf6',
}

/* ══════════════════════════════════════════════
   1. STAT CARDS
══════════════════════════════════════════════ */
const STATS = [
  { label: 'Repos Analyzed',  value: '2,847', change: '+124 this week', icon: GitBranch, color: 'from-primary-600 to-primary-800',   glow: 'shadow-glow-blue'   },
  { label: 'Avg Quality Score',value: '84.2',  change: '↑ 2.1 pts vs last month', icon: TrendingUp, color: 'from-accent-purple to-purple-800', glow: 'shadow-glow-purple' },
  { label: 'Issues Detected',  value: '18,403',change: '↓ 1,204 resolved this week', icon: AlertTriangle, color: 'from-accent-orange to-orange-800', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]' },
  { label: 'CVEs Found',       value: '342',   change: '39 critical this month', icon: Shield, color: 'from-accent-red to-red-800',   glow: 'shadow-glow-red'   },
]

function StatCards({ loading }) {
  if (loading) return <SkeletonStatRow count={4} />
  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="show"
      className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {STATS.map((s, i) => (
        <motion.div key={s.label} variants={fadeUp}
          className="relative bg-surface-900 border border-surface-800 rounded-2xl p-5 overflow-hidden group hover:border-surface-700 transition-colors duration-200">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 ${s.glow}`}>
            <s.icon size={18} className="text-white" />
          </div>
          <p className="text-xs text-surface-400 mb-1">{s.label}</p>
          <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
          <p className="text-[11px] text-surface-500">{s.change}</p>
          {/* Subtle gradient bg */}
          <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br ${s.color} opacity-[0.06] rounded-full blur-2xl`} />
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════
   2 & 3. SEARCH + RECENT REPOS TABLE
══════════════════════════════════════════════ */
function ScorePill({ score }) {
  const color = score >= 90 ? 'text-accent-green bg-accent-green/10 border-accent-green/20'
              : score >= 75 ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/20'
              : 'text-accent-red bg-accent-red/10 border-accent-red/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-semibold tabular-nums ${color}`}>
      {score}
    </span>
  )
}

function StatusDot({ status }) {
  const map = {
    success: 'bg-accent-green',
    warning: 'bg-accent-orange',
    error:   'bg-accent-red',
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${map[status] ?? 'bg-surface-600'}`} />
  )
}

function RecentRepos({ repos = [], loading }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [filterLang, setFilterLang] = useState('All')
  const navigate = useNavigate()

  const LANGS = ['All', 'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'C']

  const getRepoUrl = (repo) => {
    return repo.url || `https://github.com/${repo.name}`
  }

  const handleRowClick = (repo) => {
    const url = getRepoUrl(repo)
    navigate(`/explorer?url=${encodeURIComponent(url)}`)
  }

  const handleExternalClick = (e, repo) => {
    e.stopPropagation()
    const url = getRepoUrl(repo)
    window.open(url, '_blank')
  }

  const filtered = useMemo(() => {
    let list = repos && repos.length > 0 ? repos : MOCK_REPOS
    if (search)             list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    if (filterLang !== 'All') list = list.filter(r => r.lang === filterLang)
    return [...list].sort((a, b) => sortBy === 'score' ? b.score - a.score : b.issues - (a.issues || 0))
  }, [repos, search, sortBy, filterLang])

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
      {/* Table header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-surface-800">
        <div>
          <h2 className="text-sm font-semibold text-white">Recent Repositories</h2>
          <p className="text-[11px] text-surface-500 mt-0.5">{filtered.length} repositories</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 sm:w-52 h-8 bg-surface-800 border border-surface-700 rounded-xl px-3">
            <Search size={12} className="text-surface-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter repos..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-surface-500 outline-none" />
          </div>

          {/* Language filter */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 h-8 px-3 bg-surface-800 border border-surface-700 rounded-xl text-xs text-surface-300 hover:text-white transition-colors">
              <Filter size={11} />
              {filterLang}
              <ChevronDown size={11} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface-800 border border-surface-700 rounded-xl shadow-modal overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
              {LANGS.map(l => (
                <button key={l} onClick={() => setFilterLang(l)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${filterLang === l ? 'text-primary-400 bg-primary-500/10' : 'text-surface-300 hover:text-white hover:bg-white/[0.05]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortBy(s => s === 'score' ? 'issues' : 'score')}
            className="flex items-center gap-1.5 h-8 px-3 bg-surface-800 border border-surface-700 rounded-xl text-xs text-surface-300 hover:text-white transition-colors"
          >
            Sort: {sortBy === 'score' ? 'Score ↓' : 'Issues ↓'}
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                {['Repository', 'Language', 'Stars', 'Score', 'Issues', 'Last Run', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((repo, i) => (
                  <motion.tr
                    key={repo.id || repo.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleRowClick(repo)}
                    className="border-b border-surface-800/50 last:border-none hover:bg-white/[0.025] transition-colors group cursor-pointer"
                  >
                    {/* Repo name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <StatusDot status={repo.status || (repo.score >= 90 ? 'success' : repo.score >= 75 ? 'warning' : 'error')} />
                        <span className="text-sm font-medium text-white truncate max-w-[160px]">{repo.name}</span>
                      </div>
                    </td>
                    {/* Language */}
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs text-surface-300">
                        <Circle size={8} fill={LANG_COLORS[repo.lang] ?? LANG_COLORS.default}
                          color={LANG_COLORS[repo.lang] ?? LANG_COLORS.default} />
                        {repo.lang}
                      </span>
                    </td>
                    {/* Stars */}
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-surface-400">
                        <Star size={11} /> {typeof repo.stars === 'number' ? repo.stars.toLocaleString() : repo.stars}
                      </span>
                    </td>
                    {/* Score */}
                    <td className="px-5 py-3.5"><ScorePill score={repo.score} /></td>
                    {/* Issues */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${repo.issues > 20 ? 'text-accent-red' : repo.issues > 8 ? 'text-accent-orange' : 'text-accent-green'}`}>
                        {repo.issues || 0} issue{repo.issues !== 1 ? 's' : ''}
                      </span>
                    </td>
                    {/* Last run */}
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-surface-500">
                        <Clock size={11} /> {repo.lastRun}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRowClick(repo); }}
                          className="h-7 px-2.5 rounded-lg bg-primary-600/20 hover:bg-primary-600 border border-primary-600/30 text-primary-300 hover:text-white text-[11px] font-medium transition-all flex items-center gap-1"
                        >
                          <RefreshCw size={10} /> Re-run
                        </button>
                        <button 
                          onClick={(e) => handleExternalClick(e, repo)}
                          className="h-7 w-7 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-400 hover:text-white transition-all flex items-center justify-center"
                        >
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Search size={28} className="text-surface-700 mx-auto mb-3" />
              <p className="text-sm text-surface-500">No repositories match your filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   4. ANALYSIS DETAIL CARDS
══════════════════════════════════════════════ */
function MiniProgressBar({ value, color }) {
  return (
    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  )
}

function AnalysisCard({ repo, lang, score, trend, metrics, summary, analyzedAt, url, loading }) {
  if (loading) return <SkeletonCard />
  const trendUp = trend.startsWith('+')
  const navigate = useNavigate()

  const handleFullReport = () => {
    const targetUrl = url || `https://github.com/${repo}`
    navigate(`/explorer?url=${encodeURIComponent(targetUrl)}`)
  }

  return (
    <motion.div variants={fadeUp}
      className="bg-surface-900 border border-surface-800 rounded-2xl p-5 hover:border-surface-700 transition-colors duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
            <GitBranch size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-[140px]">{repo}</p>
            <p className="text-[10px] text-surface-500">{lang}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{score}</p>
          <p className={`text-[11px] font-medium ${trendUp ? 'text-accent-green' : 'text-accent-red'}`}>
            {trend} pts
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5 mb-4">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[11px] text-surface-400">
                <m.icon size={11} />
                {m.label}
              </span>
              <span className="text-[11px] font-semibold text-white tabular-nums">{m.value}</span>
            </div>
            <MiniProgressBar value={m.value} color={m.color} />
          </div>
        ))}
      </div>

      {/* Summary */}
      <p className="text-[11px] text-surface-400 leading-relaxed mb-4 border-t border-surface-800 pt-3">
        {summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-surface-600">
          <Clock size={10} /> {analyzedAt}
        </span>
        <button 
          onClick={handleFullReport}
          className="flex items-center gap-1 text-[11px] text-primary-400 hover:text-primary-300 transition-colors"
        >
          Full report <ArrowRight size={10} />
        </button>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════
   5. CHART PLACEHOLDERS
══════════════════════════════════════════════ */

/* Score trend — bar chart placeholder */
function ScoreTrendChart() {
  const bars = [72, 78, 75, 82, 80, 86, 84, 88, 84, 91, 89, 94]
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Score Trend</h3>
        <span className="text-[10px] text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded-lg font-medium">↑ 22 pts / 12mo</span>
      </div>
      <p className="text-[11px] text-surface-500 mb-5">Average quality score across all analyzed repos</p>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-32">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(h / 100) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              className={`w-full rounded-t-md ${i === bars.length - 1 ? 'bg-primary-500' : 'bg-surface-700'}`}
              style={{ minHeight: 4 }}
            />
            {(i === 0 || i === 5 || i === 11) && (
              <span className="text-[9px] text-surface-600">{months[i]}</span>
            )}
          </div>
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="flex justify-between mt-2 text-[9px] text-surface-600">
        <span>60</span><span>70</span><span>80</span><span>90</span><span>100</span>
      </div>
    </div>
  )
}

/* Language distribution — donut-like ring chart */
function LanguageChart() {
  const langs = [
    { label: 'JavaScript', pct: 38, color: '#f7df1e' },
    { label: 'Python',     pct: 24, color: '#3572a5' },
    { label: 'TypeScript', pct: 18, color: '#3178c6' },
    { label: 'Go',         pct: 10, color: '#00add8' },
    { label: 'Rust',       pct: 6,  color: '#dea584' },
    { label: 'Other',      pct: 4,  color: '#64748b' },
  ]

  // Build conic-gradient stops
  let cursor = 0
  const stops = langs.map(l => {
    const from = cursor
    cursor += l.pct
    return `${l.color} ${from}% ${cursor}%`
  }).join(', ')

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Language Distribution</h3>
      <p className="text-[11px] text-surface-500 mb-5">Top languages across analyzed repositories</p>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
          <div className="absolute inset-3 rounded-full bg-surface-900 flex items-center justify-center">
            <span className="text-[10px] text-surface-400 text-center leading-tight">2,847<br/>repos</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {langs.map(l => (
            <div key={l.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
                <span className="text-[11px] text-surface-300">{l.label}</span>
              </div>
              <span className="text-[11px] font-semibold text-white tabular-nums">{l.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Issue breakdown — horizontal bar chart */
function IssueBreakdown() {
  const categories = [
    { label: 'Dependency CVEs',   count: 342,  color: 'bg-accent-red',     icon: XCircle },
    { label: 'Security Warnings', count: 1204, color: 'bg-accent-orange',  icon: AlertTriangle },
    { label: 'Code Smells',       count: 8941, color: 'bg-accent-purple',  icon: Code2 },
    { label: 'Outdated Packages', count: 2847, color: 'bg-primary-500',    icon: Package },
    { label: 'Missing Docs',      count: 5069, color: 'bg-accent-cyan',    icon: BookOpen },
  ]
  const max = Math.max(...categories.map(c => c.count))

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Issue Breakdown</h3>
      <p className="text-[11px] text-surface-500 mb-5">Total issues by category across all repos</p>

      <div className="space-y-3.5">
        {categories.map((c, i) => (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-surface-300">
                <c.icon size={11} />
                {c.label}
              </span>
              <span className="text-[11px] font-semibold text-white tabular-nums">{c.count.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(c.count / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                className={`h-full ${c.color} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD PAGE
══════════════════════════════════════════════ */
export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    getAnalysisHistory()
      .then(data => {
        if (data && data.length > 0) {
          setRepos(data)
        } else {
          setRepos(MOCK_REPOS)
        }
        setLoadingHistory(false)
      })
      .catch(err => {
        console.error("Failed to load history, using fallback mock repos", err)
        setRepos(MOCK_REPOS)
        setLoadingHistory(false)
      })
  }, [])

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  const handleToggleSkeleton = () => {
    if (!loading) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 2000)
    } else {
      setLoading(false)
    }
  }

  const getMetrics = (score) => [
    { label: 'Code Quality',  value: Math.min(100, Math.max(0, score + 2)), color: 'bg-primary-500',    icon: Code2  },
    { label: 'Security',      value: score,                                 color: 'bg-accent-green',   icon: Shield },
    { label: 'Dependencies',  value: Math.min(100, Math.max(0, score - 6)), color: 'bg-accent-purple',  icon: Package },
    { label: 'Documentation', value: Math.min(100, Math.max(0, score - 2)), color: 'bg-accent-cyan',    icon: BookOpen },
  ]

  const latestAnalysisCards = useMemo(() => {
    const list = repos && repos.length > 0 ? repos : MOCK_REPOS
    return list.slice(0, 3).map((r, i) => {
      const score = typeof r.score === 'number' ? r.score : 85
      return {
        id: r.id || r.analysis_id || i,
        repo: r.name,
        lang: r.lang || 'JavaScript',
        score: score,
        trend: score >= 90 ? '+2' : score >= 80 ? '+1' : '-1',
        metrics: getMetrics(score),
        summary: r.summary || `Analysis completed successfully. Primary language is ${r.lang || 'JavaScript'}.`,
        analyzedAt: r.lastRun || 'Just now',
        url: r.url
      }
    })
  }, [repos])

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back, ${firstName} — here's your repository intelligence overview`}
    >
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

        {/* Loading toggle (dev helper) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-surface-500">Simulate load state:</span>
            <button
              onClick={handleToggleSkeleton}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${loading ? 'bg-primary-600' : 'bg-surface-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${loading ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-[11px] text-surface-600">Last updated: just now</p>
        </div>

        {/* ── 1. Stat Cards ── */}
        <Reveal>
          <StatCards loading={loading || loadingHistory} />
        </Reveal>

        {/* ── 2+3. Recent Repos ── */}
        <Reveal delay={0.05}>
          <RecentRepos repos={repos} loading={loading || loadingHistory} />
        </Reveal>

        {/* ── 4. Analysis Cards ── */}
        <Reveal delay={0.1}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Latest Analyses</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Detailed breakdown of most recent runs</p>
              </div>
              <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>

            <motion.div
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {loading
                ? [1,2,3].map(i => <SkeletonCard key={i} />)
                : latestAnalysisCards.map(card => <AnalysisCard key={card.id} {...card} />)
              }
            </motion.div>
          </div>
        </Reveal>

        {/* ── 5. Charts Row ── */}
        <Reveal delay={0.12}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Analytics</h2>
                <p className="text-[11px] text-surface-500 mt-0.5">Trends and distribution across all analyses</p>
              </div>
            </div>

            {loading ? (
              <div className="grid lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
                    <Skeleton width="w-1/3" height="h-4" className="mb-2" />
                    <Skeleton width="w-1/2" height="h-3" className="mb-5" />
                    <Skeleton width="w-full" height="h-32" rounded="rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-4">
                <ScoreTrendChart />
                <LanguageChart />
                <IssueBreakdown />
              </div>
            )}
          </div>
        </Reveal>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </DashboardLayout>
  )
}
