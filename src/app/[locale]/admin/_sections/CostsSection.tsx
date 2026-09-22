'use client'

import { useState } from 'react'
import {
  useCosts,
  useCostRates,
  useSetCostRate,
  useCancelCostRate,
  type AgencyCost,
  type ChannelTotal,
  type CostTrendPoint,
  type MetricRates,
  type RateRow,
} from '@/hooks/useAdminCosts'
import type { UsageMetricKey } from '@/hooks/useAdminUsage'
import styles from './costs.module.css'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const count = new Intl.NumberFormat('en-US')
/** Unit rates run to six decimals ($0.00095 per email). */
const rateFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

/** Rates start at midnight Bangkok, so dates must be shown in Bangkok time. */
const ZONE = 'Asia/Bangkok'

const METRIC_ORDER: UsageMetricKey[] = ['AI_REVIEW', 'EMAIL_SENT', 'WHATSAPP_MESSAGE']
const METRIC_NAMES: Record<UsageMetricKey, string> = {
  AI_REVIEW: 'AI review',
  EMAIL_SENT: 'Email',
  WHATSAPP_MESSAGE: 'WhatsApp',
}
const PER_UNIT: Record<UsageMetricKey, string> = {
  AI_REVIEW: 'per review',
  EMAIL_SENT: 'per email',
  WHATSAPP_MESSAGE: 'per message',
}
const UNITS_OF_1000: Record<UsageMetricKey, string> = {
  AI_REVIEW: '1,000 AI reviews',
  EMAIL_SENT: '1,000 emails',
  WHATSAPP_MESSAGE: '1,000 WhatsApp messages',
}
const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
}

export function CostsSection() {
  const [days, setDays] = useState<30 | 90>(30)
  const costs = useCosts(days)
  const rates = useCostRates()

  return (
    <div className={styles.root}>
      <p className={styles.explainer}>
        Estimated from usage multiplied by the unit rate in force when each action happened. These
        are estimates, not supplier invoices.
      </p>

      <section className={styles.panel} aria-labelledby="cost-over-time">
        <div className={styles.panelHead}>
          <div>
            <h2 id="cost-over-time" className={styles.panelTitle}>
              Estimated cost, last {days} days
            </h2>
            {costs.data && <p className={styles.total}>{usd.format(costs.data.total)}</p>}
          </div>
          <div className={styles.toggle} role="group" aria-label="Range">
            {([30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.toggleButton} ${days === d ? styles.toggleActive : ''}`}
                aria-pressed={days === d}
                onClick={() => setDays(d)}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {costs.isLoading && <p className={styles.muted}>Loading…</p>}
        {costs.isError && <p className={styles.error}>Cost data could not be loaded.</p>}
        {costs.data &&
          (costs.data.total === 0 ? (
            <p className={styles.emptyNote}>
              No metered usage in this period. Costs appear once agencies use AI review, email or
              WhatsApp.
            </p>
          ) : (
            <div className={styles.overTime}>
              <TrendChart points={costs.data.trend} />
              <ChannelBars channels={costs.data.byChannel} />
            </div>
          ))}
      </section>

      {costs.data && <AgencyTable rows={costs.data.byAgency} />}

      <section className={styles.panel} aria-labelledby="rates-heading">
        <div className={styles.panelHead}>
          <div>
            <h2 id="rates-heading" className={styles.panelTitle}>
              Unit cost rates
            </h2>
            <p className={styles.muted}>
              A new rate applies only from its start. Costs already recorded keep the rate that was
              in force at the time.
            </p>
          </div>
        </div>
        {rates.isLoading && <p className={styles.muted}>Loading…</p>}
        {rates.isError && <p className={styles.error}>Rates could not be loaded.</p>}
        {rates.data && <RatesPanel rates={rates.data} />}
      </section>
    </div>
  )
}

// ── Cost over time ─────────────────────────────────────────────────

function TrendChart({ points }: { points: CostTrendPoint[] }) {
  const w = 600
  const h = 160
  const peak = Math.max(...points.map((p) => p.cost), 0)
  const max = niceMax(peak)
  const line = points
    .map((p, i) => `${((i / Math.max(points.length - 1, 1)) * w).toFixed(1)},${(h - (p.cost / max) * h).toFixed(1)}`)
    .join(' ')

  return (
    <div className={styles.chart}>
      <div className={styles.chartAxis} aria-hidden="true">
        <span>{usd.format(max)}</span>
        <span>{usd.format(max / 2)}</span>
        <span>{usd.format(0)}</span>
      </div>
      <div className={styles.chartPlot}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className={styles.chartSvg}
          role="img"
          aria-label={`Daily estimated cost, peaking at ${usd.format(peak)}`}
        >
          {[0, 0.5, 1].map((g) => (
            <line key={g} x1="0" x2={w} y1={h - g * h} y2={h - g * h} className={styles.gridLine} vectorEffect="non-scaling-stroke" />
          ))}
          <polyline points={line} fill="none" className={styles.trendLine} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className={styles.chartDates} aria-hidden="true">
          <span>{dayLabel(points[0]?.date)}</span>
          <span>{dayLabel(points[Math.floor(points.length / 2)]?.date)}</span>
          <span>{dayLabel(points[points.length - 1]?.date)}</span>
        </div>
      </div>
    </div>
  )
}

function ChannelBars({ channels }: { channels: ChannelTotal[] }) {
  return (
    <div className={styles.channels}>
      {channels.map((c) => (
        <div key={c.metric} className={styles.channel}>
          <div className={styles.channelHead}>
            <span>{METRIC_NAMES[c.metric]}</span>
            <span className={styles.strong}>
              {usd.format(c.cost)} <span className={styles.muted}>({c.share}%)</span>
            </span>
          </div>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${c.share}%` }} />
          </div>
          <span className={styles.muted}>{count.format(c.units)} used</span>
        </div>
      ))}
    </div>
  )
}

