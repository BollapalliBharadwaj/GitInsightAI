import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Shield, ShieldAlert, ShieldCheck, AlertOctagon, AlertTriangle, 
  CheckCircle2, Play, BookOpen, Terminal, 
  ExternalLink, FileCode, Loader, Filter, Info, ChevronDown
} from 'lucide-react'

import DashboardLayout from '../layouts/DashboardLayout'
import { analyzeRepositorySecurity } from '../lib/api'
import Card, { StatCard } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Skeleton, {
  SkeletonCard,
  SkeletonTable
} from '../components/ui/Skeleton'

/* ── Animation presets ───────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } }
}

/* ── Fallback Mock Data with AI Explanations ──────────────────────── */
const MOCK_REPOS_SECURITY = {
  "facebook/react": {
    repository_name: "facebook/react",
    security_summary: {
      security_score: 98,
      critical: 0,
      high: 0,
      medium: 0,
      low: 1,
      total_issues: 1
    },
    vulnerabilities: [
      {
        title: "Exposed Environment Configuration Template",
        description: "An environment template (.env.sample) was detected in the repository. Ensure that no actual, production-level credentials are left inside configuration templates.",
        severity: "low",
        category: "configuration",
        file_path: ".env.sample",
        line_number: null,
        recommendation: "Review the .env.sample file, ensure it contains only placeholder values, and never commit real keys.",
        ai_explanation: "### 1. What is the issue?\nAn environment template configuration file (`.env.sample`) is committed to the git repository. While configurations templates are recommended to guide development setup, they must strictly exclude real production tokens or database credentials.\n\n### 2. Why is it dangerous?\nIf actual keys or connection strings are accidentally left in committed sample files, they become visible to anyone with access to the source repository. Scraping bots scrape public templates and exploit active keys.\n\n### 3. Real-world impact\nExposure of keys can result in service abuse, unauthorized database access, or cost overruns on billed developer platforms.\n\n### 4. How to fix it\nEnsure all values in `.env.sample` are dummy placeholders. Track the real `.env` file in your `.gitignore` so developers manage credentials locally.\n\n### 5. Example secure code\n```bash\n# Secure .env.sample template configuration\nPORT=8000\nDATABASE_URL=mongodb://localhost:27017/app_dev\nGITHUB_API_TOKEN=your_token_here_placeholder\n```"
      }
    ],
    recommendations: [
      "Review the .env.sample file, ensure it contains only placeholder values, and never commit real keys.",
      "Maintain regular secret rotation policies."
    ]
  },
  "microsoft/vulnerable-node-app": {
    repository_name: "microsoft/vulnerable-node-app",
    security_summary: {
      security_score: 35,
      critical: 3,
      high: 2,
      medium: 2,
      low: 1,
      total_issues: 8
    },
    vulnerabilities: [
      {
        title: "Hardcoded AWS Access Key",
        description: "A pattern matching a hardcoded AWS Access Key was detected: 'AKIAIOSFODNN7EXAMPLE'. Committing credentials directly to Git repositories exposes them to external theft and unauthorized system access.",
        severity: "critical",
        category: "secrets",
        file_path: "src/config/aws.js",
        line_number: 12,
        recommendation: "Remove AWS credentials from source code immediately. Use AWS IAM Roles, IAM Service Accounts, or secure environment configuration variables instead.",
        ai_explanation: "### 1. What is the issue?\nAn AWS Access Key ID (`AKIAIOSFODNN7EXAMPLE`) was detected hardcoded directly in plain text in the initialization files.\n\n### 2. Why is it dangerous?\nGit repositories are frequently targeted by credential harvesting bots. Within seconds of committing a plaintext key to a public repository, attackers can compromise your cloud instances.\n\n### 3. Real-world impact\nAttackers can spin up heavy EC2 instances for crypto-mining, gain read/write access to sensitive S3 buckets, or delete entire cloud infrastructure, resulting in massive bills or catastrophic data loss.\n\n### 4. How to fix it\nRemove the hardcoded string from source files. Retrieve credentials dynamically from environment variables or use IAM roles when deploying in AWS.\n\n### 5. Example secure code\n```javascript\n// Secure initialization using environment variables\nconst s3 = new AWS.S3({\n  accessKeyId: process.env.AWS_ACCESS_KEY_ID,\n  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY\n});\n```"
      },
      {
        title: "Exposed .env Configuration File",
        description: "An environment configuration file (.env) was detected at the repository root. Environment files contain local secrets and should never be version-controlled.",
        severity: "critical",
        category: "configuration",
        file_path: ".env",
        line_number: null,
        recommendation: "Remove the .env file from git tracking using 'git rm --cached .env', add it to the .gitignore file, and immediately rotate any committed secrets.",
        ai_explanation: "### 1. What is the issue?\nThe local environment file `.env` was committed and tracked in git version history.\n\n### 2. Why is it dangerous?\n`.env` files contain sensitive keys, tokens, and database passwords. If committed, these credentials are leaked and cached indefinitely in the repository's git commit history.\n\n### 3. Real-world impact\nExposes system secrets, allowing database breaches, server takeovers, and compromised external API endpoints.\n\n### 4. How to fix it\nRemove the file from git history, add `.env` to `.gitignore`, and immediately rotate all credentials exposed in the file.\n\n### 5. Example secure code\n```bash\n# terminal command to stop tracking .env\ngit rm --cached .env\necho \".env\" >> .gitignore\n```"
      },
      {
        title: "Hardcoded OpenAI API Key",
        description: "A pattern matching an OpenAI API Key ('sk-proj-aBcdE...1234') was detected. Exposed LLM keys can lead to service abuse and substantial financial costs.",
        severity: "critical",
        category: "secrets",
        file_path: "src/services/ai.js",
        line_number: 5,
        recommendation: "Revoke the exposed key in the OpenAI developer console, replace it with dynamic injection via process.env.OPENAI_API_KEY, and verify code is excluded from future commits.",
        ai_explanation: "### 1. What is the issue?\nA plain-text OpenAI API Key (`sk-proj-aBcdE...`) was found hardcoded in `src/services/ai.js`.\n\n### 2. Why is it dangerous?\nAutomated scanner scripts continuously seek exposed LLM keys to steal model access for free completions, bypassing payment limits.\n\n### 3. Real-world impact\nSudden surges in API usage charges, potential denial-of-service on your app if key usage limits are exceeded, and token depletion.\n\n### 4. How to fix it\nRevoke the key immediately in the OpenAI console, and fetch it dynamically from the system environment.\n\n### 5. Example secure code\n```javascript\n// Load key from environment configuration\nimport OpenAI from 'openai';\n\nconst openai = new OpenAI({\n  apiKey: process.env.OPENAI_API_KEY\n});\n```"
      },
      {
        title: "Insecure Execution: eval()",
        description: "Use of eval() detected: 'eval(req.body.code)'. eval() dynamically executes arbitrary code. It is highly dangerous if user input is passed directly or indirectly.",
        severity: "high",
        category: "insecure-execution",
        file_path: "src/utils/sandbox.js",
        line_number: 45,
        recommendation: "Avoid dynamic code execution via eval(). Use parsing libraries (e.g. JSON.parse or ast.literal_eval in Python) or explicit sandboxes instead.",
        ai_explanation: "### 1. What is the issue?\nThe application uses `eval()` with input directly derived from request parameters.\n\n### 2. Why is it dangerous?\n`eval()` executes any string parameter passed to it as script instructions. If attackers supply malicious code in the payload, they gain arbitrary Remote Code Execution (RCE) on your host server.\n\n### 3. Real-world impact\nHost system compromise, direct file access, server takeover, and backend lateral escalation.\n\n### 4. How to fix it\nRefactor logic to parse strict formats like JSON, use dictionary lookups, or apply pre-defined commands instead of dynamic script execution.\n\n### 5. Example secure code\n```javascript\n// Secure replacement: Parsing json structure instead of dynamic evaluation\n// Unsafe: eval(\"obj.\" + field)\n// Safe:\nconst value = obj[field];\n```"
      },
      {
        title: "Insecure Execution: os.system()",
        description: "Potential insecure execution risk found: 'os.system('ping ' + host)'. Calling shell commands via string interpolation exposes the host environment to arbitrary Command Injection.",
        severity: "high",
        category: "insecure-execution",
        file_path: "scripts/ping.py",
        line_number: 18,
        recommendation: "Avoid os.system(). Use the subprocess module with shell=False and pass command line arguments as a list of strings.",
        ai_explanation: "### 1. What is the issue?\nThe code executes system shell instructions using string concatenation (`os.system('ping ' + host)`).\n\n### 2. Why is it dangerous?\nIf the `host` parameter is untrusted and contains command separators (like `;`, `&&`, or `|`), the shell executes the secondary command, creating a Command Injection path.\n\n### 3. Real-world impact\nServer breach, host environment compromise, and execution of destructive commands with the same privileges as the application process.\n\n### 4. How to fix it\nAvoid using `os.system`. Use `subprocess.run` with `shell=False` and pass arguments as a list to treat the inputs strictly as arguments instead of executable scripts.\n\n### 5. Example secure code\n```python\n# Secure subprocess list execution\nimport subprocess\n\n# shell=False ensures command args are parameterized safely\nres = subprocess.run([\"ping\", \"-c\", \"4\", host], capture_output=True, text=True, shell=False)\n```"
      }
    ],
    recommendations: [
      "Remove AWS credentials from source code immediately and revoke keys.",
      "Remove the .env file from git tracking, add to .gitignore, and rotate secrets.",
      "Revoke OpenAI API Key and migrate to environment variables.",
      "Refactor eval() and os.system() to use secure alternative methods.",
      "Replace yaml.load() with yaml.safe_load().",
      "Add a standard .gitignore file to repository root."
    ]
  }
}

