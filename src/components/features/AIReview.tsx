'use client'

import { useEffect, useState } from 'react'
import styles from './AIReview.module.css'
import { Sparkles, AlertCircle } from 'lucide-react'
import { useAIReview } from '@/hooks/useAI'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/types'

interface AIReviewProps {
  clientId:  string
  content:   string
  platforms: Platform[]
  hasMedia:  boolean
  /** The client's usual market — the starting point, not a constraint. */
  defaultMarket: string
}

/**
 * The market being reviewed for is a property of the post, not the client: a
 * Bangkok restaurant may run a campaign aimed at Myanmar tourists, and a Lao
 * agency may post for a Thai client. The client's market is only the default.
 */
const MARKETS = [
  { value: 'TH', label: 'Thailand' },
  { value: 'MM', label: 'Myanmar'  },
  { value: 'LA', label: 'Laos'     },
]

/**
 * Renders the review's light markdown without a library.
 *
 * The model returns **bold** headings and "-" bullets and nothing else, so a
 * dependency for this would be more code than the code. Also normalises the
 * non-breaking hyphens and narrow spaces the model emits, which otherwise
 * render as odd gaps.
 */
function renderReview(markdown: string) {
  const clean = markdown
    .replace(/\u2011/g, '-')   // non-breaking hyphen
    .replace(/\u202f/g, ' ')   // narrow no-break space
    .replace(/\u2013/g, '–')

  return clean.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return null

    // A whole line that is bold is a heading.
    const heading = trimmed.match(/^\*\*(.+?)\*\*\s*$/)
    if (heading) {
      return <div key={i} className={styles.sectionTitle}>{heading[1]}</div>
    }

    const bullet = trimmed.startsWith('- ') || trimmed.startsWith('• ')
    const text = bullet ? trimmed.slice(2) : trimmed

    // Inline bold inside a line.
    const parts = text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : part
    )

    return bullet
      ? <li key={i} className={styles.bullet}>{parts}</li>
      : <p key={i} className={styles.para}>{parts}</p>
  })
}

export function AIReview({
  clientId,
  content,
  platforms,
  hasMedia,
  defaultMarket,
}: AIReviewProps) {
  const [market, setMarket] = useState(defaultMarket)
  const review = useAIReview()
  const { mutate } = review

  const run = (targetMarket: string) => {
    mutate({ clientId, content, platforms, hasMedia, market: targetMarket })
  }

  // Runs once when opened. The parent only mounts this after the user clicks
  // AI review, so mounting is the request.
  useEffect(() => {
    if (clientId && content.trim()) {
      run(market)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <span className={styles.introIcon}><Sparkles size={20} /></span>
        <div>
          <div className={styles.introTitle}>AI review</div>
          <div className={styles.introSub}>
            Advice grounded in market knowledge for the selected country.
            It has no data on this client&apos;s own followers or competitors.
          </div>
        </div>
      </div>

      {/* Changing the market re-runs straight away — the intent is
          unambiguous, and a second click to confirm would be friction. */}
      <div className={styles.marketRow}>
        <span className={styles.marketLabel}>Reviewing for</span>
        {MARKETS.map((m) => (
          <button
            key={m.value}
            type="button"
            className={cn(
              styles.marketOption,
              market === m.value && styles.marketOptionActive,
            )}
            onClick={() => { setMarket(m.value); run(m.value) }}
            disabled={review.isPending}
          >
            {m.label}
          </button>
        ))}
      </div>

      {review.isPending && (
        <div className={styles.state}>Reading the post…</div>
      )}

      {review.isError && (
        <div className={styles.error}>
          <AlertCircle size={16} />
          <span>
            {(review.error as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Could not produce a review.'}
          </span>
        </div>
      )}

      {review.data && !review.isPending && (
        <>
          <div className={styles.body}>{renderReview(review.data.review)}</div>
          <button
            type="button"
            className={styles.regenerate}
            onClick={() => run(market)}
            disabled={review.isPending}
          >
            Review again
          </button>
        </>
      )}
    </div>
  )
}