'use client'

import { useEffect, useState } from 'react'
import { isImpersonating, exitImpersonation } from '@/lib/impersonation'

export function ImpersonationBanner() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(isImpersonating())
  }, [])

  if (!active) return null

  return (
    <div style={{
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
    }}>
      <span>You are impersonating an agency (admin view)</span>
      <button
        onClick={exitImpersonation}
        style={{
          background: 'white',
          color: '#b45309',
          border: 'none',
          borderRadius: 6,
          padding: '4px 12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Exit impersonation
      </button>
    </div>
  )
}