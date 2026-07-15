'use client'

import { useState } from 'react'
import { useInfluencer } from '@/hooks/useEnterprise'
import { PlatformIcon } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { MessageCircle, ThumbsUp, Share2 } from 'lucide-react'
import { AudienceInsight } from './AudienceInsight'
import { TargetingPlan } from './TargetingPlan'
import styles from './InfluencerDrawer.module.css'

interface InfluencerDrawerProps {
  influencerId: string
  onClose:      () => void
}

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function InfluencerDrawer({ influencerId, onClose }: InfluencerDrawerProps) {
  const { data: inf, isLoading } = useInfluencer(influencerId)
  const [showTargeting, setShowTargeting] = useState(false)

  const engagedAudience = inf
    ? Math.round(inf.followers * (inf.engagementRate / 100) * 8)
    : 0

  return (
    <>
      <div
        className={styles.overlay}
        onClick={onClose}
      />
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {inf?.name.slice(0, 2).toUpperCase() ?? '..'}
            </div>
            {inf && (
              <div>
                <div className={styles.name}>
                  {inf.name}
                </div>
                <div className={styles.handle}>
                  <PlatformIcon platform={inf.platform} size={12} />
                  {inf.handle}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={styles.closeBtn}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className={styles.stateMessage}>
            Loading influencer data...
          </div>
        ) : inf ? (
          showTargeting ? (
            /* ── TARGETING STEP (replaces audience view) ── */
            <div className={styles.targetingWrap}>
              <TargetingPlan
                influencerName={inf.name}
                engagedAudience={engagedAudience}
                onBack={() => setShowTargeting(false)}
              />
            </div>
          ) : (
            /* ── DETAIL + AUDIENCE VIEW ── */
            <div className={styles.detail}>

              {/* Metrics */}
              <div className={styles.metricsGrid}>
                {[
                  { value: formatFollowers(inf.followers), label: 'Followers' },
                  { value: `${inf.engagementRate.toFixed(1)}%`, label: 'Engagement' },
                  { value: `${inf.postsPerWeek}×/wk`, label: 'Posting freq.' },
                  { value: inf.avgLikes.toLocaleString(), label: 'Avg likes' },
                  { value: inf.avgComments.toLocaleString(), label: 'Avg comments' },
                  { value: `${inf.score}/100`, label: 'Relevance score' },
                ].map(({ value, label }) => (
                  <div key={label} className={styles.metricBox}>
                    <div className={styles.metricValue}>
                      {value}
                    </div>
                    <div className={styles.metricLabel}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className={styles.infoGrid}>
                {[
                  { label: 'Location', value: inf.location },
                  { label: 'Language', value: inf.language.toUpperCase() },
                  { label: 'Platform', value: inf.platform },
                  { label: 'Tier', value: inf.tier },
                  { label: 'Email', value: inf.email ?? 'Not available' },
                  { label: 'Profile', value: 'View ↗', href: inf.profileUrl },
                ].map(({ label, value, href }) => (
                  <div key={label}>
                    <div className={styles.infoLabel}>
                      {label}
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.infoLink}
                      >
                        {value}
                      </a>
                    ) : (
                      <div className={styles.infoValue}>
                        {value}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div>
                <div className={styles.categoriesLabel}>
                  CATEGORIES
                </div>
                <div className={styles.categoriesWrap}>
                  {inf.categories.map((cat) => (
                    <span key={cat} className={styles.categoryChip}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent posts */}
              {inf.recentPosts.length > 0 && (
                <div>
                  <div className={styles.recentPostsLabel}>
                    RECENT POSTS
                  </div>
                  <div className={styles.postsWrap}>
                    {inf.recentPosts.map((post) => (
                      <div key={post.id} className={styles.postCard}>
                        <p className={styles.postContent}>
                          {post.content}
                        </p>
                        <div className={styles.postMeta}>
                          <span className={styles.postStat}>
                            <ThumbsUp size={13} /> {post.likes.toLocaleString()}
                          </span>
                          <span className={styles.postStat}>
                            <MessageCircle size={13} /> {post.comments.toLocaleString()}
                          </span>
                          <span className={styles.postStat}>
                            <Share2 size={13} /> {post.shares.toLocaleString()}
                          </span>
                          <span className={styles.postDate}>
                            {formatDate(post.postedAt, 'en', {
                              dateStyle: 'medium',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience insight + reverse-advertise entry point */}
              <AudienceInsight
                influencerName={inf.name}
                engagedAudience={engagedAudience}
                onBuildTargeting={() => setShowTargeting(true)}
              />

            </div>
          )
        ) : (
          <div className={styles.stateMessage}>
            Influencer not found
          </div>
        )}
      </div>
    </>
  )
}
