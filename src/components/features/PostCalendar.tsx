'use client'

import { useState } from 'react'
import { usePostCalendar } from '@/hooks/usePosts'
import { cn } from '@/lib/utils'
import styles from './PostCalendar.module.css'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export function PostCalendar() {
  const today = new Date()
  const [year,  setYear ] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const { data, isLoading } = usePostCalendar(year, month)

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else { setMonth((m) => m - 1) }
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else { setMonth((m) => m + 1) }
  }

  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const pad = (n: number) => String(n).padStart(2, '0')

  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  return (
    <div className={styles.wrapper}>
      {/* Nav */}
      <div className={styles.nav}>
        <span className={styles.navTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className={styles.todayBtn} onClick={goToday}>Today</button>
          <div className={styles.navBtns}>
            <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">‹</button>
            <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">›</button>
          </div>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className={styles.dowRow}>
        {DOW.map((d) => (
          <div key={d} className={styles.dowCell}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.skeleton}>
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className={styles.skeletonCell} />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`empty-${idx}`} className={cn(styles.cell, styles.cellEmpty)} />
            )

            const dateKey = `${year}-${pad(month)}-${pad(day)}`
            const posts = data?.days?.[dateKey] ?? []
            const isToday = dateKey === todayKey

            return (
              <div
                key={dateKey}
                className={cn(styles.cell, isToday && styles.cellToday)}
              >
                <div className={styles.dayNum}>{day}</div>

                {posts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className={cn(styles.postDot, styles[post.status])}
                    title={`${post.clientName} — ${post.status}`}
                  >
                    <span className={cn(styles.dotIndicator, styles[post.status])} />
                    {post.clientName}
                  </div>
                ))}

                {posts.length > 3 && (
                  <div className={styles.moreCount}>+{posts.length - 3} more</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}