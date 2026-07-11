'use client'

import { useState } from 'react'
import styles from './client.module.css'

interface CalendarPost {
  date: string // YYYY-MM-DD
  title: string
  status: 'SCHEDULED' | 'APPROVED'
}

// Mock: scatter a few posts across the current month
function buildMockPosts(year: number, month: number): CalendarPost[] {
  const mk = (day: number, title: string, status: 'SCHEDULED' | 'APPROVED'): CalendarPost => ({
    date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    title, status,
  })
  return [
    mk(5, '20% off promo', 'SCHEDULED'),
    mk(5, 'Weekend vibes', 'APPROVED'),
    mk(12, 'New menu teaser', 'SCHEDULED'),
    mk(18, 'Customer story', 'APPROVED'),
    mk(24, 'Holiday hours', 'SCHEDULED'),
    mk(24, 'Thank you post', 'APPROVED'),
    mk(28, 'Month recap', 'SCHEDULED'),
  ]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function CalendarSection() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const posts = buildMockPosts(year, month)
  const postsByDate = posts.reduce<Record<string, CalendarPost[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p)
    return acc
  }, {})

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  return (
    <div className={styles.calendarWrap}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarMonth}>{MONTH_NAMES[month]} {year}</div>
        <div className={styles.calendarNav}>
          <button className={styles.calendarNavBtn} onClick={prev}>‹</button>
          <button className={styles.calendarNavBtn} onClick={next}>›</button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {DAY_NAMES.map((d) => (
          <div key={d} className={styles.calendarDayName}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className={`${styles.calendarCell} ${styles.calendarCellOutside}`} />
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayPosts = postsByDate[dateStr] ?? []
          const isToday = dateStr === todayStr
          return (
            <div key={i} className={styles.calendarCell}>
              <div className={`${styles.calendarDate} ${isToday ? styles.calendarToday : ''}`}>
                {day}
              </div>
              {dayPosts.map((p, j) => (
                <div
                  key={j}
                  className={`${styles.calendarPost} ${p.status === 'SCHEDULED' ? styles.calendarPostScheduled : ''}`}
                  title={p.title}
                >
                  {p.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-teal-500)' }} />
          Approved
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-info)' }} />
          Scheduled
        </div>
      </div>
    </div>
  )
}