'use client'

import { useLocale } from 'next-intl'
import { useClientReport, type ReportMetric } from '@/hooks/useClientWorkspace'
import { formatDate } from '@/lib/utils'
import { BarChart3, Info } from 'lucide-react'
import styles from './client.module.css'

function formatValue(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString()
}

function formatChange(metric: ReportMetric): string | null {
  if (metric.changePercent === null) return null
  const sign = metric.changePercent >= 0 ? '+' : ''
  return `${sign}${metric.changePercent.toFixed(1)}% vs previous period`
}

export function ReportsSection() {
  const locale = useLocale()
  const { data: report, isLoading, isError } = useClientReport()

  if (isLoading) {
    return <div className={styles.emptyState}><div className={styles.emptyText}>Loading…</div></div>
  }

  if (isError || !report) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyTitle}>Could not load your report</div>
        <div className={styles.emptyText}>Please try again shortly.</div>
      </div>
    )
  }

  // No collected data at all. Showing zeros here would tell the client nobody
  // saw their posts, which is a different and false statement.
  if (!report.hasData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><BarChart3 size={28} /></div>
        <div className={styles.emptyTitle}>No performance data yet</div>
        <div className={styles.emptyText}>
          Reports appear once your agency has connected your social accounts and
          the first day of data has come through. This usually takes 24 hours
          after connecting.
        </div>
      </div>
    )
  }

  // The client sees one series. The agency page offers a toggle across all of
  // them, which is why the API returns several.
  const viewsTrend = report.trend.find((s) => s.key === 'page_media_view')
  const maxTrend   = Math.max(...(viewsTrend?.points.map((p) => p.value) ?? []), 1)

  return (
    <>
      <div className={styles.reportPeriod}>
        {formatDate(report.from, locale, { dateStyle: 'medium' })} –{' '}
        {formatDate(report.to, locale, { dateStyle: 'medium' })}
      </div>

      <div className={styles.reportGrid}>
        {report.metrics.map((m) => {
          const change = formatChange(m)
          return (
            <div key={m.key} className={styles.metricCard}>
              <div className={styles.metricLabel}>{m.label}</div>
              <div className={styles.metricValue}>{formatValue(m.value)}</div>
              {change ? (
                <div className={`${styles.metricChange} ${
                  (m.changePercent ?? 0) >= 0 ? styles.metricUp : styles.metricDown
                }`}>
                  {change}
                </div>
              ) : (
                <div className={styles.metricChangeMuted}>
                  {m.value === null ? 'Not collected yet' : 'No previous period'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {viewsTrend && viewsTrend.points.length > 0 && (
        <div className={styles.reportCard}>
          <div className={styles.reportCardTitle}>{viewsTrend.label} by day</div>
          <div className={styles.trendChart}>
            {viewsTrend.points.map((point) => (
              <div
                key={point.date}
                className={styles.trendBar}
                title={`${point.date}: ${point.value.toLocaleString()}`}
              >
                <div
                  className={styles.trendBarFill}
                  style={{ height: `${(point.value / maxTrend) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className={styles.trendAxis}>
            <span>{formatDate(report.from, locale, { day: 'numeric', month: 'short' })}</span>
            <span>{formatDate(report.to, locale, { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      )}

      {report.topPosts.length > 0 && (
        <div className={styles.reportCard}>
          <div className={styles.reportCardTitle}>Best performing posts</div>
          {report.topPosts.map((p) => (
            <div key={p.postId} className={styles.topPostRow}>
              <span className={styles.topPostContent}>{p.content}</span>
              <span className={styles.topPostStat}>
                {p.value.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      )}

      {report.unavailableMetrics.length > 0 && (
        <div className={styles.reportNotice}>
          <Info size={14} />
          <span>
            {report.unavailableMetrics.join(', ')} {report.unavailableMetrics.length === 1 ? 'is' : 'are'} no
            longer provided by the platform, so {report.unavailableMetrics.length === 1 ? 'it is' : 'they are'} not
            shown here.
          </span>
        </div>
      )}

      <div className={styles.reportNote}>
        Figures come directly from your connected social accounts and update
        once a day.
      </div>
    </>
  )
}