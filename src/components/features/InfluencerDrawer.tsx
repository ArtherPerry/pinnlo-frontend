'use client'

import { useInfluencer } from '@/hooks/useEnterprise'
import { PlatformIcon } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'

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

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 150,
        }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '460px',
        background: 'var(--color-white)',
        borderLeft: '0.5px solid var(--color-border)',
        zIndex: 151,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.2s ease',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'var(--color-bg-2)',
              border: '0.5px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, color: 'var(--color-muted)',
            }}>
              {inf?.name.slice(0, 2).toUpperCase() ?? '..'}
            </div>
            {inf && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-h3)' }}>
                  {inf.name}
                </div>
                <div style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--color-muted)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <PlatformIcon platform={inf.platform} size={12} />
                  {inf.handle}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              border: 'none', background: 'transparent',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 18,
              color: 'var(--color-muted)',
            }}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-muted)' }}>
            Loading influencer data...
          </div>
        ) : inf ? (
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
              {[
                { value: formatFollowers(inf.followers), label: 'Followers' },
                { value: `${inf.engagementRate.toFixed(1)}%`, label: 'Engagement' },
                { value: `${inf.postsPerWeek}×/wk`, label: 'Posting freq.' },
                { value: inf.avgLikes.toLocaleString(), label: 'Avg likes' },
                { value: inf.avgComments.toLocaleString(), label: 'Avg comments' },
                { value: `${inf.score}/100`, label: 'Relevance score' },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--color-ink)' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {[
                { label: 'Location', value: inf.location },
                { label: 'Language', value: inf.language.toUpperCase() },
                { label: 'Platform', value: inf.platform },
                { label: 'Tier', value: inf.tier },
                { label: 'Email', value: inf.email ?? 'Not available' },
                { label: 'Profile', value: 'View ↗', href: inf.profileUrl },
              ].map(({ label, value, href }) => (
                <div key={label}>
                  <div style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginBottom: 2 }}>
                    {label}
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-teal-600)' }}
                    >
                      {value}
                    </a>
                  ) : (
                    <div style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-ink)' }}>
                      {value}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Categories */}
            <div>
              <div style={{
                fontSize: 'var(--text-label)', fontWeight: 600,
                color: 'var(--color-muted)', letterSpacing: '0.04em',
                marginBottom: 'var(--space-2)',
              }}>
                CATEGORIES
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                {inf.categories.map((cat) => (
                  <span key={cat} style={{
                    fontSize: 'var(--text-small)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-teal-50)',
                    color: 'var(--color-teal-600)',
                    border: '0.5px solid var(--color-teal-200)',
                    fontWeight: 500,
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent posts */}
            {inf.recentPosts.length > 0 && (
              <div>
                <div style={{
                  fontSize: 'var(--text-label)', fontWeight: 600,
                  color: 'var(--color-muted)', letterSpacing: '0.04em',
                  marginBottom: 'var(--space-3)',
                }}>
                  RECENT POSTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {inf.recentPosts.map((post) => (
                    <div key={post.id} style={{
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex', flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}>
                      <p style={{
                        fontSize: 'var(--text-body)',
                        color: 'var(--color-ink)',
                        lineHeight: 1.55,
                        margin: 0,
                      }}>
                        {post.content}
                      </p>
                      <div style={{
                        display: 'flex', gap: 'var(--space-4)',
                        fontSize: 'var(--text-small)',
                        color: 'var(--color-muted)',
                      }}>
                        <span>👍 {post.likes.toLocaleString()}</span>
                        <span><MessageCircle size={13} /> {post.comments.toLocaleString()}</span>
                        <span>↗ {post.shares.toLocaleString()}</span>
                        <span style={{ marginLeft: 'auto' }}>
                          {formatDate(post.postedAt, 'th-TH', {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-muted)' }}>
            Influencer not found
          </div>
        )}
      </div>
    </>
  )
}