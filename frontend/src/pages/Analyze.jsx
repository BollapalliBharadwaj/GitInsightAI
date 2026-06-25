import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { GitBranch, Search, Sparkles, ChevronRight, Loader } from 'lucide-react'

export default function Analyze() {
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleAnalyze = (targetUrl) => {
    const finalUrl = targetUrl || url
    if (finalUrl.trim()) {
      setSubmitting(true)
      setTimeout(() => {
        navigate(`/explorer?url=${encodeURIComponent(finalUrl.trim())}`)
      }, 1000)
    }
  }

  const SUGGESTED = [
    { name: 'facebook/react', desc: 'The library for web and native user interfaces', lang: 'JavaScript' },
    { name: 'vuejs/vue', desc: 'Progressive JavaScript Framework', lang: 'JavaScript' },
    { name: 'tensorflow/tensorflow', desc: 'An Open Source Machine Learning Framework for Everyone', lang: 'Python' },
    { name: 'golang/go', desc: 'The Go programming language repository', lang: 'Go' }
  ]

  return (
    <DashboardLayout title="Analyze" subtitle="Start a new multi-agent repository scan">
      <div className="p-6 max-w-4xl mx-auto flex flex-col justify-center min-h-[75vh]">
        <div className="relative bg-surface-900 border border-surface-800 rounded-3xl p-8 overflow-hidden shadow-modal">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-accent-purple to-accent-cyan" />
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
              <Search className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">New Repository Analysis</h2>
            <p className="text-xs text-surface-400 max-w-md mx-auto leading-relaxed">
              Enter any public GitHub URL to trigger complete repository profiling, security checks, and developer capability modeling.
            </p>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-surface-950 border border-surface-800 focus-within:border-primary-500/50 rounded-2xl px-4 py-3.5 transition-colors">
              <GitBranch size={18} className="text-surface-500 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="https://github.com/owner/repository"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-surface-600 outline-none"
                disabled={submitting}
              />
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={submitting || !url.trim()}
              className="w-full h-12 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-800 disabled:text-surface-500 text-white text-sm font-semibold rounded-2xl transition-all shadow-glow-blue hover:shadow-glow-blue-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin text-surface-400" />
                  <span>Initializing Agents...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Start Analysis</span>
                </>
              )}
            </button>

            <div className="pt-6 border-t border-surface-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3">Suggested repositories</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {SUGGESTED.map(s => (
                  <button
                    key={s.name}
                    disabled={submitting}
                    onClick={() => handleAnalyze(`https://github.com/${s.name}`)}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-950/40 hover:bg-white/[0.03] border border-surface-850 hover:border-surface-700 text-left transition-all duration-150 group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-primary-300 transition-colors">{s.name}</p>
                      <p className="text-[10px] text-surface-500 truncate max-w-[180px]">{s.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-surface-500 group-hover:text-white transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
