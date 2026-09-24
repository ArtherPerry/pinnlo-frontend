'use client'

import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import {
  useAdminDashboard,
  type AttentionGroup,
  type ChannelCost,
  type CostPoint,
  type Figure,
} from '@/hooks/useAdminDashboard'
import type { AdminSection } from '../adminShell'
import styles from './dashboard.module.css'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const count = new Intl.NumberFormat('en-US')

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
  TIKTOK: 'TikTok',
  LINE: 'LINE',
}

const METRIC_NAMES: Record<string, string> = {
  AI_REVIEW: 'AI review',
  EMAIL_SENT: 'Email',
  WHATSAPP_MESSAGE: 'WhatsApp messages',
}

const FIGURE_LABELS: Record<Figure['key'], string> = {
  activeAgencies: 'Active agencies',
  clientWorkspaces: 'Client workspaces',
  postsPublished: 'Posts published',
  estimatedCost: 'Estimated cost',
}

const PLAN_ORDER = ['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']
const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
}

export function DashboardSection({ onNavigate }: { onNavigate: (s: AdminSection) => void }) {
  const { data, isLoading, isError, refetch } = useAdminDashboard()

  if (isLoading) {
    return <p className={styles.muted}>Loading the dashboard…</p>
  }

  if (isError || !data) {
    return (
      <div className={styles.errorBox} role="alert">
        <span>The dashboard could not be loaded.</span>
        <button type="button" className={styles.button} onClick={() => refetch()}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <AttentionPanel groups={data.attention} checkedAt={data.checkedAt} onNavigate={onNavigate} />
      <FiguresBand figures={data.figures} />
      <div className={styles.costRow}>
        <CostTrend points={data.costTrend} />
        <CostByChannel channels={data.costByChannel} />
      </div>
      <PlansBar plans={data.plans} />
    </div>
  )
}

// ── Needs attention ────────────────────────────────────────────────

function AttentionPanel({
  groups,
  checkedAt,
  onNavigate,
}: {
  groups: AttentionGroup[]
  checkedAt: string
  onNavigate: (s: AdminSection) => void
}) {
  const checked = `Checked at ${new Date(checkedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  // A quiet day collapses to one line. This is the state to design for:
  // most days nothing is wrong, and the panel should not shout about it.
  if (groups.length === 0) {
    return (
      <section className={`${styles.panel} ${styles.allClear}`} aria-label="Attention">
        <span className={`${styles.statusIcon} ${styles.statusOk}`}>
          <CheckCircle size={20} aria-hidden="true" />
        </span>
        <div className={styles.grow}>
          <h2 className={styles.attentionTitle}>All clear</h2>
          <p className={styles.muted}>
            No failed posts in the last 24 hours, no known connection problems, and no
            agencies waiting for approval.
          </p>
        </div>
        <span className={styles.muted}>{checked}</span>
      </section>
    )
  }

  const n = groups.length
  return (
    <section className={styles.panel} aria-labelledby="attention-heading">
      <div className={styles.attentionHead}>
        <h2 id="attention-heading" className={styles.attentionTitle}>
          {n} {n === 1 ? 'thing needs' : 'things need'} your attention
        </h2>
        <span className={styles.muted}>{checked}</span>
      </div>
      <ul className={styles.attentionList}>
        {groups.map((g) => {
          const copy = describe(g)
          const failed = g.severity === 'FAILED'
          return (
            <li key={g.type} className={styles.attentionRow}>
              <span className={`${styles.statusIcon} ${failed ? styles.statusFailed : styles.statusWarn}`}>
                {failed ? (
                  <XCircle size={20} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={20} aria-hidden="true" />
                )}
              </span>
              <div className={styles.grow}>
                <div className={styles.attentionItemTitle}>
                  {/* Severity in words, not colour alone, so it survives
                      greyscale and screen readers. */}
                  <span className={failed ? styles.labelFailed : styles.labelWarn}>
                    {failed ? 'Failed' : 'Warning'}
                  </span>
                  {copy.title}
                </div>
                <p className={styles.attentionDetail}>{copy.detail}</p>
              </div>
              {copy.target && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => onNavigate(copy.target as AdminSection)}
                >
                  Review
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Plain-language copy for each kind of problem. `target` is where Review
 * goes; it is set only where that section exists. Publishing and Connections
 * get their targets when those sections are built.
 */
function describe(g: AttentionGroup): { title: string; detail: string; target?: AdminSection } {
  const n = g.count
  const s = (one: string, many: string) => (n === 1 ? one : many)
  const i = g.items

  switch (g.type) {
    case 'PUBLISH_FAILED':
      return {
        title: `${n} ${s('post', 'posts')} failed to publish in the last 24 hours`,
        detail: summarise(
          i.map((x) => {
            const where = `${x.clientName} on ${platform(x.platform)}`
            return x.error ? `${where}: ${truncate(String(x.error), 70)}` : where
          }),
        ),
        target: 'publishing',
      }
    case 'NEAR_LIMIT':
      return {
        title: `${n} ${s('agency is', 'agencies are')} close to a plan limit`,
        detail: summarise(
          i.map((x) => `${x.agencyName} at ${x.percent}% of ${metric(x.metric)}`),
        ),
        target: 'usage',
      }
    case 'CONNECTION_FAILED':
      return {
        title: `${n} ${s('connection has a problem', 'connections have problems')}`,
        detail: summarise(i.map((x) => `${x.clientName}'s ${platform(x.platform)}: ${connectionReason(x)}`)),
        target: 'connections',
      }
    case 'CONNECTION_WARNING':
      return {
        title: `${n} ${s('connection needs', 'connections need')} attention soon`,
        detail: summarise(i.map((x) => `${x.clientName}'s ${platform(x.platform)}: ${connectionReason(x)}`)),
        target: 'connections',
      }
    case 'PENDING_APPROVAL':
      return {
        title: `${n} ${s('agency is', 'agencies are')} waiting for approval`,
        detail: summarise(i.map((x) => String(x.agencyName))),
        target: 'agencies',
      }
    default:
      return { title: String(g.type), detail: '' }
  }
}

