'use client'

import { useMemo, useState } from 'react'
import { useClientCalendar, useClientPost, type ClientPost } from '@/hooks/useClientWorkspace'
import styles from './client.module.css'
import { AuthedImage } from '@/components/ui/AuthedImage'


const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Local YYYY-MM-DD, so a post lands on the day the client sees it. */
function localDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function CalendarSection() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [openPostId, setOpenPostId] = useState<string | null>(null)

  // Whole month, past and future. A client looking at their calendar wants to
  // see what went out as much as what is coming.
  const from = new Date(Date.UTC(year, month, 1)).toISOString()
  const to   = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString()

  const { data: posts, isLoading, isError } = useClientCalendar(from, to)

  const postsByDate = useMemo(() => {
    const map: Record<string, ClientPost[]> = {}
    for (const post of posts ?? []) {
      // Published posts sit on the day they went out; everything else on the
      // day it is due.
      const anchor = post.publishedAt ?? post.scheduledAt
      if (!anchor) continue
      ;(map[localDateKey(anchor)] ??= []).push(post)
    }
    return map
  }, [posts])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr    = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1)
  }

  const statusClass = (status: string) => {
    if (status === 'PUBLISHED')           return styles.calendarPostPublished
    if (status === 'PARTIALLY_PUBLISHED') return styles.calendarPostPartial
    if (status === 'FAILED')              return styles.calendarPostFailed
    if (status === 'SCHEDULED')           return styles.calendarPostScheduled
    return ''   // PENDING_CLIENT, CHANGES_REQUESTED, APPROVED
  }

  return (
    <div className={styles.calendarWrap}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarMonth}>{MONTH_NAMES[month]} {year}</div>
        <div className={styles.calendarNav}>
          <button className={styles.calendarNavBtn} onClick={prev} aria-label="Previous month">‹</button>
          <button className={styles.calendarNavBtn} onClick={next} aria-label="Next month">›</button>
        </div>
      </div>

      {isError && (
        <div className={styles.calendarNotice}>
          Could not load your calendar. Please try again shortly.
        </div>
      )}

      {!isError && !isLoading && (posts?.length ?? 0) === 0 && (
        <div className={styles.calendarNotice}>
          Nothing scheduled or published this month.
        </div>
      )}

      <div className={styles.calendarGrid} aria-busy={isLoading}>
        {DAY_NAMES.map((d) => (
          <div key={d} className={styles.calendarDayName}>{d}</div>
        ))}

        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className={`${styles.calendarCell} ${styles.calendarCellOutside}`} />
          }
          const key      = dateKey(year, month, day)
          const dayPosts = postsByDate[key] ?? []
          const isToday  = key === todayStr

          return (
            <div key={i} className={styles.calendarCell}>
              <div className={`${styles.calendarDate} ${isToday ? styles.calendarToday : ''}`}>
                {day}
              </div>
              {dayPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className={`${styles.calendarPost} ${statusClass(post.status)}`}
                  onClick={() => setOpenPostId(post.id)}
                  title={`${post.content}\n${post.platforms.join(', ')}`}
                >
                  {post.content}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-teal-500)' }} />
          Published
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-info)' }} />
          Scheduled
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-warning, #e8b84b)' }} />
          Awaiting your review
        </div>
      </div>

      {openPostId && (
        <PostDetail id={openPostId} onClose={() => setOpenPostId(null)} />
      )}
    </div>
  )
}

/**
 * One post, read-only.
 *
 * Approve and request-changes live in ReviewSection, which filters to
 * PENDING_CLIENT. The calendar also shows published and scheduled posts, and
 * offering an approve button on something already live would be a lie — so
 * this view has no actions at all.
 */
function PostDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: post, isLoading, isError } = useClientPost(id)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {isLoading && <div className={styles.modalSub}>Loading…</div>}
        {isError && <div className={styles.modalSub}>Could not load this post.</div>}

        {post && (
          <>
            <div className={styles.modalTitle}>{post.platforms.join(' · ')}</div>

            <div className={styles.detailStatus}>
              {post.publishedAt
                ? `Published ${new Date(post.publishedAt).toLocaleString()}`
                : post.scheduledAt
                  ? `Scheduled for ${new Date(post.scheduledAt).toLocaleString()}`
                  : 'Not scheduled'}
            </div>

            <p className={styles.detailContent}>{post.content}</p>

            {post.media.length > 0 && (
              <div className={styles.detailMedia}>
                {post.media.map((m) => (
                  <AuthedImage
                    key={m.id}
                    src={m.url}
                    publicUrl={m.publicUrl}
                    alt={m.originalName}
                    className={styles.detailMediaImg}
                  />
                ))}
              </div>
            )}

            {post.clientComment && (
              <div className={styles.detailComment}>
                <strong>Your note:</strong> {post.clientComment}
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.detailCloseBtn} onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}