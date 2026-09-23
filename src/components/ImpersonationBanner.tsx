'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isImpersonating, exitImpersonation } from '@/lib/impersonation'
import { useAuth } from '@/hooks/useAuth'

/**
 * Shown throughout a support session.
 *
 * Exiting revokes the session on the server, then clears the stored user and
 * returns to sign in. Previously the button only called the server: the
 * session really ended, but nothing told the page, so the banner stayed and
 * it looked as though nothing had happened — while every request afterwards
 * was using a revoked session.
 *
 * Signing in again is expected: starting a support session replaces the
 * admin's own session rather than stashing it.
 */
export function ImpersonationBanner() {
  const [active, setActive] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setActive(isImpersonating())
  }, [])

  if (!active) return null

  const handleExit = async () => {
    setLeaving(true)
    // exitImpersonation clears the access token even if the server call
    // fails, so a failed exit cannot trap someone in a support session.
    await exitImpersonation()
    logout()
    const locale = pathname.split('/')[1] ?? 'en'
    router.replace(`/${locale}/login`)
  }

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#b45309',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <span>You are impersonating an agency. This session is read-only.</span>
      <button
        type="button"
        onClick={handleExit}
        disabled={leaving}
        style={{
          background: 'white',
          color: '#b45309',
          border: 'none',
          borderRadius: 6,
          padding: '4px 12px',
          fontWeight: 600,
          cursor: leaving ? 'default' : 'pointer',
          opacity: leaving ? 0.7 : 1,
        }}
      >
        {leaving ? 'Exiting…' : 'Exit impersonation'}
      </button>
    </div>
  )
}