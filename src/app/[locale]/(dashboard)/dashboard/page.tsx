'use client'

import { useDashboardStats } from '@/hooks/useDashboard'
import { Card } from '@/components/ui'
import styles from './dashboard.module.css'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats()
  const user = useAuth((s) => s.user)

  if (isLoading) return <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
  if (isError)   return <p style={{ color: 'var(--color-danger)' }}>Failed to load stats.</p>

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Welcome back{user?.name ? `, ${user.name}` : ''}</h2>
      <div className={styles.grid}>
        <Card>
          <Card.Body>
            <div className={styles.statLabel}>Clients</div>
            <div className={styles.statNum}>{data?.totalClients}</div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className={styles.statLabel}>Scheduled posts</div>
            <div className={styles.statNum}>{data?.scheduledPosts}</div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className={styles.statLabel}>New leads</div>
            <div className={styles.statNum}>{data?.newLeads}</div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className={styles.statLabel}>Unread comments</div>
            <div className={styles.statNum}>{data?.unreadComments}</div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}