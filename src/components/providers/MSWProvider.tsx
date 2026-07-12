'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'

declare global {
  interface Window { __mswStarted?: boolean }
}

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
  typeof window !== 'undefined' && !!window.__mswStarted
)
  const { user, setUser } = useAuth()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      setReady(true)
      return
    }

    const startMSW = async () => {
      if (!window.__mswStarted) {
        const { worker } = await import('@/mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' }).catch(() => {})
        window.__mswStarted = true
      }

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

    startMSW()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (process.env.NODE_ENV === 'development' && !ready) return null

  return <>{children}</>
}