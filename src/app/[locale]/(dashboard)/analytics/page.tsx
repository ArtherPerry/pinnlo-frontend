'use client'

import { useState, useRef, useCallback } from 'react'
import {
  useAnalyticsOverview,
  useAnalyticsHistory,
  usePostPerformance,
  useHeatmap,
} from '@/hooks/useAnalytics'
import { PlatformIcon } from '@/components/ui'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'
import type { AnalyticsHistoryPoint, HeatmapCell } from '@/lib/types'
import styles from './analytics.module.css'
import { ReportExporter } from '@/components/features/ReportExporter'
import { AnalystSummary } from '@/components/features/AnalystSummary'

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

type MetricKey = 'followers' | 'reach' | 'engagement'

const METRIC_COLORS: Record<MetricKey, string> = {
  followers:  '#1D9E75',
  reach:      '#378ADD',
  engagement: '#EF9F27',
}

const METRIC_LABELS: Record<MetricKey, string> = {
  followers:  'Followers',
  reach:      'Reach',
  engagement: 'Engagement',
}

const CLIENT_NAMES: Record<string, string> = {
  somjai: 'Somjai Coffee',
  bkk:    'BKK Fitness',
  mango:  'Mango Resort',
}

function HistoryChart({
  data,
  metric,
}: {
  data:   AnalyticsHistoryPoint[]
  metric: MetricKey
}) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; value: number; date: string; visible: boolean
  }>({ x: 0, y: 0, value: 0, date: '', visible: false })
  const svgRef = useRef<SVGSVGElement>(null)

  const W   = 600
  const H   = 160
  const PAD = { top: 10, right: 10, bottom: 24, left: 52 }
  const iW  = W - PAD.left - PAD.right
  const iH  = H - PAD.top - PAD.bottom

  const values = data.map((d) => d[metric] as number)
  const min    = Math.min(...values)
  const max    = Math.max(...values)
  const range  = max - min || 1

  const xS = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * iW
  const yS = (v: number) => PAD.top + iH - ((v - min) / range) * iH

  const pts    = data.map((d, i) => ({ x: xS(i), y: yS(d[metric] as number) }))
  const line   = pts.reduce((a, p, i) => a + (i === 0 ? `M${p.x} ${p.y}` : ` L${p.x} ${p.y}`), '')
  const area   = pts.length > 0
    ? line + ` L${pts[pts.length - 1].x} ${PAD.top + iH} L${PAD.left} ${PAD.top + iH} Z`
    : ''

  const yTicks = [min, min + range * 0.5, max]
  const color  = METRIC_COLORS[metric]

  const xLabels = data.length > 0
    ? [0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => ({
        i,
        label: new Date(data[i].date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      }))
    : []

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx   = (e.clientX - rect.left) * (W / rect.width)
    const idx  = Math.max(0, Math.min(data.length - 1,
      Math.round(((mx - PAD.left) / iW) * (data.length - 1))
    ))
    const d = data[idx]
    if (!d) return
    setTooltip({
      x:       (xS(idx) / W) * 100,
      y:       (yS(d[metric] as number) / H) * 100,
      value:   d[metric] as number,
      date:    new Date(d.date).toLocaleDateString('en-GB', { dateStyle: 'medium' }),
      visible: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, metric])

  if (data.length === 0) return (
    <div className={styles.chartEmpty}>No data for this period</div>
  )

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chartSvg}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
      >
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={yS(tick)}
              x2={PAD.left + iW} y2={yS(tick)}
              stroke="var(--color-border)" strokeWidth="0.5"
            />
            <text
              x={PAD.left - 6} y={yS(tick) + 4}
              textAnchor="end" fontSize="9" fill="var(--color-muted)"
            >
              {formatNum(tick)}
            </text>
          </g>
        ))}

        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xS(i)} y={H - 4}
            textAnchor="middle" fontSize="9" fill="var(--color-muted)"
          >
            {label}
          </text>
        ))}

        {area && <path d={area} fill={`url(#grad-${metric})`} />}
        <path d={line} fill="none" stroke={color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />

        {tooltip.visible && (
          <circle
            cx={xS(Math.round(((tooltip.x / 100) * W - PAD.left) / iW * (data.length - 1)))}
            cy={yS(tooltip.value)}
            r="4" fill={color} stroke="white" strokeWidth="2"
          />
        )}
      </svg>

      {tooltip.visible && (
        <div
          className={styles.chartTooltip}
          style={{ left: `${tooltip.x}%`, bottom: `${100 - tooltip.y + 5}%` }}
        >
          <div className={styles.chartTooltipValue}>{formatNum(tooltip.value)}</div>
          <div className={styles.chartTooltipDate}>{tooltip.date}</div>
        </div>
      )}
    </div>
  )
}

