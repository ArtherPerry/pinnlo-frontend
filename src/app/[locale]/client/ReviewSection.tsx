'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Button, AuthedImage } from '@/components/ui'
import { CheckCircle } from 'lucide-react'
import {
  useClientPosts,
  useClientApprove,
  useClientRequestChanges,
  type ClientPost,
} from '@/hooks/useClientWorkspace'
import { useToast } from '@/hooks/useToast'
import { apiErrorMessage, formatDate } from '@/lib/utils'
import styles from './client.module.css'

function formatSchedule(iso: string | null, locale: string): string {
  if (!iso) return 'Not scheduled yet'
  return 'Scheduled for ' + formatDate(iso, locale, {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function ReviewSection({ readOnly = false }: { readOnly?: boolean }) {
  const locale = useLocale()
  const toast  = useToast()

  // Only posts the agency has pushed across for a decision. Anything earlier
  // is internal and the API does not return it.
  const { data: posts, isLoading, isError } = useClientPosts('PENDING_CLIENT')

  const approve        = useClientApprove()
  const requestChanges = useClientRequestChanges()

  const [revisionFor,     setRevisionFor]     = useState<ClientPost | null>(null)
  const [revisionComment, setRevisionComment] = useState('')

  const handleApprove = async (post: ClientPost) => {
    try {
      const updated = await approve.mutateAsync(post.id)
      // The server schedules it outright when a publish time is already set,
      // so the confirmation should say which happened.
      toast.show(
        updated.status === 'SCHEDULED' ? 'Approved and scheduled' : 'Approved',
        'success'
      )
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not approve this post'), 'error')
    }
  }

  const submitRevision = async () => {
    if (!revisionFor || !revisionComment.trim()) return
    try {
      await requestChanges.mutateAsync({
        postId:  revisionFor.id,
        comment: revisionComment.trim(),
      })
      toast.show('Sent back to your agency', 'success')
      setRevisionFor(null)
      setRevisionComment('')
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not send your request'), 'error')
    }
  }

  if (isLoading) {
    return <div className={styles.emptyState}><div className={styles.emptyText}>Loading…</div></div>
  }

  if (isError) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyTitle}>Could not load your posts</div>
        <div className={styles.emptyText}>Please try again shortly.</div>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><CheckCircle size={28} /></div>
        <div className={styles.emptyTitle}>All caught up</div>
        <div className={styles.emptyText}>
          There are no posts waiting for your review right now.
        </div>
      </div>
    )
  }

  const busy = approve.isPending || requestChanges.isPending

  return (
    <>
      {readOnly && (
        <div className={styles.readOnlyNote}>
          This workspace is paused, so posts are view-only for now. Contact your
          agency if you need to approve something.
        </div>
      )}

      <div className={styles.reviewList}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postMeta}>
                <div className={styles.platformPills}>
                  {post.platforms.map((p) => (
                    <span key={p} className={styles.platformPill}>{p}</span>
                  ))}
                </div>
              </div>
              <span className={styles.scheduledInfo}>
                {formatSchedule(post.scheduledAt, locale)}
              </span>
            </div>

            <div className={styles.postBody}>
              <div className={styles.postContent}>{post.content}</div>

              {post.media.length > 0 && (
                <div className={styles.mediaStrip}>
                  {post.media.map((asset) => (
                    <AuthedImage
                      key={asset.id}
                      src={asset.url}
                      publicUrl={asset.publicUrl}
                      alt={asset.originalName}
                      className={styles.mediaThumb}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.postActions}>
              <Button
                variant="secondary"
                size="sm"
                disabled={readOnly || busy}
                onClick={() => setRevisionFor(post)}
              >
                Request changes
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={readOnly || busy}
                onClick={() => handleApprove(post)}
              >
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
              Let your agency know what you&apos;d like changed. They&apos;ll revise
              it and send it back for review.
            </div>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Can we change the discount to 15%? And use a brighter photo."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setRevisionFor(null); setRevisionComment('') }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!revisionComment.trim() || requestChanges.isPending}
                onClick={submitRevision}
              >
                {requestChanges.isPending ? 'Sending…' : 'Send request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}