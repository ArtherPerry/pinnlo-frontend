'use client'

import { Target } from 'lucide-react'
import styles from './AudienceInsight.module.css'

interface AudienceInsightProps {
  influencerName: string
  engagedAudience: number
  onBuildTargeting: () => void
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// Mock audience data — real version comes from the scraping + Ads Library pipeline.
const MOCK_AUDIENCE = {
  languageSplit: [
    { label: 'Burmese', pct: 78 },
    { label: 'English', pct: 22 },
  ],
  ageSplit: [
    { label: '18–24', pct: 34 },
    { label: '25–34', pct: 41 },
    { label: '35–44', pct: 18 },
    { label: '45+',   pct: 7 },
  ],
  genderSplit: '58% female · 42% male',
  topLocations: 'Yangon, Mandalay, Naypyidaw',
  interests: ['Food & Dining', 'Restaurants', 'Coffee', 'Local cuisine', 'Lifestyle'],
}

export function AudienceInsight({ influencerName, engagedAudience, onBuildTargeting }: AudienceInsightProps) {
  const a = MOCK_AUDIENCE

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionLabel}>Engaged Audience</div>
      <div className={styles.card}>
        <div className={styles.reachRow}>
          <span className={styles.reachValue}>{formatNum(engagedAudience)}</span>
          <span className={styles.reachLabel}>people regularly engage with {influencerName}</span>
        </div>

        <div className={styles.sectionLabel}>Language</div>
        {a.languageSplit.map((l) => (
          <div key={l.label} className={styles.barRow}>
            <div className={styles.barLabelRow}>
              <span>{l.label}</span>
              <span>{l.pct}%</span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${l.pct}%` }} />
            </div>
          </div>
        ))}
        <div className={styles.note}>
          Language is a more reliable signal than location in Myanmar, where VPN use often
          masks a user&apos;s real region.
        </div>

        <div className={styles.statGrid} style={{ marginTop: 'var(--space-4)' }}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Gender</span>
            <span className={styles.statValue}>{a.genderSplit}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Top locations</span>
            <span className={styles.statValue}>{a.topLocations}</span>
          </div>
        </div>

        <div className={styles.sectionLabel} style={{ marginTop: 'var(--space-3)' }}>Age</div>
        {a.ageSplit.map((g) => (
          <div key={g.label} className={styles.barRow}>
            <div className={styles.barLabelRow}>
              <span>{g.label}</span>
              <span>{g.pct}%</span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${g.pct}%` }} />
            </div>
          </div>
        ))}

        <div className={styles.sectionLabel} style={{ marginTop: 'var(--space-3)' }}>Top interests</div>
        <div className={styles.interestTags}>
          {a.interests.map((i) => (
            <span key={i} className={styles.interestTag}>{i}</span>
          ))}
        </div>

        <button className={styles.targetBtn} onClick={onBuildTargeting}>
          <Target size={16} /> Build targeting audience
        </button>
      </div>
    </div>
  )
}