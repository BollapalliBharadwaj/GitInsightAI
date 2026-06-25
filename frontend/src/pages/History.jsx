import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { getAnalysisHistory } from '../lib/api'
import { 
  Search, Filter, ChevronDown, RefreshCw, ExternalLink, 
  Clock, Star, Circle, GitBranch, ArrowRight, Shield 
} from 'lucide-react'
import Skeleton, { SkeletonTable } from '../components/ui/Skeleton'

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  default: '#8b5cf6'
}

export default function History() {
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState('All')
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getAnalysisHistory()
      .then(data => {
        setRepos(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load history", err)
        setLoading(false)
      })
  }, [])

  const LANGS = useMemo(() => {
    const list = new Set(['All'])
    repos.forEach(r => {
      if (r.lang) list.add(r.lang)
    })
    return Array.from(list)
  }, [repos])

  const filtered = useMemo(() => {
    let list = repos
    if (search) {
      list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (filterLang !== 'All') {
      list = list.filter(r => r.lang === filterLang)
    }
    return list
  }, [repos, search, filterLang])

  return (
    <DashboardLayout title="History" subtitle="Review and comparison of all scanned codebases">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-900 border border-surface-800 p-4 rounded-2xl">
          <div>
            <h2 className="text-sm font-semibold text-white">Scan Log</h2>
            <p className="text-[11px] text-surface-500 mt-0.5">{filtered.length} analyses recorded</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 sm:w-60 h-9 bg-surface-800 border border-surface-700 rounded-xl px-3">
              <Search size={13} className="text-surface-500 shrink-0" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Search history..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-surface-500 outline-none" 
              />
            </div>
            
            {/* Language filter */}
            {LANGS.length > 1 && (
              <div className="relative group">
                <button className="flex items-center gap-1.5 h-9 px-3 bg-surface-800 border border-surface-700 rounded-xl text-xs text-surface-300 hover:text-white transition-colors">
                  <Filter size={12} />
                  {filterLang}
                  <ChevronDown size={12} />
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
            )}
          </div>
        </div>

        {/* History content */}
        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : filtered.length === 0 ? (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-12 text-center">
            <GitBranch className="text-surface-600 mx-auto mb-4" size={32} />
            <h3 className="text-sm font-semibold text-white mb-1">No Scans Recorded</h3>
            <p className="text-xs text-surface-500 max-w-sm mx-auto mb-6">
              You haven't run any repository analyses yet. Paste a GitHub URL to profile your first codebase.
            </p>
            <button 
              onClick={() => navigate('/dashboard/analyze')}
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl transition-all shadow-glow-blue"
            >
              Analyze a Repository
            </button>
          </div>
        ) : (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-800 bg-surface-950/20">
                    {['Repository', 'Language', 'Stars', 'Score', 'Status', 'Completed At', ''].map(h => (
                      <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40">
                  {filtered.map(repo => {
                    const score = repo.score || 85
                    const status = score >= 90 ? 'success' : score >= 75 ? 'warning' : 'error'
                    const statusColor = status === 'success' ? 'bg-accent-green text-accent-green' 
                                      : status === 'warning' ? 'bg-accent-orange text-accent-orange' 
                                      : 'bg-accent-red text-accent-red'
                    return (
                      <tr 
                        key={repo.analysis_id || repo.id}
                        className="hover:bg-white/[0.015] transition-colors group cursor-pointer"
                        onClick={() => navigate(`/explorer?url=${encodeURIComponent(repo.url)}`)}
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-white group-hover:text-primary-300 transition-colors">
                            {repo.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-surface-300">
                            <Circle size={8} fill={LANG_COLORS[repo.lang] ?? LANG_COLORS.default} color={LANG_COLORS[repo.lang] ?? LANG_COLORS.default} />
                            {repo.lang || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-surface-400">
                            {typeof repo.stars === 'number' ? repo.stars.toLocaleString() : repo.stars || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${
                            status === 'success' ? 'text-accent-green bg-accent-green/10 border-accent-green/20' 
                            : status === 'warning' ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/20' 
                            : 'text-accent-red bg-accent-red/10 border-accent-red/20'
                          }`}>
                            {score}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs capitalize">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-surface-500">
                            <Clock size={12} />
                            {repo.lastRun ? new Date(repo.lastRun).toLocaleString() : 'Just now'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/explorer?url=${encodeURIComponent(repo.url)}`)
                              }}
                              className="h-7 px-3 bg-primary-600/20 hover:bg-primary-600 border border-primary-600/30 text-primary-300 hover:text-white text-[11px] font-medium rounded-lg transition-all flex items-center gap-1"
                            >
                              View Report <ArrowRight size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
