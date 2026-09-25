'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  useAllUsage,
  useGrantUsage,
  type AgencyUsage,
  type MetricUsage,
  type UsageMetricKey,
} from '@/hooks/useAdminUsage'
import styles from './usage.module.css'

const count = new Intl.NumberFormat('en-US')

const METRIC_ORDER: UsageMetricKey[] = ['AI_REVIEW', 'EMAIL_SENT', 'WHATSAPP_MESSAGE']

const METRIC_NAMES: Record<UsageMetricKey, string> = {
  AI_SUMMARY: 'AI summary', 
  AI_REVIEW: 'AI review',
  EMAIL_SENT: 'Email',
  WHATSAPP_MESSAGE: 'WhatsApp',
}

/** Singular/plural units, used in sentences like "Granted 500 emails". */
const METRIC_UNITS: Record<UsageMetricKey, [string, string]> = {
   AI_SUMMARY: ['AI summary', 'AI summaries'],
  AI_REVIEW: ['AI review', 'AI reviews'],
  EMAIL_SENT: ['email', 'emails'],
  WHATSAPP_MESSAGE: ['WhatsApp message', 'WhatsApp messages'],
}

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
}

/** Matches the dashboard: flagged at 80%, failed at the limit. */
const NEAR_LIMIT = 0.8

