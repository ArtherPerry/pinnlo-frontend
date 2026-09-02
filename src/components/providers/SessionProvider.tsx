'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { setAccessToken } from '@/lib/token'
import { refreshAccessToken } from '@/lib/api'
import api from '@/lib/api'

/**
 * Restores the session on load.
 *
 * The access token lives in memory, so a page refresh loses it. What survives
 * is the HttpOnly refresh cookie — so restoration means asking the server for
 * a new access token rather than reading one out of storage.
 *
 * Nothing renders until this settles, otherwise every page would flash a
 * logged-out state on every refresh.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const setUser = useAuth((s) => s.setUser)
  const logout  = useAuth((s) => s.logout)

  useEffect(() => {
    const restore = async () => {
      try {
        // Succeeds only if a valid refresh cookie exists.
        await refreshAccessToken()
        const { data } = await api.get('/api/v1/auth/me')
        setUser(data)
      } catch {
        // No session, or it has ended. Not an error — the user is simply
        // logged out, and the login page handles it from here.
        setAccessToken(null)
        logout()
      } finally {
        setReady(true)
      }
    }
    restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null

  return <>{children}</>
}