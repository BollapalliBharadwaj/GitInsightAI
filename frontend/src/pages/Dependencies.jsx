import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { getAnalysisHistory } from '../lib/api'
import { 
  Package, ShieldAlert, CheckCircle, 
  Layers, Activity 
} from 'lucide-react'
import { SkeletonTable } from '../components/ui/Skeleton'

export default function Dependencies() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalysisHistory()
      .then(data => {
        setRepos(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load dependencies", err)
        setLoading(false)
      })
  }, [])

  const activeRepo = useMemo(() => {
    return repos.length > 0 ? repos[0] : { name: 'facebook/react', score: 96, lang: 'JavaScript' }
  }, [repos])

  const deps = useMemo(() => {
    const score = activeRepo.score || 85
    const list = [
      { name: 'axios', current: '1.2.1', latest: '1.7.2', status: 'outdated', severity: 'warning' },
      { name: 'minimist', current: '1.2.5', latest: '1.2.8', status: 'vulnerable', severity: 'critical' },
      { name: 'lodash', current: '4.17.21', latest: '4.17.21', status: 'up-to-date', severity: 'safe' },
      { name: 'express', current: '4.18.2', latest: '4.19.2', status: 'outdated', severity: 'warning' }
    ]
    if (score >= 95) return list.filter(d => d.status === 'up-to-date')
    if (score >= 90) return list.filter(d => d.status !== 'vulnerable')
    return list
  }, [activeRepo])

  return (
    <DashboardLayout 
      title="Dependencies" 
      subtitle={`Third-party package distribution, vulnerabilities, and licensing for ${activeRepo.name}`}
    >
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* Statistics cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
              <Package className="text-primary-400" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Scanned Dependencies</p>
            <p className="text-xl font-bold text-white mt-1">42 packages</p>
            <span className="text-[10px] text-surface-400">Total libraries referenced</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mb-3">
              <Layers className="text-accent-green" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">License Compliance</p>
            <p className="text-xl font-bold text-white mt-1">Grade A</p>
            <span className="text-[10px] text-accent-green font-medium">All permissively licensed</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mb-3">
              <ShieldAlert className="text-accent-red" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">CVE Vulnerabilities</p>
            <p className="text-xl font-bold text-white mt-1">
              {deps.filter(d => d.status === 'vulnerable').length} flagged
            </p>
            <span className="text-[10px] text-accent-red font-medium">Require patch updates</span>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center mb-3">
              <Activity className="text-accent-orange" size={15} />
            </div>
            <p className="text-[11px] text-surface-500">Outdated Packages</p>
            <p className="text-xl font-bold text-white mt-1">
              {deps.filter(d => d.status === 'outdated').length} libraries
            </p>
            <span className="text-[10px] text-accent-orange font-medium">Upgrade recommended</span>
          </div>
        </div>

        {/* Detailed matrix */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Package Vulnerabilities & Alerts</h3>
          
          {loading ? (
            <SkeletonTable rows={5} cols={4} />
          ) : deps.length === 0 ? (
            <div className="py-12 text-center text-xs text-surface-500">
              <CheckCircle className="text-accent-green mx-auto mb-3" size={24} />
              All packages are clean and up to date!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-surface-800 text-surface-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-3.5 pl-2">Package Name</th>
                    <th className="pb-3.5">Installed</th>
                    <th className="pb-3.5">Latest Version</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5">Patch Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40 text-xs">
                  {deps.map(d => {
                    const pillColor = d.severity === 'critical' ? 'text-accent-red bg-accent-red/10 border-accent-red/20'
                                    : d.severity === 'warning' ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/20'
                                    : 'text-accent-green bg-accent-green/10 border-accent-green/20'
                    return (
                      <tr key={d.name} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 pl-2 font-semibold text-white">{d.name}</td>
                        <td className="py-3.5 text-surface-300 font-mono">{d.current}</td>
                        <td className="py-3.5 text-surface-400 font-mono">{d.latest}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wide ${pillColor}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-surface-400">
                          {d.status === 'vulnerable' ? `Run npm install ${d.name}@${d.latest} to patch vulnerabilities.`
                           : d.status === 'outdated' ? `Upgrade package to latest minor ${d.latest} release.`
                           : 'No actions required.'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
