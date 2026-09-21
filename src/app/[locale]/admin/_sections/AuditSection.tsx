'use client'

import { Badge } from '@/components/ui'
import {
  useAuditLogs,
} from '@/hooks/useAdminAgencies'
import { formatAction, actionVariant } from '../_lib/format'
import styles from '../admin.module.css'

export function AuditSection() {
  const { data: logs, isLoading } = useAuditLogs()

  if (isLoading || !logs) return <div className={styles.empty}>Loading audit log…</div>
  if (logs.length === 0) return <div className={styles.empty}>No admin actions recorded yet.</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Action</th>
          <th>Target</th>
          <th>By</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>
              <Badge variant={actionVariant(log.action)}>{formatAction(log.action)}</Badge>
              {/* Context recorded with the action, such as a grant's payment reference. */}
              {log.detail && <div className={styles.userEmail}>{log.detail}</div>}
            </td>
            <td>
              <div className={styles.userName}>{log.targetName ?? '—'}</div>
              <div className={styles.userEmail}>{log.targetType}</div>
            </td>
            <td>{log.actorName}</td>
            <td className={styles.userEmail}>{new Date(log.createdAt).toLocaleString('en-GB')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}