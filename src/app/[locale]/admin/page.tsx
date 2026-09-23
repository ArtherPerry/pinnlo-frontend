'use client'

import { useState } from 'react'
import { AdminShell, type AdminSection } from './adminShell'
import { DashboardSection } from './_sections/DashboardSection'
import { AgenciesSection } from './_sections/AgenciesSection'
import { UsersSection } from './_sections/UsersSection'
import { UsageSection } from './_sections/UsageSection'
import { CostsSection } from './_sections/CostsSection'
import { ConnectionsSection } from './_sections/ConnectionsSection'
import { PublishingSection } from './_sections/PublishingSection'
import { AuditSection } from './_sections/AuditSection'

/**
 * Platform admin panel. Each section lives in its own file under _sections;
 * this page only chooses which one to show. The underscore prefix keeps those
 * folders out of Next.js routing.
 */
export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>('dashboard')

  return (
    <AdminShell section={section} onSectionChange={setSection}>
      {/* The dashboard's Review buttons jump to the section that can act. */}
      {section === 'dashboard' && <DashboardSection onNavigate={setSection} />}
      {section === 'agencies' && <AgenciesSection />}
      {section === 'users' && <UsersSection />}
      {section === 'usage' && <UsageSection />}
      {section === 'costs' && <CostsSection />}
      {section === 'connections' && <ConnectionsSection />}
      {section === 'publishing' && <PublishingSection />}
      {section === 'audit' && <AuditSection />}
    </AdminShell>
  )
}