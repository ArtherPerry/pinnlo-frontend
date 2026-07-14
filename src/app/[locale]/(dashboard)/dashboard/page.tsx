'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useDashboardStats } from '@/hooks/useDashboard'
import { usePosts } from '@/hooks/usePosts'
import { Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, MessageSquare, Calendar, ArrowRight } from 'lucide-react'
import styles from './dashboard.module.css'

interface StatCard {
  label: string
  value: number | undefined
  href: string
}

function formatDay(iso: string | null): string {
  if (!iso) return 'Unscheduled'
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats()
  const { data: pendingPosts } = usePosts('PENDING_REVIEW')
  const { data: scheduledPosts } = usePosts('SCHEDULED')
  const user = useAuth((s) => s.user)
  const locale = useLocale()

  const L = (href: string) => `/${locale}${href}`

  const cards: StatCard[] = [
    { label: 'Clients',         value: data?.totalClients,   href: '/clients' },
    { label: 'Scheduled posts', value: data?.scheduledPosts, href: '/posts' },
    { label: 'New leads',       value: data?.newLeads,       href: '/crm' },
    { label: 'Unread comments', value: data?.unreadComments, href: '/inbox' },
  ]

  const pendingCount = pendingPosts?.length ?? 0
  const unread = data?.unreadComments ?? 0
  const upcoming = (scheduledPosts ?? []).slice(0, 4)

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </h2>

      {isError ? (
        <div className={styles.stateMsg}>Couldn&apos;t load your stats. Please try again.</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className={styles.grid}>
            {cards.map((card) => (
              <Link key={card.label} href={L(card.href)} className={styles.cardLink}>
                <Card>
                  <Card.Body>
                    <div className={styles.statLabel}>{card.label}</div>
                    <div className={styles.statNum}>
                      {isLoading ? <span className={styles.skeleton} /> : card.value ?? 0}
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            ))}
          </div>

          {/* Two-column: needs attention + upcoming */}
          <div className={styles.columns}>

            {/* Needs your attention */}
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Needs your attention</h3>
              </div>

              {pendingCount === 0 && unread === 0 ? (
                <div className={styles.emptyPanel}>
                  <CheckCircle size={28} />
                  <span>You&apos;re all caught up.</span>
                </div>
              ) : (
                <div className={styles.attentionList}>
                  {pendingCount > 0 && (
                    <Link href={L('/posts/approval')} className={styles.attentionRow}>
                      <span className={styles.attentionIcon}><CheckCircle size={18} /></span>
                      <span className={styles.attentionText}>
                        <strong>{pendingCount}</strong> post{pendingCount > 1 ? 's' : ''} waiting for your review
                      </span>
                      <ArrowRight size={16} className={styles.attentionArrow} />
                    </Link>
                  )}
                  {unread > 0 && (
                    <Link href={L('/inbox')} className={styles.attentionRow}>
                      <span className={styles.attentionIcon}><MessageSquare size={18} /></span>
                      <span className={styles.attentionText}>
                        <strong>{unread}</strong> unread message{unread > 1 ? 's' : ''} in your inbox
                      </span>
                      <ArrowRight size={16} className={styles.attentionArrow} />
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Upcoming posts */}
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Upcoming posts</h3>
                <Link href={L('/posts')} className={styles.panelLink}>View all</Link>
              </div>

              {upcoming.length === 0 ? (
                <div className={styles.emptyPanel}>
                  <Calendar size={28} />
                  <span>No posts scheduled yet.</span>
                </div>
              ) : (
                <div className={styles.upcomingList}>
                  {upcoming.map((post) => (
                    <Link key={post.id} href={L('/posts')} className={styles.upcomingRow}>
                      <div className={styles.upcomingMain}>
                        <div className={styles.upcomingContent}>{post.content}</div>
                        <div className={styles.upcomingMeta}>{post.clientName}</div>
                      </div>
                      <span className={styles.upcomingDay}>{formatDay(post.scheduledAt)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

          </div>
        </>
      )}
    </div>
  )
}