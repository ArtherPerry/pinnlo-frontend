'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'

/**
 * Restores the session on load: if a token is in storage, resolve the user
 * before rendering, so pages don't flash a logged-out state on refresh.
 *
 * This was previously buried inside MSWProvider, which meant session
 * restoration only ran in development.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const { user, setUser } = useAuth()

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('pinnlo-token')
      if (token && !user) {
        try {
          const { data } = await api.get('/api/v1/auth/me')
          setUser(data)
        } catch {
          localStorage.removeItem('pinnlo-token')
        }
      }
      setReady(true)
    }
    restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null

  return <>{children}</>
}