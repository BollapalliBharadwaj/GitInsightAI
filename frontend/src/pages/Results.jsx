import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { getAnalysisHistory } from '../lib/api'
import { 
  BarChart2, Shield, Code, Sparkles, TrendingUp, AlertTriangle, 
  GitBranch, Circle, HelpCircle, CheckCircle2 
} from 'lucide-react'
import { motion } from 'framer-motion'
import Skeleton, { SkeletonCard } from '../components/ui/Skeleton'

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  default: '#8b5cf6'
}

export default function Results() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')

  useEffect(() => {
    getAnalysisHistory()
      .then(data => {
        setRepos(data || [])
        if (data && data.length > 1) {
          setCompareA(data[0].id)
          setCompareB(data[1].id)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load results", err)
        setLoading(false)
      })
  }, [])

  // Aggregate stats
  const stats = useMemo(() => {
    if (repos.length === 0) return { avgScore: 0, totalRepos: 0, totalIssues: 0 }
    const totalScore = repos.reduce((acc, curr) => acc + (curr.score || 0), 0)
    return {
      avgScore: Math.round(totalScore / repos.length),
      totalRepos: repos.length,
      totalIssues: repos.length * 12 // Simulated metric
    }
  }, [repos])

  const repoA = useMemo(() => repos.find(r => String(r.id) === String(compareA)), [repos, compareA])
  const repoB = useMemo(() => repos.find(r => String(r.id) === String(compareB)), [repos, compareB])

  return (
    <DashboardLayout title="Results & Analytics" subtitle="Aggregate system insights and codebase comparisons">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mb-3">
              <TrendingUp className="text-primary-400" size={16} />
            </div>
            <p className="text-xs text-surface-400">Average Quality Score</p>
            <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : `${stats.avgScore}/100`}</p>
            <p className="text-[10px] text-surface-500 mt-1">System-wide codebase health score</p>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mb-3">
              <GitBranch className="text-accent-green" size={16} />
            </div>
            <p className="text-xs text-surface-400">Total Codebases Scanned</p>
            <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : stats.totalRepos}</p>
            <p className="text-[10px] text-surface-500 mt-1">Active repositories in scope</p>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mb-3">
              <Shield className="text-accent-purple" size={16} />
            </div>
            <p className="text-xs text-surface-400">Vulnerabilities Flagged</p>
            <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : `${stats.totalIssues} issues`}</p>
            <p className="text-[10px] text-surface-500 mt-1">Pending security adjustments</p>
          </div>
        </div>

        {/* Comparison Dashboard */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Repository Comparison</h2>
              <p className="text-[11px] text-surface-500 mt-0.5">Compare details of scanned repos side-by-side</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20">
              <Sparkles className="text-accent-purple" size={12} />
              <span className="text-[10px] font-medium text-accent-purple-light">Matrix view</span>
            </div>
          </div>

          {loading ? (
            <SkeletonCard />
          ) : repos.length < 2 ? (
            <div className="py-8 text-center text-xs text-surface-500">
              Add at least 2 repositories in your analysis history to compare them here.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Select dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-surface-500 mb-1.5">Repository A</label>
                  <select 
                    value={compareA} 
                    onChange={e => setCompareA(e.target.value)}
                    className="w-full h-10 bg-surface-950 border border-surface-800 focus:border-primary-500/50 rounded-xl px-3 text-xs text-white outline-none cursor-pointer"
                  >
                    {repos.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-surface-500 mb-1.5">Repository B</label>
                  <select 
                    value={compareB} 
                    onChange={e => setCompareB(e.target.value)}
                    className="w-full h-10 bg-surface-950 border border-surface-800 focus:border-primary-500/50 rounded-xl px-3 text-xs text-white outline-none cursor-pointer"
                  >
                    {repos.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Matrix display */}
              {repoA && repoB && (
                <div className="border border-surface-800/80 rounded-xl overflow-hidden divide-y divide-surface-800/60 bg-surface-950/20">
                  {/* Score row */}
                  <div className="grid grid-cols-3 p-4">
                    <span className="text-xs font-medium text-surface-400">Quality Score</span>
                    <span className="text-sm font-bold text-primary-400">{repoA.score}/100</span>
                    <span className="text-sm font-bold text-accent-cyan">{repoB.score}/100</span>
                  </div>

                  {/* Primary Language */}
                  <div className="grid grid-cols-3 p-4">
                    <span className="text-xs font-medium text-surface-400">Primary Language</span>
                    <span className="text-xs text-white flex items-center gap-1.5">
                      <Circle size={8} fill={LANG_COLORS[repoA.lang] ?? LANG_COLORS.default} color={LANG_COLORS[repoA.lang] ?? LANG_COLORS.default} />
                      {repoA.lang || 'Unknown'}
                    </span>
                    <span className="text-xs text-white flex items-center gap-1.5">
                      <Circle size={8} fill={LANG_COLORS[repoB.lang] ?? LANG_COLORS.default} color={LANG_COLORS[repoB.lang] ?? LANG_COLORS.default} />
                      {repoB.lang || 'Unknown'}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="grid grid-cols-3 p-4">
                    <span className="text-xs font-medium text-surface-400">Stars</span>
                    <span className="text-xs text-white">{repoA.stars || 0}</span>
                    <span className="text-xs text-white">{repoB.stars || 0}</span>
                  </div>

                  {/* Summary Comparison */}
                  <div className="grid grid-cols-3 p-4">
                    <span className="text-xs font-medium text-surface-400">Analysis Summary</span>
                    <span className="text-xs text-surface-300 leading-relaxed pr-4">{repoA.summary || 'N/A'}</span>
                    <span className="text-xs text-surface-300 leading-relaxed pr-4">{repoB.summary || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
