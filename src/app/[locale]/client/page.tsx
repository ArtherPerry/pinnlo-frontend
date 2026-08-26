'use client'

import { useState } from 'react'
import { ClientShell, type ClientSection } from './ClientShell'
import { ReviewSection } from './ReviewSection'
import { CalendarSection } from './CalendarSection'
import { ReportsSection } from './ReportsSection'

const MOCK_CLIENT = { name: 'Somjai Coffee' }

export default function ClientWorkspacePage() {
  const [section, setSection] = useState<ClientSection>('review')
  const [reviewCount, setReviewCount] = useState(3)

  return (
    <ClientShell
      section={section}
      onSectionChange={setSection}
      clientName={MOCK_CLIENT.name}
      reviewCount={reviewCount}
    >
      {section === 'review' && <ReviewSection onCountChange={setReviewCount} />}
      {section === 'calendar' && <CalendarSection />}
      {section === 'reports' && <ReportsSection />}
    </ClientShell>
  )
}