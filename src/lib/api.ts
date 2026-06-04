import axios from 'axios'
import { clearAuthState } from '@/hooks/useAuth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Request interceptor — attach JWT ──────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pinnlo-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ── Response interceptor — handle 401 ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Token expired — try refresh once
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true } // refresh token is in HttpOnly cookie
        )

        const newToken = data.accessToken
        localStorage.setItem('pinnlo-token', newToken)
        original.headers.Authorization = `Bearer ${newToken}`

        return api(original) // retry the original request
      } catch {
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem('pinnlo-token')
        clearAuthState()
        if (typeof window !== 'undefined') {
          // Extract current locale from pathname, fallback to 'en'
          const locale = window.location.pathname.split('/')[1] || 'en'
          window.location.href = `/${locale}/login`
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api