function HeatmapChart({ data }: { data: HeatmapCell[][] }) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null)

  const getColor = (score: number) => {
    if (score === 0)   return 'var(--color-bg-2)'
    if (score < 25)    return '#9FE1CB'
    if (score < 50)    return '#5DCAA5'
    if (score < 75)    return '#1D9E75'
    return '#0F6E56'
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div>
      <div className={styles.heatmapHover}>
        {hovered ? `${hovered.label} — Score: ${hovered.score}/100` : ''}
      </div>

      <div className={styles.heatmapWrap}>
        <div className={styles.heatmap}>
          <div className={styles.heatmapDayLabel} />
          {hours.map((h) => (
            <div key={h} className={styles.heatmapHourLabel}>
              {h % 3 === 0 ? `${h}h` : ''}
            </div>
          ))}

          {data.map((row) => (
            <>
              <div key={`label-${row[0].day}`} className={styles.heatmapDayLabel}>
                {row[0].day}
              </div>
              {row.map((cell) => (
                <div
                  key={`${cell.day}-${cell.hour}`}
                  className={styles.heatmapCell}
                  style={{ background: getColor(cell.score) }}
                  onMouseEnter={() => setHovered(cell)}
                  onMouseLeave={() => setHovered(null)}
                  title={`${cell.label}: ${cell.score}/100`}
                />
              ))}
            </>
          ))}
        </div>
      </div>

      <div className={styles.heatmapLegend}>
        <span>Low</span>
        <div className={styles.legendTrack}>
          {['var(--color-bg-2)', '#9FE1CB', '#5DCAA5', '#1D9E75', '#0F6E56'].map((c) => (
            <div
              key={c}
              className={styles.legendSwatch}
              style={{ background: c }}
            />
          ))}
        </div>
        <span>High engagement</span>
      </div>

      <div className={styles.heatmapNote}>
        ⚡ Best times to post based on your audience&apos;s historical engagement patterns.
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [historyDays, setHistoryDays] = useState(30)
  const [activeMetric, setActiveMetric] = useState<MetricKey>('followers')
  const [period, setPeriod] = useState('this-month')
  const [reportClient, setReportClient] = useState('all')

  const plan = usePlan()

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview()
  const { data: history,  isLoading: historyLoading  } = useAnalyticsHistory(historyDays)
  const { data: posts,    isLoading: postsLoading    } = usePostPerformance()
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap()

  const selectedClientName = reportClient === 'all' ? undefined : CLIENT_NAMES[reportClient]

  return (
    <div className={styles.page}>

      {/* Report bar */}
      <div className={styles.reportBar}>
        <div className={styles.reportBarLeft}>
          <span className={styles.reportPeriodLabel}>Report</span>
          <select
            className={styles.reportSelect}
            value={reportClient}
            onChange={(e) => setReportClient(e.target.value)}
          >
            <option value="all">All clients</option>
            <option value="somjai">Somjai Coffee</option>
            <option value="bkk">BKK Fitness</option>
            <option value="mango">Mango Resort</option>
          </select>
          <select
            className={styles.reportSelect}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="last-30">Last 30 days</option>
            <option value="last-quarter">Last quarter</option>
          </select>
        </div>
        <ReportExporter
          clientName={selectedClientName ?? 'All clients'}
          brandColor="#1D9E75"
          companyName="NC Digital Agency"
        />
      </div>

      {/* AI Analyst narrative */}
      <AnalystSummary overview={overview} clientName={selectedClientName} />

      {/* Overview cards */}
      {overviewLoading ? (
        <div className={styles.overviewGrid}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      ) : overview && (
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <span className={styles.overviewLabel}>Total followers</span>
            <span className={styles.overviewValue}>{formatNum(overview.totalFollowers)}</span>
            <span className={cn(styles.overviewChange, overview.followerGrowth >= 0 ? styles.changePos : styles.changeNeg)}>
              {overview.followerGrowth >= 0 ? '▲' : '▼'} {Math.abs(overview.followerGrowth).toFixed(1)}% / 30d
            </span>
            <span className={styles.overviewInsight}>
              <span className={styles.overviewInsightIcon}>→</span>
              {overview.followerGrowth < 2 ? 'Growth is slowing — consider a giveaway' : 'Steady growth from consistent posting'}
            </span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.overviewLabel}>Total reach</span>
            <span className={styles.overviewValue}>{formatNum(overview.totalReach)}</span>
            <span className={cn(styles.overviewChange, overview.reachGrowth >= 0 ? styles.changePos : styles.changeNeg)}>
              {overview.reachGrowth >= 0 ? '▲' : '▼'} {Math.abs(overview.reachGrowth).toFixed(1)}% / 30d
            </span>
            <span className={styles.overviewInsight}>
              <span className={styles.overviewInsightIcon}>→</span>
              {overview.reachGrowth >= 0 ? 'Mostly driven by your video posts' : 'Down from posting less on weekends'}
            </span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.overviewLabel}>Engagement rate</span>
            <span className={styles.overviewValue}>{overview.engagementRate.toFixed(1)}%</span>
            <span className={cn(styles.overviewChange, styles.changeMuted)}>
              {overview.totalEngagement.toLocaleString()} interactions
            </span>
            <span className={styles.overviewInsight}>
              <span className={styles.overviewInsightIcon}>→</span>
              Above the F&amp;B average for your region
            </span>
          </div>
          <div className={styles.overviewCard}>
            <span className={styles.overviewLabel}>Posts published</span>
            <span className={styles.overviewValue}>{overview.postsPublished}</span>
            <span className={cn(styles.overviewChange, styles.changeMuted)}>
              Last 30 days
            </span>
            <span className={styles.overviewInsight}>
              <span className={styles.overviewInsightIcon}>→</span>
              Try 2–3 more videos next month
            </span>
          </div>
        </div>
      )}

      {/* History chart */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Growth over time</span>
          <div className={styles.rangeTabs}>
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                className={cn(styles.rangeTab, historyDays === d && styles.rangeTabActive)}
                onClick={() => setHistoryDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.metricToggles}>
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
              <button
                key={key}
                className={cn(styles.metricToggle, activeMetric === key && styles.metricToggleActive)}
                onClick={() => setActiveMetric(key)}
              >
                <span className={styles.metricDot} style={{ background: METRIC_COLORS[key] }} />
                {METRIC_LABELS[key]}
              </button>
            ))}
          </div>

          {historyLoading ? (
            <div className={styles.skeletonChart} />
          ) : history ? (
            <HistoryChart data={history} metric={activeMetric} />
          ) : null}
        </div>
      </div>

      {/* Post performance */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Post performance</span>
        </div>
        {postsLoading ? (
          <div className={styles.skeletonTable} />
        ) : posts && (
          <table className={styles.postTable}>
            <thead>
              <tr>
                <th>Post</th>
                <th>Reach</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Shares</th>
                <th>Eng. rate</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className={styles.postCell}>
                      <PlatformIcon platform={post.platform as 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'LINE'} size={13} />
                      <div>
                        <div className={styles.postContent}>{post.content}</div>
                        <div className={styles.postMeta}>
                          {post.clientName} · {new Date(post.publishedAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{formatNum(post.reach)}</td>
                  <td>{post.likes.toLocaleString()}</td>
                  <td>{post.comments.toLocaleString()}</td>
                  <td>{post.shares.toLocaleString()}</td>
                  <td>
                    <span className={cn(
                      post.engagementRate >= 7 ? styles.engagementHigh :
                      post.engagementRate >= 4 ? styles.engagementMid  :
                      styles.engagementLow
                    )}>
                      {post.engagementRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Heatmap — Pro+ only */}
      {plan.canSeeHeatmap ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Best posting times</span>
            <span className={styles.sectionMeta}>{heatmapData?.timezone}</span>
          </div>
          <div className={styles.sectionBody}>
            {heatmapLoading ? (
              <div className={styles.skeletonChart} />
            ) : heatmapData ? (
              <HeatmapChart data={heatmapData.heatmap} />
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Best posting times</span>
            <span className={styles.planTag}>Pro plan</span>
          </div>
          <div className={cn(styles.sectionBody, styles.upsell)}>
            <p className={styles.upsellText}>
              Upgrade to Pro to see AI-powered best posting time recommendations based on your audience&apos;s engagement patterns.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}