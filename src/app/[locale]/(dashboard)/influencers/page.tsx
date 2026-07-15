'use client'

import { useState, useCallback } from 'react'
import { useInfluencers } from '@/hooks/useEnterprise'
import { PlatformIcon } from '@/components/ui'
import { InfluencerDrawer } from '@/components/features/InfluencerDrawer'
import { PlanGate } from '@/components/features/PlanGate'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { Influencer, InfluencerTier } from '@/lib/types'
import styles from './influencers.module.css'
import { Search } from 'lucide-react'

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

const TIER_LABEL: Record<InfluencerTier, string> = {
  NANO:  'Nano',
  MICRO: 'Micro',
  MACRO: 'Macro',
  MEGA:  'Mega',
}

const TIER_CLASS: Record<InfluencerTier, string> = {
  NANO:  styles.tierNano,
  MICRO: styles.tierMicro,
  MACRO: styles.tierMacro,
  MEGA:  styles.tierMega,
}

function InfluencerCard({
  influencer,
  onClick,
}: {
  influencer: Influencer
  onClick:    () => void
}) {
  const toast = useToast()

  const initials = influencer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (influencer.email) {
      window.location.href = `mailto:${influencer.email}`
    } else {
      toast.show('No email on record — contact via DM', 'info')
    }
  }

  return (
    <div
      className={styles.infCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.identity}>
          <div className={styles.name}>{influencer.name}</div>
          <div className={styles.handle}>
            <PlatformIcon platform={influencer.platform} size={12} />
            {influencer.handle}
          </div>
        </div>
        <span className={cn(styles.tierBadge, TIER_CLASS[influencer.tier])}>
          {TIER_LABEL[influencer.tier]}
        </span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{formatFollowers(influencer.followers)}</span>
          <span className={styles.metricLabel}>Followers</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{influencer.engagementRate.toFixed(1)}%</span>
          <span className={styles.metricLabel}>Engagement</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{influencer.postsPerWeek}×</span>
          <span className={styles.metricLabel}>Posts/week</span>
        </div>
      </div>

      <div className={styles.categories}>
        {influencer.categories.slice(0, 3).map((cat) => (
          <span key={cat} className={styles.categoryChip}>{cat}</span>
        ))}
      </div>

      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>Relevance score</span>
        <div className={styles.scoreTrack}>
          <div className={styles.scoreFill} style={{ width: `${influencer.score}%` }} />
        </div>
        <span className={styles.scoreValue}>{influencer.score}</span>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.location}>📍 {influencer.location}</span>
        <button className={styles.contactBtn} onClick={handleContact}>
          {influencer.email ? 'Email' : 'DM'}
        </button>
      </div>
    </div>
  )
}

export default function InfluencersPage() {
  const [keyword,        setKeyword       ] = useState('')
  const [debouncedKw,    setDebouncedKw   ] = useState('')
  const [tierFilter,     setTierFilter    ] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [activeId,       setActiveId      ] = useState<string | null>(null)
  const [debounceTimer,  setDebounceTimer ] = useState<ReturnType<typeof setTimeout>>()
  const [areaFilter,     setAreaFilter    ] = useState('')
  const [nicheFilter,    setNicheFilter   ] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')

  const handleSearch = useCallback((value: string) => {
    setKeyword(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => setDebouncedKw(value), 400)
    setDebounceTimer(timer)
  }, [debounceTimer])

  const { data: influencers, isLoading } = useInfluencers({
    keyword:  debouncedKw   || undefined,
    tier:     tierFilter    as InfluencerTier || undefined,
    platform: platformFilter || undefined,
  })
  const AREAS = ['Yangon', 'Mandalay', 'Naypyidaw', 'Bago', 'Mawlamyine', 'Taunggyi', 'Nationwide']
const NICHES = ['Food & Dining', 'Beauty & Cosmetics', 'Fashion', 'Lifestyle', 'Tech & Gadgets', 'Travel', 'Health & Fitness', 'Entertainment']
const LANGUAGES = ['Burmese', 'English', 'Both']

  const avgEngagement = influencers?.length
    ? influencers.reduce((s, i) => s + i.engagementRate, 0) / influencers.length
    : 0

  return (
    <PlanGate
      requiredPlan="ENTERPRISE"
      featureName="Influencer discovery"
      features={[
        'Search 10,000+ influencers across Thailand, Myanmar and Laos',
        'Filter by tier, platform, location and engagement rate',
        'Pinnalo relevance scoring for brand fit',
        'View recent posts and engagement analytics',
        'Direct email contact for collaboration',
      ]}
    >
      <div className={styles.page}>

        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
            Influencer discovery
          </h2>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginTop: '2px' }}>
            Find and evaluate influencers across Thailand, Myanmar and Laos.
          </p>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <Search size={14} />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name, handle or category..."
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="">All tiers</option>
            <option value="NANO">Nano (1K–10K)</option>
            <option value="MICRO">Micro (10K–100K)</option>
            <option value="MACRO">Macro (100K–1M)</option>
            <option value="MEGA">Mega (1M+)</option>
          </select>

          <select
            className={styles.filterSelect}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">All platforms</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
          </select>
          <select
            className={styles.filterSelect}
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            <option value="">All areas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className={styles.filterSelect}
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
          >
            <option value="">All niches</option>
            {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <select
            className={styles.filterSelect}
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {influencers && influencers.length > 0 && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{influencers.length}</div>
              <div className={styles.statLabel}>Influencers found</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{avgEngagement.toFixed(1)}%</div>
              <div className={styles.statLabel}>Avg engagement</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {influencers.filter((i) => i.email).length}
              </div>
              <div className={styles.statLabel}>Have email</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {Math.max(...influencers.map((i) => i.score))}
              </div>
              <div className={styles.statLabel}>Top relevance score</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className={styles.skeletonGrid}>
            {[1, 2, 3, 4].map((n) => <div key={n} className={styles.skeletonCard} />)}
          </div>
        )}

        {!isLoading && influencers?.length === 0 && (
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} viewBox="0 0 48 48"
                 fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M24 6l3.6 7.2L36 14.6l-6 5.8 1.4 8.2L24 24.6l-7.4 3.8 1.4-8.2-6-5.8 8.4-1.4z"/>
            </svg>
            <div className={styles.emptyTitle}>No influencers found</div>
            <div className={styles.emptySub}>
              Try a different keyword, tier, or platform filter.
            </div>
          </div>
        )}

        {!isLoading && influencers && influencers.length > 0 && (
          <div className={styles.grid}>
            {influencers.map((inf) => (
              <InfluencerCard
                key={inf.id}
                influencer={inf}
                onClick={() => setActiveId(inf.id)}
              />
            ))}
          </div>
        )}

        {activeId && (
          <InfluencerDrawer
            influencerId={activeId}
            onClose={() => setActiveId(null)}
          />
        )}

      </div>
    </PlanGate>
  )
}