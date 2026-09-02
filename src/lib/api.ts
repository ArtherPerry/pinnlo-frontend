import axios from 'axios'
import { clearAuthState } from '@/hooks/useAuth'
import { getAccessToken, setAccessToken, clearAccessToken } from '@/lib/token'

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // The refresh cookie is HttpOnly and path-scoped to /api/v1/auth, so it is
  // only ever sent where it is needed — but axios must be told to send it.
  withCredentials: true,
  timeout: 15000,
})

// ── Request interceptor — attach the access token ─────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Refresh, with a single in-flight request ──────────────────────
//
// Several requests can 401 at once when a token expires. Without this, each
// would call /refresh, and rotation means only the first succeeds — the rest
// present an already-spent token, which the server treats as theft and
// revokes the whole family. So the first refresh is shared.

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/api/v1/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        const token = response.data.token as string
        setAccessToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function redirectToLogin() {
  clearAccessToken()
  clearAuthState()
  if (typeof window !== 'undefined') {
    const locale = window.location.pathname.split('/')[1] || 'en'
    window.location.href = `/${locale}/login`
  }
}

// ── Response interceptor — refresh once on 401 ────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Never try to refresh a failed refresh — that loops.
    const isAuthCall = original?.url?.includes('/api/v1/auth/refresh')

    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true

      try {
        const token = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        redirectToLogin()
      }
    }

    return Promise.reject(error)
  }
)

export { refreshAccessToken }
export default api