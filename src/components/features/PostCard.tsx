'use client'

import { useState } from 'react'
import type { Post } from '@/lib/types'
import { Badge, PlatformIcons } from '@/components/ui'
import { useApprovePost, useRejectPost, useDeletePost } from '@/hooks/usePosts'
import { useToast } from '@/hooks/useToast'
import { cn, formatDate } from '@/lib/utils'
import styles from './PostCard.module.css'
import { EditPostModal } from './EditPostModal'

const STATUS_BADGE: Record<string, Parameters<typeof Badge>[0]['variant']> = {
  DRAFT:          'draft',
  PENDING_REVIEW: 'warning',
  APPROVED:       'info',
  SCHEDULED:      'scheduled',
  PUBLISHING:     'publishing',
  PUBLISHED:      'published',
  FAILED:         'failed',
  CANCELLED:      'cancelled',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:          'Draft',
  PENDING_REVIEW: 'Pending review',
  APPROVED:       'Approved',
  SCHEDULED:      'Scheduled',
  PUBLISHING:     'Publishing...',
  PUBLISHED:      'Published',
  FAILED:         'Failed',
  CANCELLED:      'Cancelled',
}

interface PostCardProps {
  post:       Post
  onEdit?:    (post: Post) => void
}

export function PostCard({ post, onEdit }: PostCardProps) {
  const [confirmDelete,  setConfirmDelete ] = useState(false)
  const [rejectModal,    setRejectModal   ] = useState(false)
  const [rejectComment,  setRejectComment ] = useState('')

  const [editModal, setEditModal] = useState(false)
  const toast      = useToast()
  const approve    = useApprovePost()
  const reject     = useRejectPost()
  const deletePost = useDeletePost()

  const isPending   = post.status === 'PENDING_REVIEW'
  const isDraft     = post.status === 'DRAFT'
  const isFailed    = post.status === 'FAILED'
  const isScheduled = post.status === 'SCHEDULED'
  const canEdit     = isDraft || isFailed || isScheduled
  const canDelete   = isDraft || isFailed || post.status === 'CANCELLED'

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(post.id)
      toast.show('Post approved ✓', 'success')
    } catch {
      toast.show('Failed to approve post', 'error')
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) return
    try {
      await reject.mutateAsync({ id: post.id, comment: rejectComment })
      toast.show('Post rejected', 'warning')
      setRejectModal(false)
      setRejectComment('')
    } catch {
      toast.show('Failed to reject post', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id)
      toast.show('Post deleted', 'success')
      setConfirmDelete(false)
    } catch {
      toast.show('Failed to delete post', 'error')
    }
  }

  return (
    <>
      <div className={cn(
        styles.card,
        isFailed  && styles.cardFailed,
        isPending && styles.cardPending,
        post.status === 'PUBLISHED' && styles.cardPublished,
      )}>

        {/* Top row */}
        <div className={styles.top}>
          <div className={styles.topLeft}>
            <span className={styles.client}>{post.clientName}</span>
            <span className={styles.dot}>·</span>
            <PlatformIcons
              platforms={post.platforms as any}
              size={14}
            />
          </div>
          <div className={styles.topRight}>
            <Badge variant={STATUS_BADGE[post.status] ?? 'neutral'}>
              {STATUS_LABEL[post.status] ?? post.status}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <p className={styles.content}>{post.content}</p>

        {/* Failed error */}
        {isFailed && post.targets.some((t) => t.errorMsg) && (
          <div className={styles.errorBar}>
            ⚠ {post.targets.find((t) => t.errorMsg)?.errorMsg}
          </div>
        )}

        {/* Labels */}
        {post.labels.length > 0 && (
          <div className={styles.labels}>
            {post.labels.map((l) => (
              <span key={l} className={styles.label}>{l}</span>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div className={styles.bottom}>
          <div className={styles.bottomMeta}>
            {post.scheduledAt && (
              <span className={styles.schedule}>
                🕐 {formatDate(post.scheduledAt, 'th-TH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            )}
            <span className={styles.author}>by {post.createdBy}</span>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Approval actions */}
            {isPending && (
              <>
                <button
                  className={cn(styles.actionBtn, styles.approveBtn)}
                  onClick={handleApprove}
                  disabled={approve.isPending}
                >
                  {approve.isPending ? '...' : '✓ Approve'}
                </button>
                <button
                  className={cn(styles.actionBtn, styles.rejectBtn)}
                  onClick={() => setRejectModal(true)}
                >
                  ✕ Reject
                </button>
              </>
            )}

            {/* Edit */}
            {canEdit && (
  <button
    className={cn(styles.actionBtn, styles.editBtn)}
    onClick={() => setEditModal(true)}
  >
    Edit
  </button>
)}

            {/* Delete */}
            {canDelete && (
              <button
                className={cn(styles.actionBtn, styles.deleteBtn)}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete this post?</h3>
            <p className={styles.modalSub}>
              This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={cn(styles.actionBtn, styles.editBtn)}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className={cn(styles.actionBtn, styles.rejectBtn)}
                onClick={handleDelete}
                disabled={deletePost.isPending}
              >
                {deletePost.isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className={styles.overlay} onClick={() => setRejectModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Reject post</h3>
            <p className={styles.modalSub}>
              Tell the team why this post needs changes.
            </p>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Image quality too low, please reshoot..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={cn(styles.actionBtn, styles.editBtn)}
                onClick={() => { setRejectModal(false); setRejectComment('') }}
              >
                Cancel
              </button>
              <button
                className={cn(styles.actionBtn, styles.rejectBtn)}
                onClick={handleReject}
                disabled={!rejectComment.trim() || reject.isPending}
              >
                {reject.isPending ? 'Rejecting...' : 'Reject post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}