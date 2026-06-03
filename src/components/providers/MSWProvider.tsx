'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { AuthUser } from '@/hooks/useAuth'

const MOCK_USER: AuthUser = {
  id:         'user-001',
  email:      'nattawut@agency.com',
  name:       'Nattawut Chaimongkol',
  role:       'OWNER',
  agencyId:   'agency-001',
  agencyName: 'NC Digital Agency',
  plan:       'AGENCY',
  locale:     'th',
}

declare global {
  interface Window { __mswStarted?: boolean }
}

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
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

      // Only restore mock user if token exists (user has logged in)
      const token = localStorage.getItem('pinnlo-token')
      if (token && !user) {
        setUser(MOCK_USER)
      }

      setReady(true)
    }

    startMSW()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (process.env.NODE_ENV === 'development' && !ready) return null

  return <>{children}</>
}