export function UsageSection() {
  const { data, isLoading, isError, refetch } = useAllUsage()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Closest to a limit first, so the agencies needing attention are on top.
  // Unlimited and not-included metrics cannot be near a limit, so they rank
  // below every capped one.
  const rows = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => {
      const d = peak(b) - peak(a)
      return d !== 0 ? d : a.agencyName.localeCompare(b.agencyName)
    })
  }, [data])

  if (isLoading) return <p className={styles.muted}>Loading usage…</p>

  if (isError || !data) {
    return (
      <div className={styles.errorBox} role="alert">
        <span>Usage could not be loaded.</span>
        <button type="button" className={styles.button} onClick={() => refetch()}>
          Try again
        </button>
      </div>
    )
  }

  const nearLimit = rows.filter((r) => peak(r) >= NEAR_LIMIT).length
  const selected = rows.find((r) => r.agencyId === selectedId) ?? null

  return (
    <div className={styles.root}>
      <p className={styles.summary}>
        {count.format(rows.length)} {rows.length === 1 ? 'agency' : 'agencies'}
        {nearLimit > 0 && (
          <>
            , <strong>{nearLimit}</strong> at or above 80% of a limit
          </>
        )}
        .
      </p>

      <div className={`${styles.layout} ${selected ? styles.layoutWithDetail : ''}`}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Agency</th>
                <th scope="col">Renews</th>
                {METRIC_ORDER.map((m) => (
                  <th key={m} scope="col">
                    {METRIC_NAMES[m]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.agencyId}
                  className={r.agencyId === selectedId ? styles.rowSelected : undefined}
                >
                  <td>
                    {/* The name is the control, so rows stay keyboard reachable
                        without making the whole row a click target. */}
                    <button
                      type="button"
                      className={styles.agencyButton}
                      onClick={() => setSelectedId(r.agencyId === selectedId ? null : r.agencyId)}
                      aria-expanded={r.agencyId === selectedId}
                    >
                      {r.agencyName}
                    </button>
                    <div className={styles.agencyMeta}>
                      {PLAN_NAMES[r.plan] ?? r.plan}
                      {r.status === 'SUSPENDED' && <span className={styles.suspended}>Suspended</span>}
                    </div>
                  </td>
                  <td className={styles.renews}>{shortDate(r.periodEnd)}</td>
                  {METRIC_ORDER.map((m) => (
                    <td key={m}>
                      <MetricCell usage={r.metrics.find((x) => x.metric === m)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && <DetailPanel agency={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  )
}

// ── One metric in the table ────────────────────────────────────────

function MetricCell({ usage }: { usage?: MetricUsage }) {
  if (!usage || !usage.included) {
    return <span className={styles.muted}>Not in plan</span>
  }
  if (usage.unlimited) {
    return (
      <div className={styles.cell}>
        <span className={styles.cellText}>{count.format(usage.used)} used</span>
        <span className={styles.muted}>Unlimited</span>
      </div>
    )
  }
  const limit = usage.limit ?? 0
  const ratio = limit > 0 ? usage.used / limit : 0
  const state = ratio >= 1 ? 'failed' : ratio >= NEAR_LIMIT ? 'warn' : 'ok'

  return (
    <div className={styles.cell}>
      <span className={styles.cellText}>
        {count.format(usage.used)} of {count.format(limit)}
        {/* Status in words as well as colour. */}
        {state === 'failed' && <span className={styles.labelFailed}>Limit reached</span>}
        {state === 'warn' && <span className={styles.labelWarn}>{Math.round(ratio * 100)}%</span>}
      </span>
      <div className={styles.bar} aria-hidden="true">
        <div
          className={`${styles.barFill} ${state === 'failed' ? styles.fillFailed : state === 'warn' ? styles.fillWarn : ''}`}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Detail and grant ───────────────────────────────────────────────

function DetailPanel({ agency, onClose }: { agency: AgencyUsage; onClose: () => void }) {
  const grant = useGrantUsage()
  const grantable = agency.metrics.filter((m) => m.included && !m.unlimited)
  const [metric, setMetric] = useState<UsageMetricKey | ''>(grantable[0]?.metric ?? '')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const parsed = Number(amount)
  const valid = metric !== '' && Number.isInteger(parsed) && parsed >= 1 && parsed <= 100_000

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
       if (!valid) return
    setMessage(null)
    try {
      await grant.mutateAsync({ agencyId: agency.agencyId, metric, amount: parsed })
      const [one, many] = METRIC_UNITS[metric]
      setMessage({
        kind: 'ok',
        text: `Granted ${count.format(parsed)} ${parsed === 1 ? one : many}. Recorded in the audit log.`,
      })
      setAmount('')
    } catch (err) {
      const text =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'The grant could not be saved.'
      setMessage({ kind: 'error', text })
    }
  }

  return (
    <aside className={styles.detail} aria-labelledby="usage-detail-heading">
      <div className={styles.detailHead}>
        <div>
          <h2 id="usage-detail-heading" className={styles.detailTitle}>
            {agency.agencyName}
          </h2>
          <p className={styles.muted}>
            {PLAN_NAMES[agency.plan] ?? agency.plan} plan, period started{' '}
            {shortDate(agency.periodStart)}, renews {shortDate(agency.periodEnd)}
          </p>
        </div>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close details">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <dl className={styles.metricList}>
        {METRIC_ORDER.map((key) => {
          const m = agency.metrics.find((x) => x.metric === key)
          return (
            <div key={key} className={styles.metricRow}>
              <dt>{METRIC_NAMES[key]}</dt>
              <dd>{describeMetric(m)}</dd>
            </div>
          )
        })}
      </dl>

      {grantable.length === 0 ? (
        <p className={styles.note}>
          Nothing to grant: this plan is either unlimited or does not include these features.
        </p>
      ) : (
        <form className={styles.grantForm} onSubmit={submit}>
          <h3 className={styles.formTitle}>Grant extra allowance</h3>

          <label className={styles.field}>
            <span>Resource</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value as UsageMetricKey)}>
              {grantable.map((m) => (
                <option key={m.metric} value={m.metric}>
                  {METRIC_NAMES[m.metric]}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Amount</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </label>

          {/* Spell out the consequence: it is paid, temporary, and audited. */}
          <p className={styles.note}>
            Applies to this billing period only and resets on {shortDate(agency.periodEnd)}. Grants
            are recorded in the audit log.
          </p>

          <button
            type="submit"
            className={`${styles.button} ${styles.primary}`}
            disabled={!valid || grant.isPending}
          >
            {grant.isPending ? 'Granting…' : 'Grant allowance'}
          </button>

          {message && (
            <p
              className={message.kind === 'ok' ? styles.success : styles.error}
              role={message.kind === 'error' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          )}
        </form>
      )}
    </aside>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

/** The highest fraction of any capped limit used; -1 when nothing is capped. */
function peak(a: AgencyUsage): number {
  let best = -1
  for (const m of a.metrics) {
    if (m.included && !m.unlimited && m.limit && m.limit > 0) {
      best = Math.max(best, m.used / m.limit)
    }
  }
  return best
}

function describeMetric(m?: MetricUsage): string {
  if (!m || !m.included) return 'Not included in this plan'
  if (m.unlimited) return `${count.format(m.used)} used, unlimited`
  const limit = m.limit ?? 0
  const remaining = Math.max(limit - m.used, 0)
  const extra = m.extraAllowance > 0 ? `, including ${count.format(m.extraAllowance)} granted` : ''
  return `${count.format(m.used)} of ${count.format(limit)} used, ${count.format(remaining)} left${extra}`
}

function shortDate(iso?: string) {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}