export default function SecurityDashboard() {
  const [url, setUrl] = useState("https://github.com/facebook/react")
  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filterSeverity, setFilterSeverity] = useState("All")
  const [expandedIssueIndex, setExpandedIssueIndex] = useState(null)

  // Trigger backend scan
  const triggerScan = async (targetUrl = url) => {
    if (!targetUrl || !targetUrl.trim()) return
    
    setLoading(true)
    setError(null)
    setExpandedIssueIndex(null)
    setFilterSeverity("All")

    try {
      const data = await analyzeRepositorySecurity(targetUrl)
      setRepoData(data)
    } catch (err) {
      console.error(err)
      setError(err.message || "An error occurred while analyzing the repository.")
    } finally {
      setLoading(false)
    }
  }

  // Run on mount
  useEffect(() => {
    triggerScan()
  }, [])

  // Presets mapping
  const handlePresetSelect = (e) => {
    const selectedUrl = e.target.value
    setUrl(selectedUrl)
    triggerScan(selectedUrl)
  }

  // Load static demo fallback in case user wants to test offline
  const handleLoadDemoData = () => {
    setError(null)
    setRepoData(MOCK_REPOS_SECURITY["microsoft/vulnerable-node-app"])
    setUrl("https://github.com/microsoft/vulnerable-node-app")
  }

  // Filter vulnerabilities list
  const filteredVulnerabilities = repoData?.vulnerabilities.filter(vuln => {
    if (filterSeverity === "All") return true
    return vuln.severity.toLowerCase() === filterSeverity.toLowerCase()
  }) || []

  // Color mappings
  const getScoreColor = (score) => {
    if (score >= 90) return "text-accent-green"
    if (score >= 70) return "text-yellow-400"
    return "text-accent-red"
  }

  const getSeverityBadgeVariant = (severity) => {
    const mapping = {
      critical: "error",
      high: "warning",
      medium: "purple",
      low: "info"
    }
    return mapping[severity.toLowerCase()] || "default"
  }

  // Keyboard navigation toggle helper for table rows
  const handleRowKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setExpandedIssueIndex(expandedIssueIndex === index ? null : index)
    }
  }

  return (
    <DashboardLayout
      title="AI Security Analyzer"
      subtitle="Verify credentials exposure, code execution risks, and unsafe deserialization."
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="p-6 max-w-[1600px] mx-auto min-h-screen"
      >
        
        {/* ── Scan Form Panel ── */}
        <motion.div variants={itemVariants}>
          <Card variant="surface" className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex-1 space-y-1">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="text-primary-400" size={16} />
                Start Security Analysis
              </h2>
              <p className="text-[11px] text-surface-500">Provide a GitHub repository URL to initiate rule-based security auditing</p>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); triggerScan() }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:w-3/5 lg:w-1/2"
            >
              {/* Input Bar */}
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://github.com/facebook/react"
                disabled={loading}
                aria-label="Repository URL to analyze"
                className="flex-1 h-10 px-4 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white placeholder:text-surface-650 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 transition-all"
              />

              {/* Presets Select */}
              <select
                onChange={handlePresetSelect}
                value={url}
                disabled={loading}
                aria-label="Preselected repository presets"
                className="h-10 px-3 bg-surface-950 border border-surface-800 rounded-xl text-xs text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 transition-all"
              >
                <option value="https://github.com/facebook/react">Preset: React</option>
                <option value="https://github.com/expressjs/express">Preset: Express</option>
                <option value="https://github.com/microsoft/vulnerable-node-app">Preset: Vulnerable App</option>
              </select>

              {/* Submit Scan */}
              <button
                type="submit"
                disabled={loading}
                aria-label={loading ? "Scanning repository" : "Start scan"}
                className="flex items-center justify-center gap-1.5 h-10 px-4 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:text-surface-500 text-white text-xs font-semibold rounded-xl transition-all shadow-glow-blue hover:shadow-glow-blue-lg cursor-pointer shrink-0"
              >
                {loading ? (
                  <Loader className="animate-spin" size={13} />
                ) : (
                  <Play size={11} fill="currentColor" />
                )}
                {loading ? "Scanning..." : "Scan Repo"}
              </button>
            </form>
          </Card>
        </motion.div>

        {/* ── main content area ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Stat summary grid skeleton */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px]">
                  <Skeleton width="w-24" height="h-24" rounded="rounded-full" className="mb-4" />
                  <Skeleton width="w-32" height="h-5" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl p-5 flex flex-col justify-between">
                      <Skeleton width="w-8" height="h-8" rounded="rounded-xl" className="mb-4" />
                      <div>
                        <Skeleton width="w-1/2" height="h-8" className="mb-2" />
                        <Skeleton width="w-2/3" height="h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main row skeleton */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SkeletonTable rows={5} cols={5} />
                </div>
                <div>
                  <SkeletonCard />
                </div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Card variant="outlined" className="bg-accent-red/5 border-accent-red/15 p-6 flex items-start gap-4">
                <AlertOctagon size={20} className="text-accent-red shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-accent-red">Security Scan Failed</h3>
                  <p className="text-xs text-accent-red/70 mt-1 max-w-3xl leading-relaxed">{error}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <button 
                      onClick={() => triggerScan()} 
                      className="px-4 py-1.5 bg-accent-red text-white text-xs font-semibold rounded-lg hover:bg-red-650 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Loader className="hidden group-disabled:block animate-spin" size={12} />
                      Scan Again
                    </button>
                    <button 
                      onClick={handleLoadDemoData} 
                      className="px-4 py-1.5 bg-surface-850 hover:bg-surface-800 border border-surface-700 text-surface-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      View Offline Demo
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : repoData ? (
            <motion.div
              key="security-dashboard-content"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* ── Section 1: Dashboard Stats Overview ── */}
              <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-6">
                
                {/* Score Card (Circular Progress) */}
                <Card variant="glass" className="flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden group shadow-card">
                  {/* Decorative Glow */}
                  <div className="absolute -inset-10 bg-gradient-to-br from-primary-500/10 via-transparent to-transparent opacity-50 blur-2xl group-hover:opacity-75 transition-opacity pointer-events-none" />
                  
                  <h3 className="text-sm font-semibold text-surface-400 mb-6 uppercase tracking-wider">Overall Security Score</h3>
                  
                  {/* Circle SVG */}
                  <div className="relative flex items-center justify-center mb-4" role="region" aria-label={`Overall Security Score: ${repoData.security_summary.security_score} out of 100`}>
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-surface-800"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r="62"
                        stroke="currentColor"
                        strokeWidth="8"
                        className={`${getScoreColor(repoData.security_summary.security_score)} transition-all duration-1000`}
                        fill="transparent"
                        strokeDasharray={390}
                        initial={{ strokeDashoffset: 390 }}
                        animate={{ strokeDashoffset: 390 - (390 * repoData.security_summary.security_score) / 100 }}
                        strokeLinecap="round"
                        transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    
                    {/* Score Labels inside circle */}
                    <div className="absolute text-center">
                      <span className="text-4xl font-extrabold text-white tracking-tight">{repoData.security_summary.security_score}</span>
                      <span className="text-xs text-surface-500 block font-medium">/ 100</span>
                    </div>
                  </div>
                  
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getScoreColor(repoData.security_summary.security_score)} bg-white/[0.02] border border-white/[0.04]`}>
                    {repoData.security_summary.security_score >= 90 ? "Strong Posture" : repoData.security_summary.security_score >= 70 ? "Medium Risk" : "Critical Actions Needed"}
                  </span>
                </Card>

                {/* Severity Breakdown Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard
                    label="Critical Alerts"
                    value={repoData.security_summary.critical}
                    icon={<AlertOctagon size={16} />}
                    color="red"
                    className={`cursor-pointer transition-all duration-300 ${filterSeverity === "Critical" ? 'ring-2 ring-primary-500 border-transparent shadow-glow-blue' : ''}`}
                    onClick={() => setFilterSeverity(filterSeverity === "Critical" ? "All" : "Critical")}
                  />
                  <StatCard
                    label="High Alerts"
                    value={repoData.security_summary.high}
                    icon={<ShieldAlert size={16} />}
                    color="orange"
                    className={`cursor-pointer transition-all duration-300 ${filterSeverity === "High" ? 'ring-2 ring-primary-500 border-transparent shadow-glow-blue' : ''}`}
                    onClick={() => setFilterSeverity(filterSeverity === "High" ? "All" : "High")}
                  />
                  <StatCard
                    label="Medium Alerts"
                    value={repoData.security_summary.medium}
                    icon={<AlertTriangle size={16} />}
                    color="purple"
                    className={`cursor-pointer transition-all duration-300 ${filterSeverity === "Medium" ? 'ring-2 ring-primary-500 border-transparent shadow-glow-blue' : ''}`}
                    onClick={() => setFilterSeverity(filterSeverity === "Medium" ? "All" : "Medium")}
                  />
                  <StatCard
                    label="Low Alerts"
                    value={repoData.security_summary.low}
                    icon={<Info size={16} />}
                    color="blue"
                    className={`cursor-pointer transition-all duration-300 ${filterSeverity === "Low" ? 'ring-2 ring-primary-500 border-transparent shadow-glow-blue' : ''}`}
                    onClick={() => setFilterSeverity(filterSeverity === "Low" ? "All" : "Low")}
                  />
                </div>
              </motion.div>

              {/* ── Section 2: Vulnerability Table & Recommendations ── */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Vulnerability Table Panel */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
                  <Card variant="surface" padding={false} className="overflow-hidden shadow-card">
                    {/* Header bar */}
                    <div className="px-6 py-5 border-b border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-900/50">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Detected Vulnerabilities</h3>
                        <p className="text-[11px] text-surface-500 mt-0.5">Showing {filteredVulnerabilities.length} of {repoData.security_summary.total_issues} issues</p>
                      </div>
                      
                      {/* Filter buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <Filter size={12} className="text-surface-500 mr-1 shrink-0" />
                        {["All", "Critical", "High", "Medium", "Low"].map((sev) => (
                          <button
                            key={sev}
                            onClick={() => setFilterSeverity(sev)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              filterSeverity === sev
                                ? 'bg-primary-500 border-primary-400 text-white'
                                : 'bg-surface-850 border-surface-700 text-surface-450 hover:text-white hover:border-surface-600'
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table element */}
                    {filteredVulnerabilities.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" aria-label="Detected vulnerability scan records">
                          <thead>
                            <tr className="border-b border-surface-800 bg-surface-950/20 text-surface-400 text-[10px] font-bold uppercase tracking-wider">
                              <th className="py-4 px-6">Vulnerability</th>
                              <th className="py-4 px-6 text-center">Severity</th>
                              <th className="py-4 px-6">Category</th>
                              <th className="py-4 px-6">Location</th>
                              <th className="py-4 px-6 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-800/65">
                            {filteredVulnerabilities.map((vuln, idx) => {
                              const badgeVariant = getSeverityBadgeVariant(vuln.severity)
                              const isExpanded = expandedIssueIndex === idx

                              return (
                                <React.Fragment key={idx}>
                                  <tr
                                    onClick={() => setExpandedIssueIndex(isExpanded ? null : idx)}
                                    onKeyDown={(e) => handleRowKeyDown(e, idx)}
                                    tabIndex={0}
                                    role="button"
                                    aria-expanded={isExpanded}
                                    className={`group hover:bg-white/[0.015] focus-visible:bg-white/[0.03] outline-none transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.01]' : ''}`}
                                  >
                                    {/* Title */}
                                    <td className="py-4 px-6 max-w-xs sm:max-w-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-white group-hover:text-primary-300 transition-colors leading-relaxed truncate">{vuln.title}</span>
                                      </div>
                                    </td>
                                    {/* Severity */}
                                    <td className="py-4 px-6 text-center">
                                      <Badge 
                                        variant={badgeVariant} 
                                        size="sm" 
                                        dot={true} 
                                        pulse={vuln.severity.toLowerCase() === 'critical'}
                                      >
                                        {vuln.severity}
                                      </Badge>
                                    </td>
                                    {/* Category */}
                                    <td className="py-4 px-6">
                                      <span className="text-xs text-surface-400 font-medium">{vuln.category}</span>
                                    </td>
                                    {/* Location */}
                                    <td className="py-4 px-6 max-w-[150px]">
                                      <div className="flex items-center gap-1 text-[11px] text-surface-500 font-mono truncate">
                                        <FileCode size={11} className="shrink-0" />
                                        <span>
                                          {vuln.file_path.split("/").pop()}
                                          {vuln.line_number && `:${vuln.line_number}`}
                                        </span>
                                      </div>
                                    </td>
                                    {/* Action link */}
                                    <td className="py-4 px-6 text-right">
                                      <span className="text-[11px] font-semibold text-primary-400 group-hover:text-primary-300 transition-colors inline-flex items-center gap-0.5">
                                        {isExpanded ? "Hide Details" : "View"}
                                        <ChevronDown size={11} className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Accordion Expansion detail row */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={5} className="p-0 bg-surface-950/30 border-b border-surface-800">
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2, ease: "easeInOut" }}
                                          className="overflow-hidden"
                                        >
                                          <div className="py-5 px-8 space-y-4 text-xs leading-relaxed">
                                            {/* Description */}
                                            <div>
                                              <p className="font-semibold text-white mb-1">Details & Impact:</p>
                                              <p className="text-surface-400 font-medium leading-relaxed">{vuln.description}</p>
                                            </div>
                                            
                                            {/* Recommendation */}
                                            <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-start gap-2.5">
                                              <CheckCircle2 size={14} className="text-accent-green shrink-0 mt-0.5" />
                                              <div>
                                                <p className="font-semibold text-accent-green mb-0.5">Recommended Action:</p>
                                                <p className="text-surface-300 font-medium leading-relaxed">{vuln.recommendation}</p>
                                              </div>
                                            </div>

                                            {/* AI Deep-Dive Explanation */}
                                            {vuln.ai_explanation ? (
                                              <div className="mt-4 p-4 bg-primary-950/20 border border-primary-800/25 rounded-xl space-y-2 relative overflow-hidden group">
                                                <p className="font-bold text-primary-300 flex items-center gap-1.5 mb-3 border-b border-primary-800/30 pb-2">
                                                  <Shield className="text-primary-400 animate-pulse shrink-0" size={13} />
                                                  AI Vulnerability Analysis & Secure Fix (Llama 3.1)
                                                </p>
                                                <div className="prose prose-invert prose-xs max-w-none text-surface-300 leading-relaxed font-medium prose-pre:bg-surface-950 prose-pre:border prose-pre:border-surface-850">
                                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {vuln.ai_explanation}
                                                  </ReactMarkdown>
                                                </div>
                                              </div>
                                            ) : null}

                                            {/* File info footer */}
                                            <div className="flex items-center justify-between text-[10px] text-surface-500 font-mono pt-2 border-t border-surface-800/40">
                                              <span>Full Path: <span className="text-surface-400">{vuln.file_path}</span></span>
                                              {vuln.line_number && <span>Line: <span className="text-surface-400">{vuln.line_number}</span></span>}
                                            </div>
                                          </div>
                                        </motion.div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mb-4 shadow-glow-green">
                          <ShieldCheck size={20} className="text-accent-green" />
                        </div>
                        <h4 className="text-sm font-semibold text-white">No Issues Detected</h4>
                        <p className="text-xs text-surface-500 mt-1 max-w-sm">No vulnerabilities were found matching the selected severity filters.</p>
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Recommendations Panel */}
                <motion.div variants={itemVariants} className="space-y-6">
                  
                  {/* Summary recommendations */}
                  <Card variant="surface" className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent-purple/10 to-transparent blur-xl pointer-events-none" />
                    
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                      <BookOpen size={14} className="text-accent-purple" />
                      Security Recommendations
                    </h3>
                    
                    <div className="space-y-3.5">
                      {repoData.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-primary-500/10 border border-primary-500/20 text-[9px] font-bold text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-surface-300 font-medium leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Best Practices Banner Card */}
                  <Card variant="gradient">
                    <h3 className="text-xs font-bold text-primary-300 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <Terminal size={12} className="text-primary-400" />
                      Security Best Practices
                    </h3>
                    <p className="text-xs text-surface-400 leading-relaxed font-medium">
                      Always protect production keys by excluding them from source repositories. Rotate API credentials periodically, and incorporate static rule analysis directly into pre-commit git hooks to guarantee credentials never leak.
                    </p>
                    <div className="mt-4 pt-4 border-t border-surface-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-surface-500 font-medium">Integrates with GitHub Actions</span>
                      <a href="#" className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-all flex items-center gap-0.5">
                        Read Docs <ExternalLink size={11} />
                      </a>
                    </div>
                  </Card>

                </motion.div>

              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4">
                <Shield size={24} className="text-primary-400 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-white">Repository Security Audit Ready</h3>
              <p className="text-xs text-surface-500 mt-2 max-w-sm">Provide a repository link above to start the scanner.</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  )
}
