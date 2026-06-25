/**
 * DesignSystem — Visual showcase of all UI components.
 *
 * Route: /design (dev only — remove in production)
 * This page is the living design system reference.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, GitBranch, Star, Shield, Zap, Package,
  BookOpen, Code, AlertTriangle, CheckCircle, Info, Sparkles,
} from 'lucide-react'

import Button, { IconButton } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card, { StatCard } from '../components/ui/Card'
import Input, { Textarea, Select } from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Spinner, { PageLoader } from '../components/ui/Spinner'
import Skeleton, {
  SkeletonText, SkeletonCard, SkeletonTable, SkeletonStatRow,
} from '../components/ui/Skeleton'
import Table from '../components/ui/Table'
import GlassPanel from '../components/ui/GlassPanel'
import { ToastProvider, useToast } from '../components/ui/Toast'

/* ── Section wrapper ─────────────────────────────────────────────── */
function Section({ title, subtitle, children }) {
  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-surface-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

/* ── Token swatch ────────────────────────────────────────────────── */
function ColorSwatch({ name, hex, className }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl border border-white/10 ${className}`} />
      <div className="text-center">
        <p className="text-[10px] font-medium text-surface-200">{name}</p>
        <p className="text-[10px] text-surface-500 font-mono">{hex}</p>
      </div>
    </div>
  )
}

/* ── Toast demo (inner component, needs context) ─────────────────── */
function ToastDemo() {
  const { toast } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm" leftIcon={<CheckCircle size={14} />}
        onClick={() => toast.success('Analysis complete!', 'Repository scored 94/100')}>
        Success Toast
      </Button>
      <Button variant="secondary" size="sm" leftIcon={<AlertTriangle size={14} />}
        onClick={() => toast.warning('Rate limit approaching', '80% of GitHub API quota used')}>
        Warning Toast
      </Button>
      <Button variant="secondary" size="sm" leftIcon={<Info size={14} />}
        onClick={() => toast.info('Using cached results', 'Last analyzed 2 hours ago')}>
        Info Toast
      </Button>
      <Button variant="danger" size="sm"
        onClick={() => toast.error('Fetch failed', 'Repository not found or private')}>
        Error Toast
      </Button>
    </div>
  )
}

/* ── Table demo data ─────────────────────────────────────────────── */
const TABLE_COLUMNS = [
  { key: 'repo',    label: 'Repository', sortable: true },
  { key: 'lang',    label: 'Language',   render: (v) => <Badge variant="primary" size="sm">{v}</Badge> },
  { key: 'stars',   label: 'Stars',      sortable: true, align: 'right', render: (v) => `⭐ ${v.toLocaleString()}` },
  { key: 'score',   label: 'Score', align: 'right',
    render: (v) => (
      <Badge variant={v >= 80 ? 'success' : v >= 60 ? 'warning' : 'error'} size="sm">{v}/100</Badge>
    )
  },
  { key: 'status',  label: 'Status',
    render: (v) => <Badge variant={v === 'Active' ? 'success' : 'default'} dot pulse={v === 'Active'} size="sm">{v}</Badge>
  },
]
const TABLE_DATA = [
  { id: 1, repo: 'facebook/react',        lang: 'JavaScript', stars: 228000, score: 96, status: 'Active' },
  { id: 2, repo: 'microsoft/vscode',       lang: 'TypeScript', stars: 165000, score: 91, status: 'Active' },
  { id: 3, repo: 'torvalds/linux',         lang: 'C',          stars: 186000, score: 88, status: 'Active' },
  { id: 4, repo: 'vuejs/vue',              lang: 'JavaScript', stars: 207000, score: 84, status: 'Archived' },
  { id: 5, repo: 'golang/go',              lang: 'Go',         stars: 123000, score: 78, status: 'Active' },
]

/* ── Main showcase ───────────────────────────────────────────────── */
function DesignSystemInner() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-950 pt-8 pb-24">
      <div className="max-w-6xl mx-auto px-6">

        {/* Page header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
            <Sparkles size={12} className="text-primary-400" />
            <span className="text-xs text-primary-300 font-medium">Design System v1.0</span>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3">GitInsight AI</h1>
          <p className="text-surface-400 text-lg max-w-xl">
            Premium SaaS design system — every component, token, and pattern used across the app.
          </p>
        </div>

        {/* ══ COLOR PALETTE ══ */}
        <Section title="Color Palette" subtitle="Semantic tokens and brand colors">
          <div className="surface-card p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Primary (Blue)</p>
              <div className="flex flex-wrap gap-4">
                {[
                  ['50',  '#eef4ff', 'bg-primary-50'],
                  ['200', '#b2ccff', 'bg-primary-200'],
                  ['400', '#4d8bff', 'bg-primary-400'],
                  ['500', '#2563eb', 'bg-primary-500'],
                  ['600', '#1d4ed8', 'bg-primary-600'],
                  ['800', '#1e3a8a', 'bg-primary-800'],
                  ['950', '#0f172a', 'bg-primary-950'],
                ].map(([name, hex, cls]) => (
                  <ColorSwatch key={name} name={`primary-${name}`} hex={hex} className={cls} />
                ))}
              </div>
            </div>
            <div className="border-t border-surface-800 pt-5">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Accents</p>
              <div className="flex flex-wrap gap-4">
                {[
                  ['Blue',   '#3b82f6', 'bg-accent-blue'],
                  ['Purple', '#8b5cf6', 'bg-accent-purple'],
                  ['Cyan',   '#06b6d4', 'bg-accent-cyan'],
                  ['Green',  '#10b981', 'bg-accent-green'],
                  ['Orange', '#f59e0b', 'bg-accent-orange'],
                  ['Red',    '#ef4444', 'bg-accent-red'],
                ].map(([name, hex, cls]) => (
                  <ColorSwatch key={name} name={`accent-${name.toLowerCase()}`} hex={hex} className={cls} />
                ))}
              </div>
            </div>
            <div className="border-t border-surface-800 pt-5">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Surface Scale</p>
              <div className="flex flex-wrap gap-4">
                {[
                  ['700', '#334155', 'bg-surface-700'],
                  ['800', '#1e293b', 'bg-surface-800'],
                  ['900', '#0f172a', 'bg-surface-900'],
                  ['950', '#020617', 'bg-surface-950'],
                ].map(([name, hex, cls]) => (
                  <ColorSwatch key={name} name={`surface-${name}`} hex={hex} className={cls} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ══ TYPOGRAPHY ══ */}
        <Section title="Typography" subtitle="Inter for UI, JetBrains Mono for code">
          <div className="surface-card p-6 space-y-5">
            {[
              ['Display / Hero',   'text-5xl font-black tracking-tightest text-white', 'GitInsight AI'],
              ['H1',               'text-4xl font-bold text-white',                    'Repository Analyzer'],
              ['H2',               'text-2xl font-semibold text-white',                'Analysis Results'],
              ['H3',               'text-xl font-semibold text-white',                 'Code Quality Score'],
              ['H4',               'text-base font-semibold text-white',               'Agent Findings'],
              ['Body Large',       'text-base text-surface-300 leading-relaxed',        'Analyze any public GitHub repository with AI-powered agents.'],
              ['Body',             'text-sm text-surface-300 leading-relaxed',          'Get insights on code quality, architecture, security, and dependencies.'],
              ['Caption',          'text-xs text-surface-400',                          'Last analyzed 2 minutes ago • 47 files scanned'],
              ['Gradient',         'text-3xl font-bold gradient-text',                  'AI-Powered Analysis'],
              ['Mono',             'text-sm font-mono text-accent-cyan',                'const score = analyzeRepo(url)'],
            ].map(([label, cls, text]) => (
              <div key={label} className="flex items-baseline gap-6 pb-4 border-b border-surface-800 last:border-none last:pb-0">
                <span className="text-[10px] text-surface-500 uppercase tracking-wider w-24 shrink-0">{label}</span>
                <span className={cls}>{text}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ══ BUTTONS ══ */}
        <Section title="Buttons" subtitle="5 variants × 6 sizes + loading + icon states">
          <div className="surface-card p-6 space-y-6">
            {/* Variants */}
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
            {/* Sizes */}
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>
            {/* States */}
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-3">States</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" loading>Analyzing...</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" leftIcon={<Search size={14} />}>With Icon</Button>
                <Button variant="outline" leftIcon={<GitBranch size={14} />} rightIcon={<Star size={14} />}>Both Icons</Button>
                <IconButton variant="ghost"><Search size={16} /></IconButton>
                <IconButton variant="secondary"><Star size={16} /></IconButton>
              </div>
            </div>
          </div>
        </Section>

        {/* ══ BADGES ══ */}
        <Section title="Badges" subtitle="Status indicators with optional dot pulse">
          <div className="surface-card p-6 space-y-5">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="purple">Purple</Badge>
              <Badge variant="cyan">Cyan</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success" dot pulse>Live</Badge>
              <Badge variant="warning" dot>Pending</Badge>
              <Badge variant="error" dot>Failed</Badge>
              <Badge variant="info" dot pulse>Streaming</Badge>
              <Badge variant="primary" size="sm">v1.0.0</Badge>
              <Badge variant="success" size="lg">Score: 96/100</Badge>
            </div>
          </div>
        </Section>

        {/* ══ CARDS ══ */}
        <Section title="Cards" subtitle="4 surface variants + StatCard + hoverable">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Glass */}
            <GlassPanel>
              <Card.Header title="Glass Card" subtitle="Glassmorphism variant" icon={<GitBranch size={16} />} badge={<Badge variant="primary" size="sm">Glass</Badge>} />
              <Card.Body><SkeletonText lines={2} /></Card.Body>
            </GlassPanel>

            {/* Surface */}
            <Card variant="surface" hoverable>
              <Card.Header title="Surface Card" subtitle="Hoverable — try me!" icon={<Shield size={16} />} badge={<Badge variant="success" size="sm">Safe</Badge>} />
              <Card.Body><SkeletonText lines={2} /></Card.Body>
              <Card.Footer>
                <span className="text-xs text-surface-500">2 min ago</span>
                <Button variant="ghost" size="xs">Details →</Button>
              </Card.Footer>
            </Card>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Overall Score" value="94" change="↑ 3 pts from last run" icon={<Sparkles size={16} />} color="blue" />
            <StatCard label="Code Quality"  value="91" change="Excellent"              icon={<Code size={16} />}     color="purple" />
            <StatCard label="Security"      value="88" change="2 warnings"             icon={<Shield size={16} />}   color="green" />
            <StatCard label="Dependencies"  value="76" change="5 outdated"             icon={<Package size={16} />}  color="orange" />
          </div>
        </Section>

        {/* ══ INPUTS ══ */}
        <Section title="Inputs" subtitle="Input, Textarea, Select with validation states">
          <div className="surface-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Repository URL" placeholder="https://github.com/owner/repo" leftIcon={<GitBranch size={15} />} helper="Paste any public GitHub repo URL" />
              <Input label="GitHub Token (Optional)" placeholder="ghp_xxxxxxxxxxxx" rightIcon={<Shield size={15} />} helper="Increases rate limit to 5000 req/hr" />
              <Input label="Search repositories" placeholder="Search..." leftIcon={<Search size={15} />} />
              <Input label="Email" placeholder="you@example.com" error="Please enter a valid email address" value="invalid-email" />
              <Textarea label="Notes" placeholder="Add notes about this analysis..." rows={3} helper="Markdown supported" maxLength={500} value="" />
              <Select label="Primary Language" options={['All Languages', 'JavaScript', 'Python', 'TypeScript', 'Go', 'Rust']} helper="Filter by repository language" />
            </div>
          </div>
        </Section>

        {/* ══ TABLE ══ */}
        <Section title="Table" subtitle="Sortable columns, animated rows, empty state">
          <Table columns={TABLE_COLUMNS} data={TABLE_DATA} onSort={(k, d) => console.log(k, d)} />
        </Section>

        {/* ══ SPINNERS ══ */}
        <Section title="Spinners & Loaders" subtitle="4 variants × 5 sizes × 5 colors">
          <div className="surface-card p-6 space-y-6">
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-4">Variants</p>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Spinner variant="ring"  size="lg" />
                  <span className="text-[10px] text-surface-500">ring</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner variant="dots"  size="lg" />
                  <span className="text-[10px] text-surface-500">dots</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner variant="pulse" size="lg" />
                  <span className="text-[10px] text-surface-500">pulse</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner variant="bars"  size="lg" />
                  <span className="text-[10px] text-surface-500">bars</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-4">Colors</p>
              <div className="flex items-center gap-8">
                {['blue', 'purple', 'cyan', 'green', 'white'].map(c => (
                  <div key={c} className="flex flex-col items-center gap-2">
                    <Spinner size="md" color={c} />
                    <span className="text-[10px] text-surface-500">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ══ SKELETON ══ */}
        <Section title="Skeleton Loaders" subtitle="Shimmer placeholders for async content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard />
            <div className="space-y-4">
              <SkeletonStatRow count={2} />
              <SkeletonTable rows={3} cols={4} />
            </div>
          </div>
        </Section>

        {/* ══ MODAL ══ */}
        <Section title="Modal" subtitle="Animated dialog with backdrop blur">
          <div className="surface-card p-6">
            <Button variant="outline" onClick={() => setModalOpen(true)}>Open Modal</Button>
          </div>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Analysis" size="md">
            <Modal.Body>
              <p className="mb-4">You are about to analyze <strong className="text-white">facebook/react</strong>. This will consume GitHub API quota and may take 30–60 seconds.</p>
              <GlassPanel size="sm">
                <div className="flex items-center gap-3">
                  <Info size={16} className="text-blue-400 shrink-0" />
                  <p className="text-xs text-surface-400">Cached results will be used if this repo was analyzed within the last hour.</p>
                </div>
              </GlassPanel>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" leftIcon={<Sparkles size={14} />}>Start Analysis</Button>
            </Modal.Footer>
          </Modal>
        </Section>

        {/* ══ TOAST ══ */}
        <Section title="Toast Notifications" subtitle="Stackable auto-dismiss notifications with progress bar">
          <div className="surface-card p-6">
            <ToastDemo />
          </div>
        </Section>

      </div>
    </div>
  )
}

/* Wrap with ToastProvider */
export default function DesignSystem() {
  return (
    <ToastProvider>
      <DesignSystemInner />
    </ToastProvider>
  )
}
