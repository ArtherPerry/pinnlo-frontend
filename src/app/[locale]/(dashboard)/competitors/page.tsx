'use client'

import { useState } from 'react'
import {
  useCompetitors,
  useRemoveCompetitor,
  useSyncCompetitor,
} from '@/hooks/useCompetitors'
import { useClients } from '@/hooks/useClients'
import { Button, PlatformIcon } from '@/components/ui'
import { AddCompetitorModal } from '@/components/features/AddCompetitorModal'
import { CompetitorDrawer } from '@/components/features/CompetitorDrawer'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { Competitor } from '@/lib/types'
import styles from './competitors.module.css'

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

function SparkLine({ snapshots }: { snapshots: Competitor['snapshots'] }) {
  if (!snapshots || snapshots.length === 0) {
    return <span className={styles.sparkLabel}>No data yet</span>
  }

  const last14 = snapshots.slice(-14)
  const values = last14.map((s) => s.followers)
  const min    = Math.min(...values)
  const max    = Math.max(...values)
  const range  = max - min || 1

  return (
    <div className={styles.sparkRow}>
      <div className={styles.sparkBars}>
        {last14.map((snap, i) => {
          const pct = ((snap.followers - min) / range) * 100
          return (
            <div
              key={i}
              className={styles.sparkBar}
              style={{ height: `${Math.max(8, pct)}%` }}
              title={`${snap.date}: ${snap.followers.toLocaleString()}`}
            />
          )
        })}
      </div>
      <span className={styles.sparkLabel}>14 days</span>
    </div>
  )
}

export default function CompetitorsPage() {
  const [showForm,        setShowForm       ] = useState(false)
  const [clientFilter,    setClientFilter   ] = useState<string | undefined>()
  const [activeCompetitor,setActiveCompetitor] = useState<string | null>(null)

  const { data: competitors, isLoading } = useCompetitors(clientFilter)
  const { data: clients }                = useClients()
  const removeCompetitor                 = useRemoveCompetitor()
  const syncCompetitor                   = useSyncCompetitor()
  const toast                            = useToast()

  const handleRemove = async (
    e: React.MouseEvent,
    id: string,
    name: string
  ) => {
    e.stopPropagation()
    if (!confirm(`Remove ${name} from tracking?`)) return
    try {
      await removeCompetitor.mutateAsync(id)
      toast.show('Competitor removed', 'success')
    } catch {
      toast.show('Failed to remove competitor', 'error')
    }
  }

  const handleSync = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await syncCompetitor.mutateAsync(id)
      toast.show('Sync triggered — data will update shortly', 'info')
    } catch {
      toast.show('Sync failed', 'error')
    }
  }

  const totalFollowers  = competitors?.reduce((s, c) => s + c.followers, 0) ?? 0
  const avgEngagement   = competitors?.length
    ? competitors.reduce((s, c) => s + c.avgEngagement, 0) / competitors.length
    : 0
  const avgPostsPerWeek = competitors?.length
    ? competitors.reduce((s, c) => s + c.postsPerWeek, 0) / competitors.length
    : 0

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
            Competitors
          </h2>

          {/* Client filter */}
          <select
            style={{
              height: '32px', padding: '0 var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-small)',
              background: 'var(--color-white)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
            }}
            value={clientFilter ?? ''}
            onChange={(e) => setClientFilter(e.target.value || undefined)}
          >
            <option value="">All clients</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          + Track competitor
        </Button>
      </div>

      {/* Stats row */}
      {competitors && competitors.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{competitors.length}</div>
            <div className={styles.statLabel}>Competitors tracked</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {formatFollowers(totalFollowers)}
            </div>
            <div className={styles.statLabel}>Combined followers</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {avgEngagement.toFixed(1)}%
            </div>
            <div className={styles.statLabel}>Avg engagement rate</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {avgPostsPerWeek.toFixed(1)}
            </div>
            <div className={styles.statLabel}>Avg posts per week</div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && competitors?.length === 0 && (
        <div className={styles.empty}>
          <svg
            className={styles.emptyIcon}
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="18" cy="24" r="10"/>
            <circle cx="30" cy="24" r="10"/>
          </svg>
          <div className={styles.emptyTitle}>No competitors tracked yet</div>
          <div className={styles.emptySub}>
            Add a competitor&apos;s Facebook or Instagram page to start
            monitoring their follower growth and engagement.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Track first competitor
          </Button>
        </div>
      )}

      {/* Competitor grid */}
      {!isLoading && competitors && competitors.length > 0 && (
        <div className={styles.grid}>
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className={styles.compCard}
              onClick={() => setActiveCompetitor(comp.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Header */}
              <div className={styles.compHeader}>
                <div className={styles.compIdentity}>
                  <div className={styles.compAvatar}>
                    {comp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.compName}>{comp.name}</div>
                    <div className={styles.compClient}>{comp.clientName}</div>
                  </div>
                </div>

                <div className={styles.compActions}>
                  <PlatformIcon platform={comp.platform} size={14} />
                  <button
                    className={cn(styles.iconBtn)}
                    onClick={(e) => handleSync(e, comp.id)}
                    title="Sync now"
                    disabled={syncCompetitor.isPending}
                  >
                    ↻
                  </button>
                  <button
                    className={cn(styles.iconBtn, styles.iconBtnDanger)}
                    onClick={(e) => handleRemove(e, comp.id, comp.name)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>
                    {formatFollowers(comp.followers)}
                  </span>
                  <span className={styles.metricLabel}>Followers</span>
                </div>
                <div className={styles.metric}>
                  <span
                    className={styles.metricValue}
                    style={{
                      color: comp.followerGrowth >= 0
                        ? 'var(--color-success)'
                        : 'var(--color-danger)',
                    }}
                  >
                    {comp.followerGrowth >= 0 ? '+' : ''}
                    {comp.followerGrowth.toFixed(1)}%
                  </span>
                  <span className={styles.metricLabel}>30d growth</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>
                    {comp.avgEngagement.toFixed(1)}%
                  </span>
                  <span className={styles.metricLabel}>Engagement</span>
                </div>
              </div>

              {/* Sparkline */}
              <SparkLine snapshots={comp.snapshots} />

              {/* Footer */}
              <div className={styles.compFooter}>
                <span className={styles.syncTime}>
                  {comp.postsPerWeek} posts/week
                </span>
                <button
                  className={styles.syncBtn}
                  onClick={(e) => handleSync(e, comp.id)}
                >
                  Sync data →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add competitor modal */}
      {showForm && (
        <AddCompetitorModal onClose={() => setShowForm(false)} />
      )}

      {/* Competitor detail drawer */}
      {activeCompetitor && (
        <CompetitorDrawer
          competitorId={activeCompetitor}
          onClose={() => setActiveCompetitor(null)}
        />
      )}

    </div>
  )
}