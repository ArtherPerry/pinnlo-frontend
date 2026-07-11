'use client'

import { usePosts, useApprovePost, useRejectPost } from '@/hooks/usePosts'
import { Badge } from '@/components/ui'
import { PlatformIcons } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { formatDate, cn } from '@/lib/utils'
import { useState } from 'react'
import type { Post } from '@/lib/types'
import styles from './approval.module.css'

export default function ApprovalPage() {
  const { data: posts, isLoading } = usePosts('PENDING_REVIEW')
  const approve = useApprovePost()
  const reject  = useRejectPost()
  const toast   = useToast()

  const [rejectTarget,  setRejectTarget ] = useState<Post | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync(id)
      toast.show('Post approved ✓', 'success')
    } catch {
      toast.show('Failed to approve', 'error')
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectComment.trim()) return
    try {
      await reject.mutateAsync({ id: rejectTarget.id, comment: rejectComment })
      toast.show('Post rejected', 'warning')
      setRejectTarget(null)
      setRejectComment('')
    } catch {
      toast.show('Failed to reject', 'error')
    }
  }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Approval queue</h2>
          <p className={styles.pageSub}>
            Internal review (step 1 of 2). Approved posts go to the client for final sign-off.
          </p>
        </div>
        {posts && posts.length > 0 && (
          <span className={styles.queueCount}>
            {posts.length} pending
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={styles.skeletonList}>
          {[1, 2].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && posts?.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>All clear</div>
          <div className={styles.emptySub}>
            No posts waiting for approval right now.
          </div>
        </div>
      )}

      {/* Approval cards */}
      {!isLoading && posts && posts.length > 0 && (
        <div className={styles.list}>
          {posts.map((post) => (
            <div key={post.id} className={styles.card}>

              {/* Card header */}
              <div className={styles.cardHeader}>
                <div className={styles.cardMeta}>
                  <span className={styles.clientName}>{post.clientName}</span>
                  <span className={styles.dot}>·</span>
                  <PlatformIcons platforms={post.platforms as any} size={14} />
                  <span className={styles.dot}>·</span>
                  <span className={styles.author}>by {post.createdBy}</span>
                </div>
                <div className={styles.pipeline}>
                  <span className={`${styles.pipeStep} ${styles.pipeActive}`}>1 · Internal</span>
                  <span className={styles.pipeArrow}>→</span>
                  <span className={styles.pipeStep}>2 · Client</span>
                </div>
              </div>

              {/* Content */}
              <p className={styles.content}>{post.content}</p>

              {/* Labels */}
              {post.labels.length > 0 && (
                <div className={styles.labels}>
                  {post.labels.map((l) => (
                    <span key={l} className={styles.label}>{l}</span>
                  ))}
                </div>
              )}

              {/* Schedule info */}
              {post.scheduledAt && (
                <div className={styles.scheduleInfo}>
                  <span className={styles.scheduleIcon}>🕐</span>
                  Scheduled for{' '}
                  <strong>
                    {formatDate(post.scheduledAt, 'th-TH', {
                      weekday:  'long',
                      year:     'numeric',
                      month:    'long',
                      day:      'numeric',
                    })}
                  </strong>
                </div>
              )}

              {/* Submitted info */}
              <div className={styles.submittedAt}>
                Submitted {formatDate(post.createdAt, 'th-TH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                } as any)}
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  className={cn(styles.actionBtn, styles.skipBtn)}
                  onClick={() => handleApprove(post.id)}
                  title="Send straight to the client without internal sign-off"
                >
                  Skip to client
                </button>
                <button
                  className={cn(styles.actionBtn, styles.rejectBtn)}
                  onClick={() => setRejectTarget(post)}
                  disabled={reject.isPending}
                >
                  ✕ Reject
                </button>
                <button
                  className={cn(styles.actionBtn, styles.approveBtn)}
                  onClick={() => handleApprove(post.id)}
                  disabled={approve.isPending}
                >
                  {approve.isPending ? 'Approving...' : '✓ Approve & send to client'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div
          className={styles.overlay}
          onClick={() => { setRejectTarget(null); setRejectComment('') }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Reject post</h3>
            <p className={styles.modalSub}>
              Let <strong>{rejectTarget.createdBy}</strong> know what
              needs to be changed.
            </p>

            <div className={styles.previewSnippet}>
              {rejectTarget.content.slice(0, 120)}
              {rejectTarget.content.length > 120 ? '...' : ''}
            </div>

            <textarea
              className={styles.textarea}
              placeholder="e.g. Image resolution too low, please use the new brand photo..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              autoFocus
            />

            <div className={styles.modalActions}>
              <button
                className={cn(styles.actionBtn, styles.cancelBtn)}
                onClick={() => { setRejectTarget(null); setRejectComment('') }}
              >
                Cancel
              </button>
              <button
                className={cn(styles.actionBtn, styles.rejectBtn)}
                onClick={handleReject}
                disabled={!rejectComment.trim() || reject.isPending}
              >
                {reject.isPending ? 'Rejecting...' : 'Send rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}