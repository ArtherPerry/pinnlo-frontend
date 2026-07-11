'use client'

import styles from './client.module.css'

const METRICS = [
  { label: 'Total Reach', value: '142,300', change: '+8.7%', up: true },
  { label: 'Followers', value: '28,450', change: '+3.2%', up: true },
  { label: 'Engagement', value: '6,820', change: '+12.4%', up: true },
  { label: 'Posts Published', value: '24', change: '-2', up: false },
]

const TREND = [
  { label: 'W1', value: 62 },
  { label: 'W2', value: 78 },
  { label: 'W3', value: 55 },
  { label: 'W4', value: 90 },
]

const TOP_POSTS = [
  { content: '20% off all new menu items 🎉', stat: '4,200 reach · 320 likes' },
  { content: 'Weekend vibes at Somjai ☕️', stat: '3,850 reach · 290 likes' },
  { content: 'New seasonal menu launching', stat: '3,100 reach · 210 likes' },
]

export function ReportsSection() {
  const maxTrend = Math.max(...TREND.map((t) => t.value), 1)

  return (
    <>
      <div className={styles.reportGrid}>
        {METRICS.map((m) => (
          <div key={m.label} className={styles.metricCard}>
            <div className={styles.metricLabel}>{m.label}</div>
            <div className={styles.metricValue}>{m.value}</div>
            <div className={`${styles.metricChange} ${m.up ? styles.metricUp : styles.metricDown}`}>
              {m.change} vs last month
            </div>
          </div>
        ))}
      </div>

      <div className={styles.reportCard}>
        <div className={styles.reportCardTitle}>Reach over the last 4 weeks</div>
        <div className={styles.trendChart}>
          {TREND.map((t) => (
            <div key={t.label} className={styles.trendBar}>
              <div
                className={styles.trendBarFill}
                style={{ height: `${(t.value / maxTrend) * 100}%` }}
              />
              <span className={styles.trendBarLabel}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reportCard}>
        <div className={styles.reportCardTitle}>Top posts this month</div>
        {TOP_POSTS.map((p, i) => (
          <div key={i} className={styles.topPostRow}>
            <span className={styles.topPostContent}>{p.content}</span>
            <span className={styles.topPostStat}>{p.stat}</span>
          </div>
        ))}
      </div>

      <div className={styles.reportNote}>
        These reports are updated by your agency. Data reflects your connected social accounts.
      </div>
    </>
  )
}