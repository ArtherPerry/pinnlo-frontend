'use client'

import { useMemo, useState } from 'react'
import {
  useConnections,
  useCheckConnection,
  type AdminConnection,
  type ConnectionReason,
  type ConnectionSeverity,
} from '@/hooks/useAdminConnections'
import styles from './connections.module.css'

/** Dates in Bangkok time, matching the rest of the admin panel. */
const ZONE = 'Asia/Bangkok'

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
}

/**
 * "Valid", not "Healthy": a passed check means Meta confirmed the token at
 * that moment, and nothing more.
 */
const SEVERITY_LABEL: Record<ConnectionSeverity, string> = {
  FAILED: 'Failed',
  WARNING: 'Warning',
  UNKNOWN: 'Not checked',
  OK: 'Valid',
}

export function ConnectionsSection() {
  const { data, isLoading, isError, refetch } = useConnections()
  const check = useCheckConnection()
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<ConnectionSeverity, number> = { FAILED: 0, WARNING: 0, UNKNOWN: 0, OK: 0 }
    for (const x of data ?? []) c[x.severity] += 1
    return c
  }, [data])

  if (isLoading) return <p className={styles.muted}>Loading connections…</p>

  if (isError || !data) {
    return (
      <div className={styles.errorBox} role="alert">
        <span>Connections could not be loaded.</span>
        <button type="button" className={styles.button} onClick={() => refetch()}>
          Try again
        </button>
      </div>
    )
  }

  const busy = checkingId !== null || progress !== null

  const checkOne = async (c: AdminConnection) => {
    setError(null)
    setCheckingId(c.id)
    try {
      await check.mutateAsync({ source: c.source, id: c.id })
    } catch {
      setError(`Could not check ${c.clientName}'s ${PLATFORM_NAMES[c.platform] ?? c.platform}.`)
    } finally {
      setCheckingId(null)
    }
  }

  // One after another rather than all at once, to stay well within Meta's
  // rate limits. A failure on one does not stop the rest.
  const checkAll = async () => {
    setError(null)
    const list = [...data]
    setProgress({ done: 0, total: list.length })
    let failures = 0
    for (let i = 0; i < list.length; i++) {
      setCheckingId(list[i].id)
      try {
        await check.mutateAsync({ source: list[i].source, id: list[i].id })
      } catch {
        failures += 1
      }
      setProgress({ done: i + 1, total: list.length })
    }
    setCheckingId(null)
    setProgress(null)
    if (failures > 0) setError(`${failures} of ${list.length} checks could not be completed.`)
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          {summaryText(data.length, counts)}
        </p>
        {data.length > 0 && (
          <button type="button" className={styles.button} onClick={checkAll} disabled={busy}>
            {progress ? `Checking ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : 'Check all'}
          </button>
        )}
      </div>

      <p className={styles.explainer}>
        Meta does not tell apps when a connection stops working. Checking asks Meta directly whether
        each token is valid, whether it still has the permission needed to publish, and when access
        to the account&apos;s data ends.
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {data.length === 0 ? (
        <p className={styles.emptyNote}>No active connections yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Account</th>
                <th scope="col">Status</th>
                <th scope="col">Data access ends</th>
                <th scope="col">Last checked</th>
                <th scope="col">
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={`${c.source}-${c.id}`}>
                  <td>
                    <div className={styles.strong}>{c.clientName}</div>
                    <div className={styles.muted}>{c.agencyName}</div>
                  </td>
                  <td>
                    <div>{PLATFORM_NAMES[c.platform] ?? c.platform}</div>
                    <div className={styles.muted}>{c.account ?? '—'}</div>
                  </td>
                  <td>
                    <StatusCell c={c} />
                  </td>
                  <td>
                    <DataAccessCell iso={c.dataAccessExpiresAt} />
                  </td>
                  <td className={styles.muted}>{relative(c.lastCheckedAt)}</td>
                  <td className={styles.actions}>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => checkOne(c)}
                      disabled={busy}
                    >
                      {checkingId === c.id ? 'Checking…' : 'Check now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusCell({ c }: { c: AdminConnection }) {
  const cls =
    c.severity === 'FAILED'
      ? styles.badgeFailed
      : c.severity === 'WARNING'
        ? styles.badgeWarn
        : c.severity === 'OK'
          ? styles.badgeOk
          : styles.badgeUnknown

  return (
    <div className={styles.status}>
      {/* The word carries the meaning; colour only reinforces it. */}
      <span className={`${styles.badge} ${cls}`}>{SEVERITY_LABEL[c.severity]}</span>
      {c.reasons.map((r) => (
        <span key={r} className={styles.reason}>
          {reasonText(r, c)}
        </span>
      ))}
      {c.severity === 'UNKNOWN' && <span className={styles.reason}>Not yet confirmed with Meta.</span>}
    </div>
  )
}

function DataAccessCell({ iso }: { iso: string | null }) {
  if (!iso) return <span className={styles.muted}>—</span>
  const days = daysUntil(iso)
  const soon = days <= 14
  return (
    <div>
      <div className={soon ? styles.soon : undefined}>{fullDate(iso)}</div>
      <div className={styles.muted}>{days < 0 ? 'ended' : days === 0 ? 'today' : `in ${days} days`}</div>
    </div>
  )
}

function reasonText(r: ConnectionReason, c: AdminConnection): string {
  switch (r) {
    case 'INVALID_TOKEN':
      return c.checkError ?? 'Meta reports this token is no longer valid.'
    case 'TOKEN_EXPIRED':
      return 'The token has expired. The client needs to reconnect.'
    case 'MISSING_PERMISSION':
      return `Missing permission ${c.missingScopes.join(', ')}, so it cannot publish.`
    case 'QUALITY_RED':
      return 'WhatsApp quality is rated red. Marketing messages may stop delivering.'
    case 'DATA_ACCESS_ENDED':
      return 'Data access has ended. The client needs to reconnect.'
    case 'TOKEN_EXPIRING':
      return c.tokenExpiresAt ? `Token expires ${fullDate(c.tokenExpiresAt)}.` : 'Token expires soon.'
    case 'DATA_ACCESS_ENDING':
      return 'Data access ends soon. The client needs to reconnect before then.'
    case 'QUALITY_YELLOW':
      return 'WhatsApp quality is rated yellow.'
    case 'CHECK_UNVERIFIED':
      return 'The last check could not reach Meta. This says nothing about the connection.'
  }
}

function summaryText(total: number, c: Record<ConnectionSeverity, number>) {
  if (total === 0) return 'No active connections.'
  const parts: string[] = []
  if (c.FAILED) parts.push(`${c.FAILED} failed`)
  if (c.WARNING) parts.push(`${c.WARNING} with a warning`)
  if (c.UNKNOWN) parts.push(`${c.UNKNOWN} not checked yet`)
  const head = `${total} ${total === 1 ? 'connection' : 'connections'}`
  return parts.length ? `${head}: ${parts.join(', ')}.` : `${head}, all valid at their last check.`
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: ZONE,
  })
}

function daysUntil(iso: string) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function relative(iso: string | null) {
  if (!iso) return 'Never'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  return fullDate(iso)
}