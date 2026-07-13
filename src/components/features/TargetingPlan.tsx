'use client'

import { Download, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import styles from './TargetingPlan.module.css'

interface TargetingPlanProps {
  influencerName: string
  engagedAudience: number
  onBack: () => void
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const MOCK_TARGETING = {
  interests: ['Food & Dining', 'Restaurants', 'Coffee', 'Local cuisine'],
  languages: ['Burmese'],
  ageRange: '18–44',
  locations: ['Yangon', 'Mandalay', 'Naypyidaw'],
  behaviors: ['Engaged shoppers', 'Frequent Facebook users'],
}

export function TargetingPlan({ influencerName, engagedAudience, onBack }: TargetingPlanProps) {
  const toast = useToast()
  const t = MOCK_TARGETING

  const handleExport = () => {
    const lines = [
      `TARGETING PLAN — audience of ${influencerName}`,
      `Estimated reachable audience: ${formatNum(engagedAudience)}`,
      ``,
      `Languages: ${t.languages.join(', ')}`,
      `Age range: ${t.ageRange}`,
      `Locations: ${t.locations.join(', ')}`,
      `Interests: ${t.interests.join(', ')}`,
      `Behaviors: ${t.behaviors.join(', ')}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `targeting-plan-${influencerName.replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.show('Targeting plan exported', 'success')
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to audience
      </button>

      <div className={styles.title}>Targeting Plan</div>
      <div className={styles.subtitle}>
        Reach the people who engage with {influencerName}
      </div>

      <div className={styles.reachBanner}>
        <div className={styles.reachNum}>{formatNum(engagedAudience)}</div>
        <div className={styles.reachText}>estimated reachable audience</div>
      </div>

      <div className={styles.paramGroup}>
        <div className={styles.paramLabel}>Languages</div>
        <div className={styles.tagRow}>
          {t.languages.map((l) => <span key={l} className={styles.tag}>{l}</span>)}
        </div>
      </div>

      <div className={styles.paramGroup}>
        <div className={styles.paramLabel}>Age range</div>
        <div className={styles.paramValue}>{t.ageRange}</div>
      </div>

      <div className={styles.paramGroup}>
        <div className={styles.paramLabel}>Locations</div>
        <div className={styles.tagRow}>
          {t.locations.map((l) => <span key={l} className={styles.tag}>{l}</span>)}
        </div>
      </div>

      <div className={styles.paramGroup}>
        <div className={styles.paramLabel}>Interests</div>
        <div className={styles.tagRow}>
          {t.interests.map((i) => <span key={i} className={styles.tag}>{i}</span>)}
        </div>
      </div>

      <div className={styles.paramGroup}>
        <div className={styles.paramLabel}>Behaviors</div>
        <div className={styles.tagRow}>
          {t.behaviors.map((b) => <span key={b} className={styles.tag}>{b}</span>)}
        </div>
      </div>

      <button className={styles.exportBtn} onClick={handleExport}>
        <Download size={16} /> Export plan
      </button>

      <div className={styles.disclaimer}>
        This plan targets an audience segment through the ad platform&apos;s own targeting —
        interests, language, location, and behaviors — not a list of individual people.
        Review against platform policies and local data-protection rules before running.
      </div>
    </div>
  )
}