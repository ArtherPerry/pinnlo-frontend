'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { PlatformIcon } from '@/components/ui'
import { useClients } from '@/hooks/useClients'
import {
  useClientAnalytics,
  rangeForDays,
  type ReportMetric,
} from '@/hooks/useAnalytics'
import { FEATURES } from '@/lib/features'
import { cn, formatDate } from '@/lib/utils'
import styles from './analytics.module.css'
import { BarChart3, Info } from 'lucide-react'

const RANGES = [
  { days: 7,  label: '7 days'  },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
] as const

const SERIES_COLORS: Record<string, string> = {
  page_media_view:              '#378ADD',
  page_total_media_view_unique: '#1D9E75',
  page_post_engagements:        '#EF9F27',
  page_follows:                 '#8B5CF6',
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Em dash, not zero: uncollected and zero are different facts. */
function formatValue(value: number | null): string {
  return value === null ? '—' : value.toLocaleString()
}

// ── Chart ───────────────────────────────────────────────────────────────

function TrendChart({
  points,
  color,
  locale,
}: {
  points: { date: string; value: number }[]
  color:  string
  locale: string
}) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; value: number; date: string; visible: boolean
  }>({ x: 0, y: 0, value: 0, date: '', visible: false })

  const svgRef = useRef<SVGSVGElement>(null)

  const W = 600
  const H = 180
  const PAD = { top: 12, right: 12, bottom: 26, left: 54 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  if (points.length === 0) {
    return <div className={styles.chartEmpty}>No data for this period</div>
  }

  const values = points.map((p) => p.value)
  const min    = Math.min(...values, 0)
  const max    = Math.max(...values)
  const range  = max - min || 1

  const xS = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * iW
  const yS = (v: number) => PAD.top + iH - ((v - min) / range) * iH

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xS(i)} ${yS(p.value)}`).join(' ')
  const area = `${path} L ${xS(points.length - 1)} ${PAD.top + iH} L ${xS(0)} ${PAD.top + iH} Z`

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={svgRef}
        className={styles.chartSvg}
        viewBox={`0 0 ${W} ${H}`}
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
      >
        {/* Horizontal guides with value labels */}
        {[0, 0.5, 1].map((f) => {
          const y = PAD.top + iH - f * iH
          return (
            <g key={f}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                    stroke="var(--color-border)" strokeWidth="0.5" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end"
                    fontSize="10" fill="var(--color-muted)">
                {formatNum(Math.round(min + f * range))}
              </text>
            </g>
          )
        })}

        <path d={area} fill={color} opacity="0.08" />
        <path d={path} fill="none" stroke={color} strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={xS(i)} cy={yS(p.value)} r="9"
            fill="transparent"
            onMouseEnter={() => setTooltip({
              x: xS(i), y: yS(p.value), value: p.value, date: p.date, visible: true,
            })}
          />
        ))}

        {tooltip.visible && (
          <circle cx={tooltip.x} cy={tooltip.y} r="3.5" fill={color} />
        )}
      </svg>

      {tooltip.visible && (
        <div
          className={styles.chartTooltip}
          style={{ left: `${(tooltip.x / W) * 100}%`, top: `${(tooltip.y / H) * 100}%` }}
        >
          <div className={styles.chartTooltipValue}>{tooltip.value.toLocaleString()}</div>
          <div className={styles.chartTooltipDate}>
            {formatDate(tooltip.date, locale, { dateStyle: 'medium' })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const locale = useLocale()

  const { data: clients, isLoading: clientsLoading } = useClients()
  const [clientId, setClientId] = useState<string | null>(null)
  const [days,     setDays]     = useState<number>(30)
  const [series,   setSeries]   = useState<string>('page_media_view')

  // Default to the first client once they load.
  useEffect(() => {
    if (!clientId && clients && clients.length > 0) {
      setClientId(clients[0].id)
    }
  }, [clients, clientId])

  const { from, to } = rangeForDays(days)
  const { data: report, isLoading, isError } = useClientAnalytics(clientId, from, to)

  const selectedClient = clients?.find((c) => c.id === clientId)
  const activeSeries   = report?.trend.find((s) => s.key === series)

  // Fall back to whatever series does have data if the chosen one is empty.
  const shownSeries = activeSeries ?? report?.trend[0]

  return (
    <div className={styles.page}>
      <div className={styles.reportBar}>
        <div className={styles.reportBarLeft}>
          <select
            className={styles.clientSelect}
            value={clientId ?? ''}
            onChange={(e) => setClientId(e.target.value)}
            disabled={clientsLoading || !clients?.length}
            aria-label="Client workspace"
          >
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {report && (
            <span className={styles.reportPeriodLabel}>
              {formatDate(report.from, locale, { dateStyle: 'medium' })} –{' '}
              {formatDate(report.to, locale, { dateStyle: 'medium' })}
            </span>
          )}
        </div>

        <div className={styles.rangeTabs}>
          {RANGES.map((r) => (
            <button
              key={r.days}
              className={cn(styles.rangeTab, days === r.days && styles.rangeTabActive)}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {clients?.length === 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            No clients yet. Add a client and connect their social accounts to see performance data.
          </div>
        </div>
      )}

      {isLoading && (
        <>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonChart} />
        </>
      )}

      {isError && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            Could not load analytics. Please try again shortly.
          </div>
        </div>
      )}

      {/* Nothing collected. Zeroes here would say the posts reached nobody,
          which is a different claim from having no data. */}
      {report && !report.hasData && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionBody} style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BarChart3 size={28} style={{ color: 'var(--color-muted)', marginBottom: 10 }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No performance data yet</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
              {selectedClient
                ? <>Connect {selectedClient.name}&apos;s social accounts, then data arrives within 24 hours.</>
                : <>Connect a social account to start collecting performance data.</>}
            </div>
          </div>
        </div>
      )}

      {report?.hasData && (
        <>
          <div className={styles.overviewGrid}>
            {report.metrics.map((m: ReportMetric) => (
              <div key={m.key} className={styles.overviewCard}>
                <div className={styles.overviewLabel}>{m.label}</div>
                <div className={styles.overviewValue}>{formatValue(m.value)}</div>
                {m.changePercent !== null ? (
                  <div className={cn(
                    styles.overviewChange,
                    m.changePercent >= 0 ? styles.changePos : styles.changeNeg,
                  )}>
                    {m.changePercent >= 0 ? '+' : ''}{m.changePercent.toFixed(1)}%
                  </div>
                ) : (
                  <div className={styles.changeMuted}>
                    {m.value === null ? 'Not collected yet' : 'No previous period'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {report.trend.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>Trend</div>
                <div className={styles.metricToggles}>
                  {report.trend.map((s) => (
                    <button
                      key={s.key}
                      className={cn(
                        styles.metricToggle,
                        (shownSeries?.key === s.key) && styles.metricToggleActive,
                      )}
                      onClick={() => setSeries(s.key)}
                    >
                      <span
                        className={styles.metricDot}
                        style={{ background: SERIES_COLORS[s.key] ?? 'var(--color-muted)' }}
                      />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.sectionBody}>
                <TrendChart
                  points={shownSeries?.points ?? []}
                  color={SERIES_COLORS[shownSeries?.key ?? ''] ?? '#378ADD'}
                  locale={locale}
                />
              </div>
            </div>
          )}

          {report.topPosts.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>Best performing posts</div>
                <span className={styles.sectionMeta}>by views</span>
              </div>
              <div className={styles.sectionBody}>
                <table className={styles.postTable}>
                  <thead>
                    <tr>
                      <th>Post</th>
                      <th>Platform</th>
                      <th>Published</th>
                      <th>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topPosts.map((p) => (
                      <tr key={p.postId}>
                        <td className={styles.postContent}>{p.content}</td>
                        <td><PlatformIcon platform={p.platform as never} size={15} /></td>
                        <td className={styles.postMeta}>
                          {p.publishedAt
                            ? formatDate(p.publishedAt, locale, { dateStyle: 'medium' })
                            : '—'}
                        </td>
                        <td>{p.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.unavailableMetrics.length > 0 && (
            <div className={styles.heatmapNote}>
              <Info size={14} />{' '}
              {report.unavailableMetrics.join(', ')} no longer provided by the platform.
            </div>
          )}
        </>
      )}

      {/* Heatmap needs hourly engagement, which no platform metric provides —
          it has to be derived from published-post performance once there is
          enough of it. AnalystSummary and the PDF export are similarly
          unbacked. All three are flagged off rather than deleted. */}
      {FEATURES.analyticsHeatmap && <div />}
      {FEATURES.analystSummary && <div />}
      {FEATURES.reportExport && <div />}
    </div>
  )
}