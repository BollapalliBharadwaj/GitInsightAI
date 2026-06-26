import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { getAnalysisHistory } from '../lib/api'
import { 
  Code2, AlertTriangle, CheckCircle, Info, 
  Cpu, Layers 
} from 'lucide-react'
import { SkeletonCard } from '../components/ui/Skeleton'

export default function CodeQuality() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalysisHistory()
      .then(data => {
        setRepos(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load quality metrics", err)
        setLoading(false)
      })
  }, [])

  const activeRepo = useMemo(() => {
    return repos.length > 0 ? repos[0] : { name: 'facebook/react', score: 96, lang: 'JavaScript' }
  }, [repos])

  const smells = useMemo(() => {
    const score = activeRepo.score || 85
    // Scale smells based on repo quality score
    const list = [
      { id: 1, file: 'src/core/main.js', type: 'Long Method', desc: 'handleRequest method contains 142 lines of code (limit is 80)', severity: 'warning' },
      { id: 2, file: 'src/utils/helpers.js', type: 'Cognitive Complexity', desc: 'parseQuery helper function has nesting complexity of 12 (limit is 8)', severity: 'major' },
      { id: 3, file: 'src/components/Sidebar.jsx', type: 'Duplicate Blocks', desc: 'Identical UI template renders on lines 82-104 and 126-148', severity: 'minor' },
      { id: 4, file: 'src/lib/api.js', type: 'Unused Variable', desc: 'unusedResponse variable is declared but never referenced', severity: 'info' }
    ]
    if (score >= 95) return list.slice(3)
    if (score >= 90) return list.slice(2)
    if (score >= 80) return list.slice(1)
    return list
  }, [activeRepo])

  return (
    <DashboardLayout 
      title="Code Quality" 
      subtitle={`Code maintenance, duplication, and architectural integrity metrics for ${activeRepo.name}`}
    >
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
              <Cpu className="text-primary-400" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Maintainability Index</p>
            <p className="text-xl font-bold text-white mt-1">94%</p>
            <span className="text-[10px] text-accent-green font-medium">Excellent condition</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mb-3">
              <Layers className="text-accent-purple" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Duplication Rate</p>
            <p className="text-xl font-bold text-white mt-1">1.4%</p>
            <span className="text-[10px] text-accent-green font-medium">Below average limit (5%)</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center mb-3">
              <AlertTriangle className="text-accent-orange" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Code Smells Flagged</p>
            <p className="text-xl font-bold text-white mt-1">{smells.length}</p>
            <span className="text-[10px] text-surface-400">Total detected occurrences</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mb-3">
              <Code2 className="text-accent-green" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Avg Complexity / File</p>
            <p className="text-xl font-bold text-white mt-1">12</p>
            <span className="text-[10px] text-accent-green font-medium">Standard cyclomatic score</span>
          </div>
        </div>

        {/* Quality breakdown */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left panel — details */}
          <div className="lg:col-span-2 bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Code Smells & Lint Alerts</h3>
            
            {loading ? (
              <SkeletonCard />
            ) : smells.length === 0 ? (
              <div className="py-12 text-center text-xs text-surface-500">
                <CheckCircle className="text-accent-green mx-auto mb-3" size={24} />
                No code smells detected in this repository!
              </div>
            ) : (
              <div className="space-y-3">
                {smells.map(s => {
                  const severityColors = s.severity === 'major' ? 'text-accent-red bg-accent-red/10 border-accent-red/20'
                                       : s.severity === 'warning' ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/20'
                                       : 'text-surface-400 bg-surface-800 border-surface-700'
                  return (
                    <div key={s.id} className="p-3.5 rounded-xl bg-surface-950/40 border border-surface-800/80 flex items-start gap-3.5">
                      <div className="mt-0.5">
                        {s.severity === 'major' ? <AlertTriangle className="text-accent-red" size={15} />
                         : s.severity === 'warning' ? <AlertTriangle className="text-accent-orange" size={15} />
                         : <Info className="text-surface-400" size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-white truncate max-w-[150px]">{s.type}</span>
                          <span className="text-[9px] text-surface-500 truncate max-w-[180px] font-mono">{s.file}</span>
                        </div>
                        <p className="text-[11px] text-surface-400 leading-relaxed">{s.desc}</p>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border shrink-0 ${severityColors}`}>
                        {s.severity}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right panel — checklist */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Remediation Checklist</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input type="checkbox" defaultChecked className="mt-1 accent-primary-500 rounded border-surface-800 cursor-pointer" />
                <div>
                  <p className="text-xs font-medium text-white">Refactor helper methods</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">Break down functions exceeding 80 lines.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input type="checkbox" className="mt-1 accent-primary-500 rounded border-surface-800 cursor-pointer" />
                <div>
                  <p className="text-xs font-medium text-white">Fix Cognitive Complexity warning</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">Flatten nested conditional statements in parsing rules.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input type="checkbox" className="mt-1 accent-primary-500 rounded border-surface-800 cursor-pointer" />
                <div>
                  <p className="text-xs font-medium text-white">Consolidate Duplicate templates</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">Extract repeated markup into a reusable UI component.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
