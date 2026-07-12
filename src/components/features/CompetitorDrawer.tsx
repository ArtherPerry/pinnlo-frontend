'use client'

import React from 'react'
import { useCompetitor } from '@/hooks/useCompetitors'
import { PlatformIcon } from '@/components/ui'
import { FollowerChart } from './FollowerChart'
import { formatDate } from '@/lib/utils'
import styles from './CompetitorDrawer.module.css'

interface CompetitorDrawerProps {
  competitorId: string
  onClose:      () => void
}

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function CompetitorDrawer({ competitorId, onClose }: CompetitorDrawerProps) {
  const { data: comp, isLoading } = useCompetitor(competitorId)

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {comp?.name.slice(0, 2).toUpperCase() ?? '..'}
            </div>
            {comp && (
              <div className={styles.headerInfo}>
                <span className={styles.name}>{comp.name}</span>
                <span className={styles.sub}>
                  <PlatformIcon platform={comp.platform} size={12} />
                  {comp.clientName}
                </span>
              </div>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading competitor data...</div>
        ) : comp ? (
          <div className={styles.body}>

            {/* Key metrics */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>KEY METRICS</span>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatFollowers(comp.followers)}
                  </span>
                  <span className={styles.metricLabel}>Total followers</span>
                  <span className={`${styles.metricChange} ${comp.followerGrowth >= 0 ? styles.pos : styles.neg}`}>
                    {comp.followerGrowth >= 0 ? '▲' : '▼'} {Math.abs(comp.followerGrowth).toFixed(1)}% / 30d
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {comp.avgEngagement.toFixed(1)}%
                  </span>
                  <span className={styles.metricLabel}>Avg engagement</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {comp.postsPerWeek}
                  </span>
                  <span className={styles.metricLabel}>Posts / week</span>
                </div>
              </div>
            </div>

            {/* Follower growth chart */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>FOLLOWER GROWTH</span>
              <FollowerChart snapshots={comp.snapshots} />
            </div>

            {/* Page info */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>PAGE DETAILS</span>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Platform</span>
                  <span className={styles.infoValue}>
                    {comp.platform.charAt(0) + comp.platform.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Client compared to</span>
                  <span className={styles.infoValue}>{comp.clientName}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tracking since</span>
                  <span className={styles.infoValue}>
                    {formatDate(comp.createdAt, 'th-TH', {
                      dateStyle: 'medium',
                    })}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last synced</span>
                  <span className={styles.infoValue}>
                    {formatDate(comp.lastSyncedAt, 'th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.infoLabel}>Page URL</span>
                  <a
                    href={comp.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.pageLink}
                  >
                    {comp.pageUrl} ↗
                  </a>
                </div>
              </div>
            </div>

            {/* AI insights */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>INSIGHTS</span>
              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Posting frequency</div>
                  <div className={styles.insightBody}>
                    {comp.postsPerWeek >= 5
                      ? `${comp.name} posts aggressively at ${comp.postsPerWeek}×/week. Match their cadence or focus on quality.`
                      : `${comp.name} posts ${comp.postsPerWeek}×/week. Posting more frequently could close the gap.`
                    }
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Engagement rate</div>
                  <div className={styles.insightBody}>
                    {comp.avgEngagement >= 3
                      ? `${comp.avgEngagement.toFixed(1)}% is a strong engagement rate. Study their content style.`
                      : `${comp.avgEngagement.toFixed(1)}% is below industry average (3%). An opportunity to outperform.`
                    }
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Follower growth</div>
                  <div className={styles.insightBody}>
                    {comp.followerGrowth > 2
                      ? `Growing fast at +${comp.followerGrowth.toFixed(1)}%/month. Check what campaigns they're running.`
                      : comp.followerGrowth > 0
                        ? `Steady growth at +${comp.followerGrowth.toFixed(1)}%/month. Consistent but not aggressive.`
                        : `Declining at ${comp.followerGrowth.toFixed(1)}%/month. A window to gain ground.`
                    }
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Overall threat level</div>
                  <div className={styles.insightBody}>
                    {comp.followers > 500000
                      ? 'Established brand with major reach. Focus on niche engagement rather than follower count.'
                      : comp.followers > 100000
                        ? 'Significant competitor. Monitor content strategy and posting schedule closely.'
                        : 'Emerging competitor. You have an opportunity to outpace them now.'
                    }
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className={styles.loading}>Competitor not found</div>
        )}
      </div>
    </>
  )
}