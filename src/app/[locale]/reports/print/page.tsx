'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useClients } from '@/hooks/useClients'
import { useClientAnalytics } from '@/hooks/useAnalytics'
import {
  monthRange,
  useAnalystSummary,
  useReportFindings,
  type MetricFinding,
  type ReportFindings,
  type ReportLanguage,
} from '@/hooks/useReport'
import { DATE_LOCALE, REPORT_TERMS, type ReportTerms } from '@/lib/reportTerms'
import styles from './report.module.css'

/**
 * The printable monthly report, opened in its own tab from the Report panel.
 *
 * Shown on screen first, with a Save as PDF button, so the agency checks it
 * before anything is printed. The browser does the PDF: it renders Thai,
 * Burmese and Lao correctly, which server-side PDF libraries do not.
 *
 * With an approved summary, the figures come from the summary's snapshot, so
 * the numbers always match the approved text. Without one, the report uses
 * the current figures and leaves the summary out.
 */
export default function ReportPrintPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <ReportPrint />
    </Suspense>
  )
}

const LANGUAGES: ReportLanguage[] = ['en', 'th', 'my', 'lo']

function ReportPrint() {
  const params   = useSearchParams()
  const router   = useRouter()
  const pathname = usePathname()
  const { user, _hydrated } = useAuth()

  const clientId = params.get('client')
  const monthKey = params.get('month') ?? ''
  const langParam = params.get('lang') as ReportLanguage
  const language: ReportLanguage = LANGUAGES.includes(langParam) ? langParam : 'en'
  const { from, to } = monthRange(monthKey)

  // Opened in a new tab: send anyone signed out to sign in, as the app does.
  useEffect(() => {
    if (_hydrated && !user) {
      router.replace(`/${pathname.split('/')[1] ?? 'en'}/login`)
    }
  }, [_hydrated, user, pathname, router])

  const { data: clients } = useClients()
  const { data: summary, isLoading: summaryLoading } = useAnalystSummary(clientId, from, to, language)
  const approved = summary?.status === 'APPROVED' ? summary : null

  // Live figures only when there is no approved snapshot to use.
  const live = useReportFindings(approved ? null : clientId, from, to)
  const findings: ReportFindings | undefined = approved?.findings ?? live.data

  // The daily chart is live data: the snapshot keeps totals, not days.
  const { data: analytics } = useClientAnalytics(clientId, from, to)
  const dailyViews = analytics?.trend.find((s) => s.key === 'page_media_view')?.points ?? []

  const t = REPORT_TERMS[language]
  const dateLocale = DATE_LOCALE[language]
  const client = clients?.find((c) => c.id === clientId)

  const monthLabel = useMemo(
    () => (from ? new Date(`${from}T00:00:00`).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }) : ''),
    [from, dateLocale])
  const previousLabel = findings?.previousFrom
    ? new Date(`${findings.previousFrom}T00:00:00`).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
    : t.previousMonth

  if (!_hydrated || !user) return null

  if (!clientId || !monthKey) {
    return <div className={styles.message}>This report link is incomplete. Open it again from the Report panel.</div>
  }

  if (summaryLoading || (!approved && live.isLoading)) {
    return <div className={styles.message}>Preparing the report…</div>
  }

  if (!findings) {
    return <div className={styles.message}>The report could not be prepared. Please try again.</div>
  }

  return (
    <div className={styles.screen}>
      {/* On screen only: the check before printing. */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <strong>Check the report, then save it.</strong>{' '}
          In the print window, choose <em>Save as PDF</em> as the destination.
          {!approved && summary && ' The summary is not approved yet, so it is left out.'}
        </div>
        <button type="button" className={styles.printButton} onClick={() => window.print()}>
          Save as PDF
        </button>
      </div>

      <article className={styles.sheet} lang={language}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t.title}</p>
            <h1 className={styles.month}>{monthLabel}</h1>
          </div>
          <dl className={styles.parties}>
            <div><dt>{t.client}</dt><dd>{client?.name ?? '—'}</dd></div>
            <div><dt>{t.preparedBy}</dt><dd>{user.agencyName}</dd></div>
          </dl>
        </header>

        {!findings.hasData ? (
          <p className={styles.empty}>{t.noData}</p>
        ) : (
          <>
            {approved && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.summary}</h2>
                <SummaryText text={approved.content} />
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t.keyFigures}</h2>
              <p className={styles.caption}>{t.comparedWith(previousLabel)}</p>
              <div className={styles.metrics}>
                {findings.metrics.map((m) => (
                  <MetricCard key={m.key} metric={m} terms={t} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t.posting}</h2>
              <div className={styles.posting}>
                <div>
                  <span className={styles.postingValue}>{findings.postsPublished}</span>
                  <span className={styles.postingLabel}>
                    {t.postsPublished} ({t.previousMonth}: {findings.previousPostsPublished})
                  </span>
                </div>
                {findings.longestGapDays !== null && (
                  <div>
                    <span className={styles.postingValue}>{t.days(findings.longestGapDays)}</span>
                    <span className={styles.postingLabel}>{t.longestGap}</span>
                  </div>
                )}
              </div>
            </section>

            {dailyViews.length > 1 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.dailyViews}</h2>
                <ViewsChart points={dailyViews} from={from} to={to} dateLocale={dateLocale} />
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t.topPosts}</h2>
              {findings.topPosts.length === 0 ? (
                <p className={styles.empty}>{t.noPosts}</p>
              ) : (
                <table className={styles.posts}>
                  <thead>
                    <tr>
                      <th>{t.post}</th>
                      <th>{t.platform}</th>
                      <th>{t.published}</th>
                      <th className={styles.num}>{t.views}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.topPosts.map((p, i) => (
                      <tr key={i}>
                        <td className={styles.postText}>{excerpt(p.content)}</td>
                        <td>{platformName(p.platform)}</td>
                        <td>{p.publishedAt ? formatDay(p.publishedAt, dateLocale) : '—'}</td>
                        <td className={styles.num}>{formatNumber(p.views)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        <footer className={styles.footer}>{t.source}</footer>
      </article>
    </div>
  )
}

// ── Pieces ────────────────────────────────────────────────────────────────

function MetricCard({ metric: m, terms: t }: { metric: MetricFinding; terms: ReportTerms }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{t.metric[m.key] ?? m.label}</span>
      <span className={styles.metricValue}>{m.current === null ? '—' : formatNumber(m.current)}</span>
      <span className={styles.metricChange}>{changeText(m, t)}</span>
    </div>
  )
}

/**
 * The comparison, stated no more strongly than the findings allow: a change
 * on a tiny starting number is described as too small to compare, never as a
 * percentage.
 */
function changeText(m: MetricFinding, t: ReportTerms): string {
  if (m.direction === 'UNKNOWN') return t.notCollected
  if (m.direction === 'NO_COMPARISON' || m.previous === null) return t.noPrevious
  if (!m.reliable && m.direction !== 'FLAT') {
    return `${t.from(formatNumber(m.previous))} · ${t.tooSmall}`
  }
  const followers = m.key === 'page_follows' && m.difference !== null
  const pct = m.changePercent === null ? null : `${m.changePercent > 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`
  if (followers) {
    // A follower count says more as people than as a percentage.
    const diff = `${m.difference! > 0 ? '+' : ''}${formatNumber(m.difference!)}`
    return pct ? `${diff} (${pct})` : diff
  }
  if (m.direction === 'FLAT') return pct ? `${t.aboutSame} (${pct})` : t.aboutSame
  return pct ?? t.from(formatNumber(m.previous))
}

/**
 * The approved summary: paragraphs, and headed lists where a line is followed
 * by "- " points — the plain-text shape the summary is written in.
 */
function SummaryText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
  return (
    <div className={styles.summary}>
      {blocks.map((lines, i) => {
        const points  = lines.filter((l) => l.startsWith('- '))
        const heading = points.length > 0 && !lines[0].startsWith('- ') ? lines[0] : null
        if (points.length > 0) {
          return (
            <div key={i}>
              {heading && <h3 className={styles.summaryHeading}>{heading}</h3>}
              <ul>{points.map((p, j) => <li key={j}>{p.slice(2)}</li>)}</ul>
            </div>
          )
        }
        return <p key={i}>{lines.join(' ')}</p>
      })}
    </div>
  )
}

/**
 * Daily views across the whole month. Days without data are left as gaps,
 * not drawn as zero: a zero would claim the page had no views, which is a
 * different fact from not having collected them. The axis always covers the
 * full month, so a month whose data starts late does not look shorter.
 */
function ViewsChart({ points, from, to, dateLocale }: {
  points: { date: string; value: number }[]
  from: string
  to: string
  dateLocale: string
}) {
  const W = 700
  const H = 160
  const pad = { top: 10, right: 10, bottom: 24, left: 40 }

  // Every day of the month, with its value where one was collected.
  const byDate = new Map(points.map((p) => [p.date.slice(0, 10), p.value]))
  const days: string[] = []
  for (let d = new Date(`${from}T00:00:00`); d <= new Date(`${to}T00:00:00`); d.setDate(d.getDate() + 1)) {
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const max = Math.max(...points.map((p) => p.value), 1)
  const x = (i: number) => pad.left + (i / Math.max(days.length - 1, 1)) * (W - pad.left - pad.right)
  const y = (v: number) => pad.top + (1 - v / max) * (H - pad.top - pad.bottom)

  // A new segment starts after each gap, so missing days stay empty.
  let line = ''
  let drawing = false
  days.forEach((day, i) => {
    const v = byDate.get(day)
    if (v === undefined) {
      drawing = false
      return
    }
    line += `${drawing ? 'L' : 'M'} ${x(i)} ${y(v)} `
    drawing = true
  })

  const last = days.length - 1
  const ticks: { i: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { i: 0, anchor: 'start' },
    { i: Math.floor(last / 2), anchor: 'middle' },
    { i: last, anchor: 'end' },
  ]

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img">
      <line x1={pad.left} x2={W - pad.right} y1={y(0)} y2={y(0)} stroke="#d9dcd6" />
      <line x1={pad.left} x2={W - pad.right} y1={y(max)} y2={y(max)} stroke="#eceee9" />
      <text x={pad.left - 6} y={y(max) + 4} textAnchor="end" className={styles.chartLabel}>
        {formatNumber(max)}
      </text>
      <text x={pad.left - 6} y={y(0) + 4} textAnchor="end" className={styles.chartLabel}>0</text>
      <path d={line} fill="none" stroke="#2f7d63" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {ticks.map(({ i, anchor }) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={anchor} className={styles.chartLabel}>
          {formatDay(days[i], dateLocale, true)}
        </text>
      ))}
    </svg>
  )
}

// ── Formatting ────────────────────────────────────────────────────────────

/** Western digits and a comma for thousands in every language, as in the summary. */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatDay(iso: string, locale: string, short = false): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString(locale, short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long' })
}

function platformName(p: string): string {
  return ({ FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', LINE: 'LINE' } as Record<string, string>)[p] ?? p
}

function excerpt(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`
}