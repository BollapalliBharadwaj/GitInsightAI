/**
 * GitInsight AI — Application Entry Point
 *
 * Mounts the React app to the DOM.
 * Context providers (theme, state) will wrap <App /> in future phases.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