// ── Cost by agency ─────────────────────────────────────────────────

function AgencyTable({ rows }: { rows: AgencyCost[] }) {
  const total = rows.reduce((a, r) => a + r.cost, 0)
  return (
    <section className={styles.panel} aria-labelledby="by-agency">
      <div className={styles.panelHead}>
        <div>
          <h2 id="by-agency" className={styles.panelTitle}>
            Cost by agency, last 30 days
          </h2>
          <p className={styles.muted}>Compare against each plan&apos;s price to spot agencies that cost more than they pay.</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className={styles.emptyNote}>No agency has used a metered resource in the last 30 days.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Agency</th>
                {METRIC_ORDER.map((m) => (
                  <th key={m} scope="col" className={styles.num}>
                    {METRIC_NAMES[m]}
                  </th>
                ))}
                <th scope="col" className={styles.num}>Estimated cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.agencyId}>
                  <td>
                    <div className={styles.strong}>{r.agencyName}</div>
                    <div className={styles.muted}>{r.plan ? PLAN_NAMES[r.plan] ?? r.plan : '—'}</div>
                  </td>
                  {METRIC_ORDER.map((m) => (
                    <td key={m} className={styles.num}>
                      {count.format(r.units[m] ?? 0)}
                    </td>
                  ))}
                  <td className={styles.num}>
                    <div className={styles.strong}>{usd.format(r.cost)}</div>
                    <div className={styles.shareBar} aria-hidden="true">
                      <div
                        className={styles.barFill}
                        style={{ width: `${total > 0 ? (r.cost / total) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Rates ──────────────────────────────────────────────────────────

function RatesPanel({ rates }: { rates: MetricRates[] }) {
  return (
    <div className={styles.rates}>
      <div className={styles.rateCards}>
        {METRIC_ORDER.map((m) => {
          const r = rates.find((x) => x.metric === m)
          return r ? <RateCard key={m} rates={r} /> : null
        })}
      </div>
      <SetRateForm rates={rates} />
    </div>
  )
}

function RateCard({ rates }: { rates: MetricRates }) {
  const cancel = useCancelCostRate()
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const m = rates.metric

  const onCancel = async (row: RateRow) => {
    const ok = window.confirm(
      `Cancel the ${METRIC_NAMES[m]} rate of ${rateFormat.format(row.rate)} scheduled for ${fullDate(row.effectiveFrom)}? It has not priced anything yet.`,
    )
    if (!ok) return
    setError(null)
    try {
      await cancel.mutateAsync(row.id)
    } catch (err) {
      setError(messageOf(err, 'The scheduled rate could not be cancelled.'))
    }
  }

  return (
    <div className={styles.rateCard}>
      <div className={styles.rateName}>{METRIC_NAMES[m]}</div>
      {rates.current ? (
        <>
          <div className={styles.rateValue}>
            {rateFormat.format(rates.current.rate)}{' '}
            <span className={styles.muted}>{PER_UNIT[m]}</span>
          </div>
          <div className={styles.muted}>Since {fullDate(rates.current.effectiveFrom)}</div>
        </>
      ) : (
        <div className={styles.error}>No rate in force. Costs are recorded as zero.</div>
      )}

      {rates.scheduled.map((s) => (
        <div key={s.id} className={styles.scheduled}>
          <div>
            <span className={styles.scheduledTag}>Scheduled</span>
            {rateFormat.format(s.rate)} from {fullDate(s.effectiveFrom)}
          </div>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => onCancel(s)}
            disabled={cancel.isPending}
          >
            Cancel
          </button>
        </div>
      ))}

      {rates.history.length > 0 && (
        <>
          <button
            type="button"
            className={styles.linkButton}
            aria-expanded={showHistory}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? 'Hide' : 'Show'} earlier rates ({rates.history.length})
          </button>
          {showHistory && (
            <ul className={styles.history}>
              {rates.history.map((h) => (
                <li key={h.id}>
                  {rateFormat.format(h.rate)} from {fullDate(h.effectiveFrom)}
                  <span className={styles.muted}> set by {h.createdBy}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function SetRateForm({ rates }: { rates: MetricRates[] }) {
  const save = useSetCostRate()
  const [metric, setMetric] = useState<UsageMetricKey>('WHATSAPP_MESSAGE')
  const [rateText, setRateText] = useState('')
  const [when, setWhen] = useState<'now' | 'date'>('date')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const tomorrow = bangkokDatePlus(1)
  const rate = Number(rateText)
  const rateValid = rateText.trim() !== '' && Number.isFinite(rate) && rate >= 0 && rate <= 5
  const dateValid = when === 'now' || (date !== '' && date >= tomorrow)
  const current = rates.find((r) => r.metric === metric)?.current?.rate

  // The $5 ceiling catches 90.4 for 0.0904, but not 0.904. A large jump
  // either way is flagged before saving — a warning, not a block, since a
  // real price change can be large.
  const ratio = current && current > 0 && rateValid && rate > 0 ? rate / current : null
  const bigJump = ratio !== null && (ratio >= 3 || ratio <= 1 / 3)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rateValid || !dateValid) return
    setMessage(null)
    try {
      await save.mutateAsync({
        metric,
        rate,
        effectiveDate: when === 'date' ? date : undefined,
      })
      setMessage({
        kind: 'ok',
        text:
          when === 'now'
            ? `${METRIC_NAMES[metric]} rate set to ${rateFormat.format(rate)}, in force now.`
            : `${METRIC_NAMES[metric]} rate of ${rateFormat.format(rate)} scheduled from ${longDate(date)}.`,
      })
      setRateText('')
      setDate('')
    } catch (err) {
      setMessage({ kind: 'error', text: messageOf(err, 'The rate could not be saved.') })
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h3 className={styles.formTitle}>Set a new rate</h3>

      <label className={styles.field}>
        <span>Resource</span>
        <select value={metric} onChange={(e) => setMetric(e.target.value as UsageMetricKey)}>
          {METRIC_ORDER.map((m) => (
            <option key={m} value={m}>
              {METRIC_NAMES[m]}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Rate in US dollars, {PER_UNIT[metric]}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={5}
          step="0.000001"
          value={rateText}
          onChange={(e) => setRateText(e.target.value)}
          placeholder={current !== undefined ? String(current) : '0.0904'}
        />
      </label>

      <fieldset className={styles.when}>
        <legend>Takes effect</legend>
        <label className={styles.radio}>
          <input type="radio" name="when" checked={when === 'date'} onChange={() => setWhen('date')} />
          From a date
        </label>
        <label className={styles.radio}>
          <input type="radio" name="when" checked={when === 'now'} onChange={() => setWhen('now')} />
          Now
        </label>
        {when === 'date' && (
          <input
            type="date"
            className={styles.dateInput}
            min={tomorrow}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Effective date"
          />
        )}
      </fieldset>

      {rateValid && current !== undefined && (
        <p className={styles.note}>
          Per {UNITS_OF_1000[metric]}: {usd.format(current * 1000)} now,{' '}
          <strong>{usd.format(rate * 1000)}</strong>{' '}
          {when === 'now' ? 'from now' : date ? `from ${longDate(date)}` : 'from the chosen date'}.
        </p>
      )}

      {bigJump && ratio !== null && (
        <p className={styles.warning} role="status">
          This is {ratio >= 1 ? `${ratio.toFixed(1)} times` : `${(1 / ratio).toFixed(1)} times less than`}{' '}
          the current rate. Check for a misplaced decimal point before saving.
        </p>
      )}

      <p className={styles.note}>
        Dated rates start at midnight Bangkok time and must be from tomorrow onward. Recorded in the
        audit log.
      </p>

      <button
        type="submit"
        className={`${styles.button} ${styles.primary}`}
        disabled={!rateValid || !dateValid || save.isPending}
      >
        {save.isPending ? 'Saving…' : when === 'now' ? 'Set rate now' : 'Schedule rate'}
      </button>

      {message && (
        <p className={message.kind === 'ok' ? styles.success : styles.error} role={message.kind === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}
    </form>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

/** An instant, shown as its date in Bangkok — where rates start. */
function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: ZONE,
  })
}

/** A plain yyyy-MM-dd date, shown as written. */
function longDate(ymd: string) {
  const [y, mo, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function dayLabel(ymd?: string) {
  if (!ymd) return ''
  const [y, mo, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

/** Today's date in Bangkok plus n days, as yyyy-MM-dd. */
function bangkokDatePlus(n: number) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(new Date())
  const [y, mo, d] = today.split('-').map(Number)
  const next = new Date(Date.UTC(y, mo - 1, d + n))
  return next.toISOString().slice(0, 10)
}

function niceMax(v: number) {
  if (v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp
}

function messageOf(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
}