// ── Headline figures ───────────────────────────────────────────────

function FiguresBand({ figures }: { figures: Figure[] }) {
  return (
    <section className={styles.figures} aria-label="Key figures">
      {figures.map((f) => (
        <div key={f.key} className={styles.figure}>
          <div className={styles.figureLabel}>{FIGURE_LABELS[f.key]}</div>
          <div className={styles.figureBody}>
            <div className={styles.figureNumbers}>
              <span className={styles.figureValue}>{formatFigure(f.key, f.value)}</span>
              <span className={styles.figureDelta}>{delta(f)}</span>
            </div>
            <Sparkline series={f.series} />
          </div>
        </div>
      ))}
    </section>
  )
}

/**
 * Change against the previous 30 days, deliberately without colour. For cost,
 * "up" is not good news, so green-for-up would mislead. Colour on this page
 * means status and nothing else.
 */
function delta(f: Figure): string {
  const d = f.value - f.previous
  if (Math.abs(d) < 0.005) return 'No change'
  const sign = d > 0 ? '+' : '−'
  const amount = f.key === 'estimatedCost' ? usd.format(Math.abs(d)) : count.format(Math.abs(d))
  return `${sign}${amount} vs previous 30 days`
}

function Sparkline({ series }: { series: number[] }) {
  const w = 120
  const h = 32
  if (series.length < 2) return null
  const lo = Math.min(...series)
  const hi = Math.max(...series)
  const range = hi - lo || 1
  const points = series
    .map((v, i) => `${((i / (series.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - lo) / range) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className={styles.sparkline}>
      <polyline points={points} fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Cost ───────────────────────────────────────────────────────────

function CostTrend({ points }: { points: CostPoint[] }) {
  const values = points.map((p) => p.cost)
  const max = Math.max(...values, 0)
  const total = values.reduce((a, b) => a + b, 0)

  return (
    <section className={`${styles.panel} ${styles.padded} ${styles.trend}`} aria-labelledby="cost-trend-heading">
      <div className={styles.panelHead}>
        <h2 id="cost-trend-heading" className={styles.panelTitle}>Estimated cost, last 30 days</h2>
        <span className={styles.muted}>Daily, in US dollars</span>
      </div>

      {total === 0 ? (
        <p className={styles.emptyNote}>
          No metered usage recorded yet. Estimated cost appears here once agencies use AI review,
          email or WhatsApp.
        </p>
      ) : (
        <TrendChart points={points} max={niceMax(max)} />
      )}
    </section>
  )
}

function TrendChart({ points, max }: { points: CostPoint[]; max: number }) {
  const w = 600
  const h = 160
  const line = points
    .map((p, i) => `${((i / (points.length - 1)) * w).toFixed(1)},${(h - (p.cost / max) * h).toFixed(1)}`)
    .join(' ')
  const first = points[0]?.date
  const middle = points[Math.floor(points.length / 2)]?.date
  const last = points[points.length - 1]?.date

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
          role="img"
          aria-label={`Daily estimated cost over 30 days, peaking at ${usd.format(Math.max(...points.map((p) => p.cost)))}`}
          className={styles.chartSvg}
        >
          {[0, 0.5, 1].map((g) => (
            <line key={g} x1="0" x2={w} y1={h - g * h} y2={h - g * h} className={styles.gridLine} vectorEffect="non-scaling-stroke" />
          ))}
          <polyline points={line} fill="none" className={styles.trendLine} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className={styles.chartDates} aria-hidden="true">
          <span>{shortDate(first)}</span>
          <span>{shortDate(middle)}</span>
          <span>{shortDate(last)}</span>
        </div>
      </div>
    </div>
  )
}

function CostByChannel({ channels }: { channels: ChannelCost[] }) {
  const total = channels.reduce((a, c) => a + c.cost, 0)
  const top = channels[0]

  return (
    <section className={`${styles.panel} ${styles.padded}`} aria-labelledby="channel-heading">
      <h2 id="channel-heading" className={styles.panelTitle}>Cost by channel</h2>

      {total === 0 ? (
        <p className={styles.emptyNote}>No usage in the last 30 days.</p>
      ) : (
        <>
          <div className={styles.channels}>
            {channels.map((c) => (
              <div key={c.metric} className={styles.channel}>
                <div className={styles.channelHead}>
                  <span>{metric(c.metric)}</span>
                  <span className={styles.channelAmount}>
                    {usd.format(c.cost)}
                    <span className={styles.muted}> ({c.share}%)</span>
                  </span>
                </div>
                <div className={styles.bar}>
                  <div className={styles.barFill} style={{ width: `${c.share}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Stated from the data, not asserted: only shown when one channel
              genuinely dominates. */}
          {top && top.share >= 50 && (
            <p className={styles.caption}>
              {metric(top.metric)} {top.share >= 90 ? 'make up almost all' : 'make up most'} of
              estimated cost. Watch this line when setting plan limits.
            </p>
          )}
        </>
      )}
    </section>
  )
}

