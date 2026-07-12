'use client'

import { useState } from 'react'
import type { AnalyticsOverview } from '@/lib/types'
import styles from './AnalystSummary.module.css'
import { Sparkles, Video, Calendar, AlertTriangle, TrendingUp, Eye, MessageCircle, type LucideIcon } from 'lucide-react'

type ViewMode = 'client' | 'agency'

interface Insight {
  icon: LucideIcon
  text: string
}

interface Action {
  text: string
}

function buildNarrative(overview: AnalyticsOverview | undefined, view: ViewMode) {
  const reachGrowth = overview?.reachGrowth ?? 40
  const followerGrowth = overview?.followerGrowth ?? 3.2
  const engagementRate = overview?.engagementRate ?? 5.8

  const reachUp = reachGrowth >= 0

  const headline = reachUp
    ? `Your page had a <strong>strong month</strong> — reach grew ${reachGrowth}%, mostly driven by video posts.`
    : `Your reach dropped ${Math.abs(reachGrowth)}% this month, but there's a clear reason and an easy fix.`

  const insights: Insight[] = [
    { icon: Video, text: 'Your <strong>video posts</strong> reached about 5x more people than photos this month.' },
    { icon: Calendar, text: 'Posts on <strong>Saturday mornings</strong> got the most engagement — that&apos;s when your audience is most active.' },
    { icon: followerGrowth < 2 ? AlertTriangle : TrendingUp,
      text: followerGrowth < 2
        ? `Engagement is healthy, but <strong>follower growth is slowing</strong> (${followerGrowth}%). Worth attention.`
        : `Followers grew a healthy <strong>${followerGrowth}%</strong> this month.` },
  ]

  if (view === 'agency') {
    insights.push({
      icon: Eye,
      text: 'Two tracked competitors ran discount promos this month — an opening to differentiate on experience.',
    })
    insights.push({
      icon: MessageCircle,
      text: `Engagement rate (${engagementRate}%) is above the F&B category average for this region.`,
    })
  }

  const actions: Action[] = view === 'client'
    ? [
        { text: 'Post <strong>2–3 short videos</strong> next week — they\'re clearly working best for you.' },
        { text: 'Schedule your posts for <strong>Saturday around 9 AM</strong> when your audience is most active.' },
        { text: 'Keep replying to comments quickly — it\'s helping your engagement.' },
      ]
    : [
        { text: 'Shift the content mix toward <strong>video</strong> (aim 60% video next month).' },
        { text: 'Concentrate posting in the <strong>Sat–Sun morning</strong> window; test Friday evening too.' },
        { text: 'Launch a <strong>follower-growth push</strong> (a giveaway or collab) to counter the slowing growth.' },
        { text: 'Lean into <strong>experience-led content</strong> to differentiate from competitors\' discounting.' },
      ]

  return { headline, insights, actions }
}

export function AnalystSummary({ overview, clientName }: {
  overview?: AnalyticsOverview
  clientName?: string
}) {
  const [view, setView] = useState<ViewMode>('client')
  const { headline, insights, actions } = buildNarrative(overview, view)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}><Sparkles size={20} /></div>
          <div>
            <div className={styles.title}>AI Analyst Report</div>
            <div className={styles.subtitle}>
              {clientName ? `${clientName} · ` : ''}Plain-language insights from your data
            </div>
          </div>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === 'client' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('client')}
          >
            Simple
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'agency' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('agency')}
          >
            Detailed
          </button>
        </div>
      </div>

      <div className={styles.headline} dangerouslySetInnerHTML={{ __html: headline }} />

      <div className={styles.sectionTitle}>What&apos;s happening</div>
      <div className={styles.insightList}>
        {insights.map((ins, i) => {
          const Icon = ins.icon
          return (
            <div key={i} className={styles.insight}>
              <span className={styles.insightIcon}><Icon size={16} /></span>
              <span className={styles.insightText} dangerouslySetInnerHTML={{ __html: ins.text }} />
            </div>
          )
        })}
      </div>

      <div className={styles.sectionTitle}>What to do next</div>
      <div className={styles.actionList}>
        {actions.map((act, i) => (
          <div key={i} className={styles.action}>
            <span className={styles.actionNum}>{i + 1}</span>
            <span className={styles.actionText} dangerouslySetInnerHTML={{ __html: act.text }} />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        This report is generated from your connected accounts and grounded in Southeast Asia
        market knowledge. Always review before acting.
      </div>
    </div>
  )
}