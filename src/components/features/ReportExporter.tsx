'use client'

import { useState, useRef } from 'react'
import { useAnalyticsOverview, usePostPerformance } from '@/hooks/useAnalytics'
import { PlatformIcon } from '@/components/ui'
import styles from './ReportExporter.module.css'

interface ReportOptions {
  includeOverview:    boolean
  includePostTable:   boolean
  includeHeatmap:     boolean
  includeCompetitors: boolean
  brandColor:         string
  companyName:        string
  dateRange:          string
}

interface ReportExporterProps {
  clientName?:  string
  brandColor?:  string
  companyName?: string
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function ReportExporter({
  clientName  = 'Client',
  brandColor  = '#1D9E75',
  companyName = 'NC Digital Agency',
}: ReportExporterProps) {
  const [showModal, setShowModal] = useState(false)
  const [options,   setOptions  ] = useState<ReportOptions>({
    includeOverview:    true,
    includePostTable:   true,
    includeHeatmap:     false,
    includeCompetitors: false,
    brandColor,
    companyName,
    dateRange:          'Last 30 days',
  })

  const reportRef = useRef<HTMLDivElement>(null)

  const { data: overview } = useAnalyticsOverview()
  const { data: posts    } = usePostPerformance()

  const toggleOption = (key: keyof ReportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePrint = () => {
    // Inject report into DOM for printing
    const reportEl = reportRef.current
    if (!reportEl) return

    // Create hidden print container
    const printDiv = document.createElement('div')
    printDiv.id = 'pinnlo-report'
    printDiv.style.display = 'none'
    printDiv.innerHTML = reportEl.innerHTML
    document.body.appendChild(printDiv)

    window.print()

    // Clean up
    document.body.removeChild(printDiv)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        className={styles.exportBtn}
        onClick={() => setShowModal(true)}
      >
        📄 Export PDF
      </button>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Export PDF report</span>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {/* Options */}
            <div className={styles.optionsPanel}>

              {/* Company name */}
              <div className={styles.fieldGrid}>
                <div>
                  <label className={styles.fieldLabel}>
                    Agency / company name
                  </label>
                  <input
                    value={options.companyName}
                    onChange={(e) => setOptions((prev) => ({ ...prev, companyName: e.target.value }))}
                    className={styles.fieldInput}
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel}>
                    Date range
                  </label>
                  <select
                    value={options.dateRange}
                    onChange={(e) => setOptions((prev) => ({ ...prev, dateRange: e.target.value }))}
                    className={styles.fieldSelect}
                  >
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last 12 months</option>
                  </select>
                </div>
              </div>

              {/* Brand color */}
              <div className={styles.brandColorRow}>
                <div>
                  <label className={styles.fieldLabel}>
                    Accent color
                  </label>
                  <input
                    type="color"
                    value={options.brandColor}
                    onChange={(e) => setOptions((prev) => ({ ...prev, brandColor: e.target.value }))}
                    className={styles.colorInput}
                  />
                </div>
                <div className={styles.reportForWrap}>
                  <label className={styles.fieldLabel}>
                    Report for
                  </label>
                  <div className={styles.reportForValue}>
                    {clientName}
                  </div>
                </div>
              </div>

              {/* Section toggles */}
              <div className={styles.sectionTogglesWrap}>
                <span className={styles.sectionTogglesLabel}>
                  Include sections
                </span>
                {[
                  { key: 'includeOverview',    title: 'Page overview',     sub: 'Followers, reach, engagement rate'            },
                  { key: 'includePostTable',   title: 'Post performance',  sub: 'Top posts with reach and engagement metrics'  },
                  { key: 'includeHeatmap',     title: 'Best posting times', sub: 'Pro plan — AI-powered engagement heatmap'    },
                  { key: 'includeCompetitors', title: 'Competitor summary', sub: 'Follower comparison vs tracked competitors'  },
                ].map(({ key, title, sub }) => (
                  <div key={key} className={styles.optionRow}>
                    <div className={styles.optionLeft}>
                      <span className={styles.optionTitle}>{title}</span>
                      <span className={styles.optionSub}>{sub}</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={options[key as keyof ReportOptions] as boolean}
                        onChange={() => toggleOption(key as keyof ReportOptions)}
                      />
                      <div className={styles.toggleTrack} />
                      <div className={styles.toggleThumb} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className={styles.preview}>
              <div className={styles.previewLabel}>PREVIEW</div>

              {/* Hidden print target */}
              <div ref={reportRef}>
                <div className={styles.reportCard}>

                  {/* Branding */}
                  <div
                    className={styles.reportBranding}
                    style={{ borderBottomColor: options.brandColor }}
                  >
                    <div>
                      <div className={styles.reportBrandName}>{clientName}</div>
                      <div className={styles.reportTagline} style={{ color: options.brandColor }}>
                        Performance Report — {options.dateRange}
                      </div>
                    </div>
                    <div className={styles.reportBrandRight}>
                      <div className={styles.reportCompanyName}>
                        {options.companyName}
                      </div>
                      <div className={styles.reportDate}>
                        Generated {new Date().toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Overview section */}
                  {options.includeOverview && overview && (
                    <div className={styles.reportSection}>
                      <div
                        className={styles.reportSectionTitle}
                        style={{ borderBottomColor: options.brandColor }}
                      >
                        Page overview
                      </div>
                      <div className={styles.reportMetricGrid}>
                        {[
                          { value: formatNum(overview.totalFollowers),   label: 'Total followers', change: `+${overview.followerGrowth}%` },
                          { value: formatNum(overview.totalReach),        label: 'Total reach',     change: `+${overview.reachGrowth}%`    },
                          { value: `${overview.engagementRate.toFixed(1)}%`, label: 'Engagement',  change: ''                             },
                          { value: overview.postsPublished.toString(),   label: 'Posts published', change: ''                             },
                        ].map(({ value, label, change }) => (
                          <div key={label} className={styles.reportMetric}>
                            <div
                              className={styles.reportMetricValue}
                              style={{ color: options.brandColor }}
                            >
                              {value}
                            </div>
                            <div className={styles.reportMetricLabel}>{label}</div>
                            {change && (
                              <div className={styles.reportMetricChange}>
                                {change}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post performance table */}
                  {options.includePostTable && posts && posts.length > 0 && (
                    <div className={styles.reportSection}>
                      <div
                        className={styles.reportSectionTitle}
                        style={{ borderBottomColor: options.brandColor }}
                      >
                        Post performance
                      </div>
                      <div className={styles.reportTableWrap}>
                        <table className={styles.reportTable}>
                          <thead>
                            <tr>
                              <th>Post</th>
                              <th>Platform</th>
                              <th>Reach</th>
                              <th>Engagement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {posts.slice(0, 5).map((post) => (
                              <tr key={post.id}>
                                <td className={styles.reportTablePostCell}>
                                  {post.content.slice(0, 60)}{post.content.length > 60 ? '...' : ''}
                                </td>
                                <td>
                                  <div className={styles.reportTablePlatform}>
                                    <PlatformIcon platform={post.platform as 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'LINE'} size={12} />
                                    {post.platform}
                                  </div>
                                </td>
                                <td>{formatNum(post.reach)}</td>
                                <td
                                  className={styles.reportTableEngagement}
                                  style={{
                                    color: post.engagementRate >= 7
                                      ? 'var(--color-success)'
                                      : post.engagementRate >= 4
                                        ? 'var(--color-warning)'
                                        : 'var(--color-muted)',
                                  }}
                                >
                                  {post.engagementRate.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Placeholder sections */}
                  {options.includeHeatmap && (
                    <div className={styles.reportSection}>
                      <div
                        className={styles.reportSectionTitle}
                        style={{ borderBottomColor: options.brandColor }}
                      >
                        Best posting times
                      </div>
                      <div className={styles.reportPlaceholder}>
                        Peak engagement: Wednesday & Friday, 7–9 PM (ICT)
                      </div>
                    </div>
                  )}

                  {options.includeCompetitors && (
                    <div className={styles.reportSection}>
                      <div
                        className={styles.reportSectionTitle}
                        style={{ borderBottomColor: options.brandColor }}
                      >
                        Competitor comparison
                      </div>
                      <div className={styles.reportPlaceholder}>
                        Your page: 28,450 followers — Industry avg: 391,000 followers
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className={styles.reportFooter}>
                    Report generated by Pinnalo — {options.companyName} · {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <span className={styles.modalFooterLeft}>
                ℹ Your browser will open the print dialog. Select &quot;Save as PDF&quot;.
              </span>
              <button className={styles.printBtn} onClick={handlePrint}>
                📄 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}