// ── Plans ──────────────────────────────────────────────────────────

const PLAN_SHADES = ['#9FD4BF', '#1D9E75', '#0F6E56', '#0A4A3A']

function PlansBar({ plans }: { plans: Record<string, number> }) {
  const total = PLAN_ORDER.reduce((a, p) => a + (plans[p] ?? 0), 0)

  return (
    <section className={`${styles.panel} ${styles.padded} ${styles.plans}`} aria-labelledby="plans-heading">
      <h2 id="plans-heading" className={styles.panelTitle}>Plans</h2>
      {total === 0 ? (
        <p className={styles.emptyNote}>No approved agencies yet.</p>
      ) : (
        <div className={styles.plansBody}>
          <div className={styles.segments} aria-hidden="true">
            {PLAN_ORDER.map((p, i) =>
              plans[p] ? (
                <div
                  key={p}
                  style={{ width: `${(plans[p] / total) * 100}%`, background: PLAN_SHADES[i] }}
                />
              ) : null,
            )}
          </div>
          <ul className={styles.legend}>
            {PLAN_ORDER.map((p, i) => (
              <li key={p}>
                <span className={styles.swatch} style={{ background: PLAN_SHADES[i] }} aria-hidden="true" />
                {PLAN_NAMES[p]}
                <span className={styles.legendCount}>{plans[p] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function formatFigure(key: Figure['key'], v: number) {
  return key === 'estimatedCost' ? usd.format(v) : count.format(v)
}

function platform(p: unknown) {
  return PLATFORM_NAMES[String(p)] ?? String(p)
}

function metric(m: unknown) {
  return METRIC_NAMES[String(m)] ?? String(m)
}

/** Plain wording for a connection's most serious reason, as judged by the Connections section. */
const CONNECTION_REASONS: Record<string, string> = {
  INVALID_TOKEN: 'Meta reports the token is invalid',
  TOKEN_EXPIRED: 'the token has expired',
  MISSING_PERMISSION: 'missing the permission needed to publish',
  QUALITY_RED: 'quality is rated red',
  DATA_ACCESS_ENDED: 'data access has ended',
  TOKEN_EXPIRING: 'the token expires soon',
  DATA_ACCESS_ENDING: 'data access ends soon',
  QUALITY_YELLOW: 'quality is rated yellow',
  CHECK_UNVERIFIED: 'the last check could not reach Meta',
}

function connectionReason(x: Record<string, string | number | string[]>) {
  const reasons = Array.isArray(x.reasons) ? x.reasons : []
  const first = reasons[0]
  if (first === 'DATA_ACCESS_ENDING' && typeof x.dataAccessExpiresAt === 'string') {
    const days = Math.max(0, Math.floor((new Date(x.dataAccessExpiresAt).getTime() - Date.now()) / 86_400_000))
    return days === 1 ? 'data access ends in 1 day' : `data access ends in ${days} days`
  }
  return CONNECTION_REASONS[first] ?? 'needs checking'
}

/** The first two, then a count — enough to act on without a wall of text. */
function summarise(parts: string[]) {
  if (parts.length <= 2) return parts.join(', and ')
  return `${parts.slice(0, 2).join(', ')}, and ${parts.length - 2} more`
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function shortDate(iso?: string) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Rounds a chart's top up to a readable number, so the axis reads $2 not $1.83. */
function niceMax(v: number) {
  if (v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nice * exp
}