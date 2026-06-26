import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { getAnalysisHistory } from '../lib/api'
import { 
  BookOpen, Sparkles, AlertCircle, 
  Compass, Terminal 
} from 'lucide-react'
import { SkeletonCard } from '../components/ui/Skeleton'

export default function Documentation() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalysisHistory()
      .then(data => {
        setRepos(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load documentation metrics", err)
        setLoading(false)
      })
  }, [])

  const activeRepo = useMemo(() => {
    return repos.length > 0 ? repos[0] : { name: 'facebook/react', score: 96, lang: 'JavaScript' }
  }, [repos])

  const questions = useMemo(() => {
    const lang = activeRepo.lang || 'JavaScript'
    if (lang === 'Python') {
      return [
        { q: "How is the local database connection managed in this FastAPI configuration?", a: "The lifecycle of the sqlite connection is managed by contextlib's asynccontextmanager in app/main.py, running init_database on startup and closing it on shutdown." },
        { q: "What caching algorithm is utilized for rate-limiting calls?", a: "An in-memory TTL Cache is created inside core/cache.py and imported into services/github.py to throttle Github API queries." }
      ]
    }
    return [
      { q: "How does the layout shell pass the session credentials to subpages?", a: "The DashboardLayout reads the session from localStorage on load and injects the user details down into DashSidebar and DashTopbar as react properties." },
      { q: "What states trigger the loading skeletons on this screen?", a: "Skeletons are managed by loading and loadingHistory parameters inside Dashboard.jsx, which toggle custom shimmer card and table states." }
    ]
  }, [activeRepo])

  return (
    <DashboardLayout 
      title="Documentation" 
      subtitle={`README coverage, code comment densities, and developer guides for ${activeRepo.name}`}
    >
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
              <BookOpen className="text-primary-400" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Docstring Coverage</p>
            <p className="text-xl font-bold text-white mt-1">78%</p>
            <span className="text-[10px] text-accent-green font-medium">Above average limit (70%)</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mb-3">
              <Compass className="text-accent-green" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">README Readability</p>
            <p className="text-xl font-bold text-white mt-1">Grade A</p>
            <span className="text-[10px] text-accent-green font-medium">Onboarding instructions present</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mb-3">
              <Terminal className="text-accent-purple" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Inline Comments</p>
            <p className="text-xl font-bold text-white mt-1">1,248 lines</p>
            <span className="text-[10px] text-surface-400">12% comment ratio</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center mb-3">
              <AlertCircle className="text-accent-orange" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Undocumented Files</p>
            <p className="text-xl font-bold text-white mt-1">4 files</p>
            <span className="text-[10px] text-accent-orange font-medium">Docstrings missing</span>
          </div>
        </div>

        {/* AI onboarding guide */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">AI Developer Onboarding Q&A</h2>
              <p className="text-[11px] text-surface-500 mt-0.5">Custom questions generated by the AI agent to help onboard new developers</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
              <Sparkles className="text-primary-400" size={12} />
              <span className="text-[10px] font-medium text-primary-300">Generated guide</span>
            </div>
          </div>

          {loading ? (
            <SkeletonCard />
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-surface-950/40 border border-surface-800/80 space-y-2 text-left">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary-600/10 border border-primary-500/30 flex items-center justify-center text-[10px] font-bold text-primary-400 shrink-0 mt-0.5">
                      Q
                    </div>
                    <h4 className="text-xs font-bold text-white leading-relaxed">{q.q}</h4>
                  </div>
                  <div className="flex items-start gap-2.5 pl-7">
                    <p className="text-xs text-surface-400 leading-relaxed">{q.a}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
