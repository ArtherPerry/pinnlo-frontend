'use client'

import { useState } from 'react'
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

/** What a stored review was produced from, so an edited post can be told apart. */
interface StoredReview {
  signature: string
  review: string
}

export function AIReview({
  clientId,
  content,
  platforms,
  hasMedia,
  defaultMarket,
}: AIReviewProps) {
  const [market, setMarket] = useState(defaultMarket)
  // One result per market. Reviews are metered, so a market already reviewed
  // for this exact post is shown again for free rather than asked for twice.
  const [results, setResults] = useState<Record<string, StoredReview>>({})
  const review = useAIReview()

  // Everything the review depends on. If any of it changes, a stored review
  // describes a different post.
  const signature = JSON.stringify({ content, platforms, hasMedia })
  const shown = results[market]
  const stale = shown !== undefined && shown.signature !== signature
  const marketLabel = MARKETS.find((m) => m.value === market)?.label ?? market
  const canRun = Boolean(clientId && content.trim()) && !review.isPending

  // Nothing runs until asked: choosing a market only selects it. Before, both
  // opening this panel and clicking a market spent a review straight away.
  const run = () => {
    const forMarket = market
    const forSignature = signature
    review.mutate(
      { clientId, content, platforms, hasMedia, market: forMarket },
      {
        onSuccess: (data) =>
          setResults((prev) => ({
            ...prev,
            [forMarket]: { signature: forSignature, review: data.review },
          })),
      },
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <span className={styles.introIcon}><Sparkles size={20} /></span>
        <div>
          <div className={styles.introTitle}>AI review</div>
          <div className={styles.introSub}>
            Advice grounded in market knowledge, writing craft, and this
            client&apos;s own measured performance.
          </div>
        </div>
      </div>

      <div className={styles.marketRow}>
        <span className={styles.marketLabel}>Review for</span>
        {MARKETS.map((m) => (
          <button
            key={m.value}
            type="button"
            className={cn(
              styles.marketOption,
              market === m.value && styles.marketOptionActive,
            )}
            onClick={() => setMarket(m.value)}
            disabled={review.isPending}
            aria-pressed={market === m.value}
          >
            {m.label}
            {results[m.value] && <span className={styles.reviewedMark} aria-label="reviewed"> ✓</span>}
          </button>
        ))}
      </div>

      {/* The one action that costs a review, stated plainly. */}
      {(!shown || stale) && !review.isPending && (
        <div className={styles.runRow}>
          <button
            type="button"
            className={styles.runButton}
            onClick={run}
            disabled={!canRun}
          >
            <Sparkles size={15} />
            {stale ? 'Review the updated post' : `Review for ${marketLabel}`}
          </button>
          <span className={styles.hint}>Uses one AI review from your plan.</span>
        </div>
      )}

      {review.isPending && (
        <div className={styles.state}>Reading the post for {marketLabel}…</div>
      )}

      {review.isError && !review.isPending && (
        <div className={styles.error}>
          <AlertCircle size={16} />
          <span>
            {(review.error as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Could not produce a review.'}
          </span>
        </div>
      )}

      {/* The advice stays visible after an edit — people usually edit because
          of it — but says plainly that it describes the earlier version. */}
      {shown && !review.isPending && (
        <>
          {stale && (
            <div className={styles.staleNote}>
              The post has changed since this review.
            </div>
          )}
          <div className={styles.body}>{renderReview(shown.review)}</div>
          {!stale && (
            <button
              type="button"
              className={styles.regenerate}
              onClick={run}
              disabled={!canRun}
            >
              Review again · uses one review
            </button>
          )}
        </>
      )}
    </div>
  )
}