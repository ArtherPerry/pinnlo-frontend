'use client'

import { Button, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  useApproveAgency,
  usePlatformStats,
  usePendingAgencies,
} from '@/hooks/useAdminAgencies'
import styles from '../admin.module.css'

export function DashboardSection() {
  const { data: stats, isLoading } = usePlatformStats()

  if (isLoading || !stats) return <div className={styles.empty}>Loading stats…</div>

  const maxPlan = Math.max(...Object.values(stats.planBreakdown), 1)

  return (
    <>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Agencies</div>
          <div className={styles.statValue}>{stats.totalAgencies}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending</div>
          <div className={styles.statValue}>{stats.pendingAgencies}</div>
          <div className={styles.statHint}>awaiting approval</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Approved</div>
          <div className={styles.statValue}>{stats.approvedAgencies}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Suspended</div>
          <div className={styles.statValue}>{stats.suspendedAgencies}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Users</div>
          <div className={styles.statValue}>{stats.totalUsers}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Clients</div>
          <div className={styles.statValue}>{stats.totalClients}</div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Plan Distribution</div>
        {Object.entries(stats.planBreakdown).map(([plan, count]) => (
          <div key={plan} className={styles.barRow}>
            <div className={styles.barLabel}>{plan}</div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(count / maxPlan) * 100}%` }}
              />
            </div>
            <div className={styles.barValue}>{count}</div>
          </div>
        ))}
      </div>

      <PendingApprovals />
    </>
  )
}

/**
 * The approval queue, on the dashboard rather than behind a filter.
 *
 * The Pending stat card above says how many are waiting but gives no way to
 * act; without this an admin has to switch to Agencies and filter by status.
 * Signup is blocked until approval, so everyone in this list is locked out
 * right now.
 *
 * Uses the server-side pending endpoint rather than filtering the full list:
 * the dashboard needs this before the agencies list has been fetched at all.
 */

function PendingApprovals() {
  const { data: pending, isLoading } = usePendingAgencies()
  const approve = useApproveAgency()

  if (isLoading) return null

  if (!pending || pending.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Awaiting approval</div>
        <div className={styles.empty}>Nothing waiting. Every agency has been reviewed.</div>
      </div>
    )
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>Awaiting approval ({pending.length})</div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Agency</th>
            <th>Plan</th>
            <th>Signed up</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pending.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td><Badge variant="neutral">{a.plan}</Badge></td>
              <td className={styles.userEmail}>{formatDate(a.createdAt, 'en-GB')}</td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  loading={approve.isPending}
                  onClick={() => approve.mutate(a.id)}
                >
                  Approve
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}