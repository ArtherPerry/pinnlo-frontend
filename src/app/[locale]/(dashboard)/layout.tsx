'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, _hydrated } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (_hydrated && !user) {
      const locale = pathname.split('/')[1] ?? 'en'
      router.replace(`/${locale}/login`)
    }
  }, [user, _hydrated, pathname, router])

  // Zustand not hydrated yet — show empty background to prevent flash
  if (!_hydrated) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />
  )

  if (!user) return null
  
 return (
    <>
      <ImpersonationBanner />
      <DashboardLayout>{children}</DashboardLayout>
    </>
  )
}