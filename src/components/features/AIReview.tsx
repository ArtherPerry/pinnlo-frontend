'use client'

import styles from './AIReview.module.css'

interface AIReviewProps {
  content: string
  clientName?: string
  hasMedia: boolean
}

// Mock recommendations — in production these come from the RAG backend
// (SEA market chunks + content-writing chunks + client history + competitor data)
function buildMockReview(content: string, clientName?: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  return {
    audience: {
      primary: 'Urban millennials (25–34), food & lifestyle interest',
      note: `Based on ${clientName ?? 'this client'}'s follower base and similar F&B pages in the region.`,
    },
    timing: {
      bestTime: 'Thursday–Friday, 6:00–8:00 PM',
      location: 'Bangkok metro + surrounding provinces',
      note: 'Engagement for this client peaks in early evening on weekdays.',
    },
    content: {
      score: wordCount > 0 ? (wordCount < 40 ? 'Good length' : 'Consider shortening') : 'Add some text',
      tips: [
        'Tone fits the SEA casual-friendly style — good.',
        'Consider adding 1–2 local hashtags for discovery.',
        'A question at the end tends to lift comments for this market.',
      ],
    },
    competitor: {
      insight: 'Two tracked competitors posted discount promotions this week.',
      suggestion: 'Your angle differs (experience-focused) — lean into that to stand out rather than competing on price.',
    },
    performance: {
      estimate: '3,200–4,500 reach',
      note: `Estimated from ${clientName ?? 'this client'}'s last 10 posts with similar content and timing.`,
    },
  }
}

export function AIReview({ content, clientName, hasMedia }: AIReviewProps) {
  const review = buildMockReview(content, clientName)

  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <span className={styles.introIcon}>✨</span>
        <div>
          <div className={styles.introTitle}>AI Review</div>
          <div className={styles.introSub}>
            Grounded in Southeast Asia market knowledge, {clientName ?? 'this client'}&apos;s history, and competitor activity.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>🎯</span> Target Audience
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.primary}>{review.audience.primary}</div>
          <div className={styles.note}>{review.audience.note}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>🕐</span> Best Timing & Location
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.primary}>{review.timing.bestTime}</div>
          <div className={styles.primary}>{review.timing.location}</div>
          <div className={styles.note}>{review.timing.note}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>📝</span> Content Feedback
          <span className={styles.scoreTag}>{review.content.score}</span>
        </div>
        <div className={styles.sectionBody}>
          <ul className={styles.tips}>
            {review.content.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>👀</span> Competitor Insight
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.primary}>{review.competitor.insight}</div>
          <div className={styles.note}>{review.competitor.suggestion}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>📈</span> Performance Outlook
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.primary}>{review.performance.estimate}</div>
          <div className={styles.note}>{review.performance.note}</div>
        </div>
      </div>

      {!hasMedia && (
        <div className={styles.warnNote}>
          Tip: posts with an image or video typically get more reach in this market.
        </div>
      )}
    </div>
  )
}