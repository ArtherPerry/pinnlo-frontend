'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import type { Post } from '@/lib/types'
import { Badge, PlatformIcons } from '@/components/ui'
import {
  useApprovePost,
  useRejectPost,
  useDeletePost,
  useSubmitPost,
  useCancelPost,
} from '@/hooks/usePosts'
import { useToast } from '@/hooks/useToast'
import { cn, formatDate, apiErrorMessage } from '@/lib/utils'
import styles from './PostCard.module.css'
import { AlertTriangle, Clock, Check, MessageSquare, Send, XCircle } from 'lucide-react'
import { EditPostModal } from './EditPostModal'

const STATUS_BADGE: Record<string, Parameters<typeof Badge>[0]['variant']> = {
  DRAFT:             'draft',
  PENDING_REVIEW:    'warning',
  PENDING_CLIENT:    'info',
  CHANGES_REQUESTED: 'danger',
  APPROVED:          'info',
  SCHEDULED:         'scheduled',
  PUBLISHING:        'publishing',
  PUBLISHED:         'published',
  FAILED:            'failed',
  CANCELLED:         'cancelled',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:             'Draft',
  PENDING_REVIEW:    'Pending review',
  PENDING_CLIENT:    'With client',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED:          'Approved',
  SCHEDULED:         'Scheduled',
  PUBLISHING:        'Publishing...',
  PUBLISHED:         'Published',
  FAILED:            'Failed',
  CANCELLED:         'Cancelled',
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [rejectModal,   setRejectModal  ] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [editModal,     setEditModal    ] = useState(false)

  const toast      = useToast()
  const locale     = useLocale()
  const approve    = useApprovePost()
  const reject     = useRejectPost()
  const deletePost = useDeletePost()
  const submit     = useSubmitPost()
  const cancel     = useCancelPost()

  const isPending = post.status === 'PENDING_REVIEW'
  const isDraft   = post.status === 'DRAFT'
  const isFailed  = post.status === 'FAILED'
  const isChanges = post.status === 'CHANGES_REQUESTED'

  // These mirror PostTransitions on the backend. Keep them in step: offering an
  // action the server rejects just produces a 409 the user cannot act on.
  const canSubmit = isDraft || isChanges
  const canEdit   = isDraft || isChanges
  const canDelete = isDraft || isPending || isChanges || post.status === 'CANCELLED'
  const canCancel = ['PENDING_CLIENT', 'APPROVED', 'SCHEDULED', 'FAILED'].includes(post.status)

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync(post.id)
      toast.show('Sent for internal review', 'success')
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not submit this post'), 'error')
    }
  }

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(post.id)
      toast.show('Approved — now with the client', 'success')
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not approve this post'), 'error')
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) return
    try {
      await reject.mutateAsync({ id: post.id, comment: rejectComment })
      toast.show('Sent back to draft', 'warning')
      setRejectModal(false)
      setRejectComment('')
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not reject this post'), 'error')
    }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(post.id)
      toast.show('Post cancelled', 'warning')
      setConfirmCancel(false)
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not cancel this post'), 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id)
      toast.show('Post deleted', 'success')
      setConfirmDelete(false)
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not delete this post'), 'error')
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
            <PlatformIcons platforms={post.platforms} size={14} />
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
            <AlertTriangle size={14} /> {post.targets.find((t) => t.errorMsg)?.errorMsg}
          </div>
        )}

        {/* Client change request */}
        {isChanges && post.approval?.clientComment && (
          <div className={styles.clientFeedback}>
            <MessageSquare size={14} />
            <div>
              <span className={styles.clientFeedbackLabel}>Client requested changes:</span>{' '}
              {post.approval.clientComment}
            </div>
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
                <Clock size={14} /> {formatDate(post.scheduledAt, locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            )}
            <span className={styles.author}>by {post.createdBy}</span>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Submit for review — the transition that feeds the approval queue */}
            {canSubmit && (
              <button
                className={cn(styles.actionBtn, styles.approveBtn)}
                onClick={handleSubmit}
                disabled={submit.isPending}
              >
                {submit.isPending ? '...' : <><Send size={14} /> Submit for review</>}
              </button>
            )}

            {/* Internal approval actions */}
            {isPending && (
              <>
                <button
                  className={cn(styles.actionBtn, styles.approveBtn)}
                  onClick={handleApprove}
                  disabled={approve.isPending}
                >
                  {approve.isPending ? '...' : <><Check size={14} /> Approve</>}
                </button>
                <button
                  className={cn(styles.actionBtn, styles.rejectBtn)}
                  onClick={() => setRejectModal(true)}
                >
                  Reject
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

            {/* Cancel — the way out for anything past DRAFT */}
            {canCancel && (
              <button
                className={cn(styles.actionBtn, styles.rejectBtn)}
                onClick={() => setConfirmCancel(true)}
              >
                <XCircle size={14} /> Cancel
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
                Keep it
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

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className={styles.overlay} onClick={() => setConfirmCancel(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Cancel this post?</h3>
            <p className={styles.modalSub}>
              It will not be published. The post stays in the list for reference
              and can be deleted afterwards.
            </p>
            <div className={styles.modalActions}>
              <button
                className={cn(styles.actionBtn, styles.editBtn)}
                onClick={() => setConfirmCancel(false)}
              >
                Keep it
              </button>
              <button
                className={cn(styles.actionBtn, styles.rejectBtn)}
                onClick={handleCancel}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? 'Cancelling...' : 'Yes, cancel'}
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
              Tell the team why this post needs changes. It goes back to draft.
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

      {editModal && (
        <EditPostModal post={post} onClose={() => setEditModal(false)} />
      )}
    </>
  )
}