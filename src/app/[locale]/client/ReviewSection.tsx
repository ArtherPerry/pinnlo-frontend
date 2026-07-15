'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { CheckCircle } from 'lucide-react'
import styles from './client.module.css'

interface ReviewPost {
  id: string
  content: string
  platforms: string[]
  scheduledAt: string | null
  hasMedia: boolean
  decision?: 'APPROVED' | 'REVISION'
}

const MOCK_POSTS: ReviewPost[] = [
  {
    id: 'post-001',
    content: 'Special promotion! 20% off all new menu items 🎉 Come and try them today! Valid until end of month.',
    platforms: ['FACEBOOK', 'INSTAGRAM'],
    scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    hasMedia: true,
  },
  {
    id: 'post-002',
    content: 'Weekend vibes at Somjai ☕️ Come relax with our signature cold brew and freshly baked pastries.',
    platforms: ['FACEBOOK'],
    scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    hasMedia: true,
  },
  {
    id: 'post-003',
    content: 'New seasonal menu launching next week! Can you guess what we\'re adding? Hint: it\'s pumpkin spice season 🎃',
    platforms: ['FACEBOOK', 'INSTAGRAM'],
    scheduledAt: null,
    hasMedia: false,
  },
]

function formatSchedule(iso: string | null): string {
  if (!iso) return 'Not scheduled yet'
  return 'Scheduled for ' + new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function ReviewSection({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [posts, setPosts] = useState<ReviewPost[]>(MOCK_POSTS)
  const [revisionFor, setRevisionFor] = useState<string | null>(null)
  const [revisionComment, setRevisionComment] = useState('')

  const pending = posts.filter((p) => !p.decision)

  const approve = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, decision: 'APPROVED' } : p))
    onCountChange(pending.length - 1)
  }

  const submitRevision = () => {
    if (!revisionFor) return
    setPosts((prev) => prev.map((p) => p.id === revisionFor ? { ...p, decision: 'REVISION' } : p))
    onCountChange(pending.length - 1)
    setRevisionFor(null)
    setRevisionComment('')
  }

  if (pending.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><CheckCircle size={28} /></div>
        <div className={styles.emptyTitle}>All caught up!</div>
        <div className={styles.emptyText}>
          There are no posts waiting for your review right now.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.reviewList}>
        {pending.map((post) => (
          <div key={post.id} className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postMeta}>
                <div className={styles.platformPills}>
                  {post.platforms.map((p) => (
                    <span key={p} className={styles.platformPill}>{p}</span>
                  ))}
                </div>
              </div>
              <span className={styles.scheduledInfo}>{formatSchedule(post.scheduledAt)}</span>
            </div>

            <div className={styles.postBody}>
              <div className={styles.postContent}>{post.content}</div>
              {post.hasMedia && (
                <div className={styles.mediaPlaceholder}>Image preview</div>
              )}
            </div>

            <div className={styles.postActions}>
              <Button variant="secondary" size="sm"
                onClick={() => setRevisionFor(post.id)}>
                Request changes
              </Button>
              <Button variant="primary" size="sm"
                onClick={() => approve(post.id)}>
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>

      {revisionFor && (
        <div className={styles.modalOverlay} onClick={() => setRevisionFor(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Request changes</div>
            <div className={styles.modalSub}>
              Let your agency know what you&apos;d like changed. They&apos;ll revise and send it back for review.
            </div>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Can we change the discount to 15%? And use a brighter photo."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" size="sm" onClick={() => setRevisionFor(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm"
                disabled={!revisionComment.trim()}
                onClick={submitRevision}>
                Send request
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}