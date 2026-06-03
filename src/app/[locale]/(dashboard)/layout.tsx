'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      const locale = pathname.split('/')[1] ?? 'th'
      router.replace(`/${locale}/login`)
    }
  }, [user, pathname, router])

  // Don't render dashboard until auth confirmed
  if (!user) return null

  return <DashboardLayout>{children}</DashboardLayout>
}