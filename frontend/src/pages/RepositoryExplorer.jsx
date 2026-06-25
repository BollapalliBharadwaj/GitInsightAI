import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import {
  GitBranch, Star, GitFork, ArrowLeft, AlertTriangle, Code2, Users, FileText, Layout, Layers, Database, Cloud, Zap, ShieldCheck, Compass
} from 'lucide-react'

import DashboardLayout from '../layouts/DashboardLayout'
import FileTree from '../components/ui/FileTree'
import { analyzeRepository } from '../lib/api'
import Skeleton, { SkeletonText } from '../components/ui/Skeleton'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function RepositoryExplorer() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('readme')
  
  const url = searchParams.get('url')

  useEffect(() => {
    if (!url) {
      navigate('/dashboard')
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    analyzeRepository(url)
      .then(data => {
        if (isMounted) {
          setRepoData(data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { isMounted = false }
  }, [url, navigate])

  const renderHeader = () => {
    if (loading) {
      return (
        <div className="mb-8">
          <Skeleton width="w-64" height="h-8" className="mb-4" />
          <SkeletonText lines={2} />
        </div>
      )
    }
    if (error) return null

    return (
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-glow-blue">
              <GitBranch size={18} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {repoData.owner} <span className="text-surface-500 font-light">/</span> {repoData.repo}
            </h1>
          </div>
          <p className="text-surface-400 text-sm max-w-2xl leading-relaxed">
            {repoData.description || 'No description provided.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-800 rounded-xl">
            <Star size={14} className="text-accent-orange" />
            <span className="text-sm font-semibold text-white">{repoData.stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-800 rounded-xl">
            <GitFork size={14} className="text-primary-400" />
            <span className="text-sm font-semibold text-white">{repoData.forks.toLocaleString()}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderTechStack = () => {
    if (loading) return <Skeleton height="h-24" rounded="rounded-2xl" className="mb-6" />
    if (error || !repoData?.tech_stack) return null

    const stack = repoData.tech_stack
    const categories = [
      { id: 'frontend',   label: 'Frontend',   items: stack.frontend,   icon: Layout,     color: 'text-primary-400',   bg: 'bg-primary-400/10',   border: 'border-primary-400/20' },
      { id: 'backend',    label: 'Backend',    items: stack.backend,    icon: Layers,     color: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/20' },
      { id: 'database',   label: 'Database',   items: stack.database,   icon: Database,   color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20' },
      { id: 'deployment', label: 'Deployment', items: stack.deployment, icon: Cloud,      color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/20' },
      { id: 'testing',    label: 'Testing',    items: stack.testing,    icon: ShieldCheck,color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/20' },
      { id: 'cicd',       label: 'CI/CD',      items: stack.cicd,       icon: Zap,        color: 'text-yellow-400',    bg: 'bg-yellow-400/10',    border: 'border-yellow-400/20' },
    ]

    const activeCategories = categories.filter(c => c.items && c.items.length > 0)
    if (activeCategories.length === 0) return null

    return (
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Detected Tech Stack</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {activeCategories.map(cat => (
            <div key={cat.id}>
              <h4 className="flex items-center gap-1.5 text-[11px] font-medium text-surface-400 mb-2 uppercase tracking-wider">
                <cat.icon size={12} className={cat.color} />
                {cat.label}
              </h4>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(item => (
                  <span key={item} className={`px-2 py-1 text-[11px] font-medium rounded-lg border ${cat.color} ${cat.bg} ${cat.border}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLanguagesAndContributors = () => {
    if (loading) return <Skeleton height="h-32" rounded="rounded-2xl" className="mb-6" />
    if (error) return null

    const totalBytes = Object.values(repoData.languages).reduce((a, b) => a + b, 0)
    const topLangs = Object.entries(repoData.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return (
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Languages */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Code2 size={14} className="text-primary-400" />
            Languages
          </h3>
          {topLangs.length > 0 ? (
            <div className="space-y-3">
              {topLangs.map(([lang, bytes]) => {
                const pct = ((bytes / totalBytes) * 100).toFixed(1)
                return (
                  <div key={lang}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-300">{lang}</span>
                      <span className="text-white font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-surface-500">No language data available.</p>
          )}
        </div>

        {/* Contributors */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Users size={14} className="text-accent-cyan" />
            Top Contributors
          </h3>
          {repoData.contributors?.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {repoData.contributors.map(c => (
                <div key={c.login} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <img 
                    src={c.avatar_url} 
                    alt={c.login} 
                    className="w-10 h-10 rounded-full border border-surface-700 group-hover:border-primary-500 transition-colors"
                  />
                  <span className="text-[10px] text-surface-400 group-hover:text-white truncate max-w-[50px] text-center">
                    {c.login}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-surface-500">No contributor data available.</p>
          )}
        </div>
      </div>
    )
  }

  const renderIntelligenceHub = () => {
    if (loading) return <Skeleton height="h-96" rounded="rounded-2xl" />
    if (error) return null

    const tabs = [
      { id: 'readme', label: 'README.md', icon: FileText, content: repoData?.readme_content, fallback: 'No README found for this repository.' },
      { id: 'architecture', label: 'Architecture', icon: Layers, content: repoData?.architecture_report, fallback: 'No architecture report generated.' },
      { id: 'features', label: 'Features', icon: Zap, content: repoData?.feature_report, fallback: 'No feature report generated.' },
      { id: 'resume', label: 'Contributor Resume', icon: Users, content: repoData?.resume_report, fallback: 'No contributor profiling report generated.' },
      { id: 'interview', label: 'Onboarding Q&A', icon: ShieldCheck, content: repoData?.interview_report, fallback: 'No technical onboarding questions generated.' },
      { id: 'roadmap', label: 'Roadmap & Recommendations', icon: Compass, content: repoData?.recommendation_report, fallback: 'No recommendation roadmap generated.' }
    ]

    const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0]
    const ActiveIcon = activeTabObj.icon

    return (
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-[600px] shadow-glow-dark">
        {/* Tab Selector Header */}
        <div className="border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-wrap p-2 gap-1 custom-scrollbar overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-accent-purple text-white shadow-glow-blue'
                      : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 overflow-y-auto max-h-[800px] custom-scrollbar bg-[#0d1117] flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-surface-800/50">
            <ActiveIcon size={18} className="text-primary-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{activeTabObj.label}</h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-surface-950 prose-pre:border prose-pre:border-surface-800 flex-1">
            {activeTabObj.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeTabObj.content}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-surface-500">
                <ActiveIcon size={32} className="text-surface-600 mb-3" />
                <p className="text-sm">{activeTabObj.fallback}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Repository Explorer"
      subtitle="Deep dive into repository structure, docs, and metadata."
    >
      <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-medium text-surface-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {error && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-accent-red/10 border border-accent-red/20 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <AlertTriangle size={18} className="text-accent-red shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-accent-red">Analysis Failed</h3>
              <p className="text-xs text-accent-red/80 mt-1">{error}</p>
              <button onClick={() => navigate('/dashboard')} className="mt-3 px-4 py-1.5 bg-accent-red text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        )}

        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          {renderHeader()}
          {renderTechStack()}
          {renderLanguagesAndContributors()}

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar File Tree */}
            <div className="w-full lg:w-72 shrink-0">
              {loading ? (
                <Skeleton height="h-[600px]" rounded="rounded-2xl" />
              ) : (
                <FileTree treeData={repoData?.tree} />
              )}
            </div>

            {/* Main Content Intelligence Hub */}
            <div className="flex-1 w-full">
              {renderIntelligenceHub()}
            </div>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  )
}
