import axios from 'axios'

// Create an axios instance configured for our FastAPI backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Analyzes a GitHub repository by passing its URL to the backend.
 * @param {string} url - The full GitHub repository URL.
 * @returns {Promise<Object>} The repository data.
 */
export async function analyzeRepository(url) {
  try {
    const response = await api.post('/analyze', { url })
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.message || 'Analysis failed')
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error.message)
    }
    throw new Error(error.message || 'Network error occurred')
  }
}

/**
 * Analyzes a GitHub repository's security posture by passing its URL to the backend security endpoint.
 * @param {string} url - The full GitHub repository URL.
 * @returns {Promise<Object>} The security analysis response.
 */
export async function analyzeRepositorySecurity(url) {
  try {
    const response = await api.post('/security/analyze', { url })
    // The security route returns SecurityAnalysisResponse directly, not wrapped in APIResponse
    return response.data
  } catch (error) {
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail)
    }
    throw new Error(error.message || 'Network error occurred')
  }
}

/**
 * Fetches the analysis history from the backend.
 * @returns {Promise<Array>} List of analyzed repositories.
 */
export async function getAnalysisHistory() {
  try {
    const response = await api.get('/history')
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.message || 'Failed to fetch history')
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail)
    }
    throw new Error(error.message || 'Network error occurred')
  }
}

export default api
