/**
 * GitInsight AI — Root Application
 *
 * Routes:
 *   /           → LandingPage  (premium marketing page)
 *   /dashboard  → Dashboard    (main app dashboard)
 *   /design     → DesignSystem (dev reference)
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './components/ui/Toast'
import LandingPage  from './pages/LandingPage'
import Dashboard    from './pages/Dashboard'
import DesignSystem from './pages/DesignSystem'
import RepositoryExplorer from './pages/RepositoryExplorer'
import SecurityDashboard from './pages/SecurityDashboard'
import Analyze from './pages/Analyze'
import History from './pages/History'
import Results from './pages/Results'
import CodeQuality from './pages/CodeQuality'
import Dependencies from './pages/Dependencies'
import Documentation from './pages/Documentation'
import './index.css'

/* ── Route Guard for Authenticated Users ─────────────────────────── */
function PrivateRoute({ children }) {
  const user = localStorage.getItem('user')
  return user ? children : <Navigate to="/" replace />
}

/* ── Animated route transitions ──────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"              element={<LandingPage />} />
        
        <Route path="/dashboard/security" element={<PrivateRoute><SecurityDashboard /></PrivateRoute>} />
        <Route path="/dashboard/code"     element={<PrivateRoute><CodeQuality /></PrivateRoute>} />
        <Route path="/dashboard/deps"     element={<PrivateRoute><Dependencies /></PrivateRoute>} />
        <Route path="/dashboard/docs"     element={<PrivateRoute><Documentation /></PrivateRoute>} />
        <Route path="/dashboard/analyze"  element={<PrivateRoute><Analyze /></PrivateRoute>} />
        <Route path="/dashboard/results"  element={<PrivateRoute><Results /></PrivateRoute>} />
        <Route path="/dashboard/history"  element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/dashboard"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard/*"        element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
        
        <Route path="/design"        element={<DesignSystem />} />
        <Route path="/explorer"      element={<PrivateRoute><RepositoryExplorer /></PrivateRoute>} />
        
        {/* Fallbacks */}
        <Route path="/analyze"       element={<PrivateRoute><Navigate to="/dashboard/analyze" replace /></PrivateRoute>} />
        <Route path="/results"       element={<PrivateRoute><Navigate to="/dashboard/results" replace /></PrivateRoute>} />
        <Route path="/history"       element={<PrivateRoute><Navigate to="/dashboard/history" replace /></PrivateRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

/* ── App Root ─────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="min-h-screen bg-surface-950 text-white">
          <AnimatedRoutes />
        </div>
      </ToastProvider>
    </Router>
  )
}
