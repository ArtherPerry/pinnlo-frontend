'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useClientWorkspace } from '@/hooks/useClientWorkspace'
import { ClientShell, type ClientSection } from './ClientShell'
import { ReviewSection } from './ReviewSection'
import { CalendarSection } from './CalendarSection'
import { ReportsSection } from './ReportsSection'
import styles from './client.module.css'

export default function ClientWorkspacePage() {
  const router = useRouter()
  const locale = useLocale()
  const { user, _hydrated } = useAuth()

  const [section, setSection] = useState<ClientSection>('review')
  const { data: workspace, isLoading, isError } = useClientWorkspace()

  // This route sits outside the (dashboard) group, so it carries no auth guard
  // of its own. Agency staff who land here would 403 on every call.
  useEffect(() => {
    if (!_hydrated) return
    if (!user) {
      router.replace(`/${locale}/login`)
    } else if (user.role !== 'CLIENT') {
      router.replace(`/${locale}/dashboard`)
    }
  }, [user, _hydrated, router, locale])

  if (!_hydrated || !user || user.role !== 'CLIENT') return null

  if (isLoading) {
    return <div className={styles.loadingScreen}>Loading your workspace...</div>
  }

  if (isError || !workspace) {
    return (
      <div className={styles.loadingScreen}>
        Could not load your workspace. Please try again shortly.
      </div>
    )
  }

  // Multi-brand clients can hold several workspaces; the first is shown for now.
  // A switcher belongs in ClientShell once that case is real.
  const primary = workspace.clients[0]

  if (!primary) {
    return (
      <div className={styles.loadingScreen}>
        No workspace has been assigned to your account yet. Contact your agency.
      </div>
    )
  }

  const awaiting = workspace.clients.reduce((sum, c) => sum + c.awaitingReview, 0)

  return (
    <ClientShell
      section={section}
      onSectionChange={setSection}
      clientName={primary.name}
      reviewCount={awaiting}
    >
      {section === 'review'   && <ReviewSection readOnly={primary.readOnly} />}
      {section === 'calendar' && <CalendarSection />}
      {section === 'reports'  && <ReportsSection />}
    </ClientShell>
  )
}