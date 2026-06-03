'use client'

import { useState } from 'react'
import {
  useInboxThreads,
  useReplyToThread,
  useUpdateThread,
  useHideComment,
} from '@/hooks/useInbox'
import { Button, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { cn, formatDate } from '@/lib/utils'
import type { InboxThread, InboxMessage } from '@/lib/types'
import styles from './inbox.module.css'
import { ReplySuggestions } from '@/components/features/ReplySuggestions'

// ── Helpers ────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}m`
  if (hours < 24)  return `${hours}h`
  return `${days}d`
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Thread list item ───────────────────────────────────────────────
function ThreadItem({
  thread,
  isActive,
  onClick,
}: {
  thread:   InboxThread
  isActive: boolean
  onClick:  () => void
}) {
  const hasUnread = thread.unreadCount > 0

  return (
    <div
      className={cn(
        styles.threadItem,
        isActive   && styles.threadItemActive,
        hasUnread  && !isActive && styles.threadItemUnread
      )}
      onClick={onClick}
    >
      <div className={styles.threadAvatar}>
        {initials(thread.author)}
      </div>

      <div className={styles.threadContent}>
        <div className={styles.threadTop}>
          <span className={styles.threadAuthor}>{thread.author}</span>
          <span className={styles.threadTime}>
            {timeAgo(thread.lastMessageAt)}
          </span>
        </div>

        <div className={styles.threadMeta}>
          <PlatformIcon platform={thread.platform} size={11} />
          <span className={cn(
            styles.typeChip,
            thread.type === 'COMMENT' ? styles.typeComment : styles.typeDM
          )}>
            {thread.type === 'COMMENT' ? 'Comment' : 'DM'}
          </span>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
            {thread.clientName}
          </span>
        </div>

        <div className={cn(
          styles.threadPreview,
          hasUnread && styles.threadPreviewUnread
        )}>
          {thread.preview}
        </div>
      </div>

      {hasUnread && (
        <div className={styles.unreadDot} />
      )}
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────
function MessageBubble({ message }: { message: InboxMessage }) {
  const isOut = message.type === 'OUTBOUND'

  return (
    <div className={cn(
      styles.messageBubble,
      isOut && styles.messageBubbleOutbound
    )}>
      <div className={cn(
        styles.bubbleAvatar,
        isOut && styles.bubbleAvatarOutbound
      )}>
        {initials(message.author)}
      </div>

      <div className={styles.bubbleContent}>
        <div className={cn(
          styles.bubbleText,
          isOut ? styles.bubbleTextOutbound : styles.bubbleTextInbound
        )}>
          {message.content}
        </div>
        <div className={cn(
          styles.bubbleMeta,
          isOut && styles.bubbleMetaOutbound
        )}>
          {message.author} ·{' '}
          {formatDate(message.sentAt, 'th-TH', {
            dateStyle: 'medium',
            timeStyle: 'short',
          } as any)}
        </div>
      </div>
    </div>
  )
}

// ── Thread detail ──────────────────────────────────────────────────
function ThreadDetail({
  thread,
  onClose,
}: {
  thread:  InboxThread
  onClose: () => void
}) {
  const [replyText, setReplyText] = useState('')

  const [showAI, setShowAI] = useState(false)
  const reply      = useReplyToThread(thread.id)
  const update     = useUpdateThread(thread.id)
  const hideComment = useHideComment(thread.id)
  const toast      = useToast()

  const handleReply = async () => {
    if (!replyText.trim()) return
    try {
      await reply.mutateAsync(replyText.trim())
      setReplyText('')
      toast.show('Reply sent ✓', 'success')
    } catch {
      toast.show('Failed to send reply', 'error')
    }
  }

  const handleClose = async () => {
    try {
      await update.mutateAsync({ status: 'CLOSED' })
      toast.show('Thread closed', 'success')
    } catch {
      toast.show('Failed to close thread', 'error')
    }
  }

  const handleSpam = async () => {
    if (!confirm('Mark this thread as spam?')) return
    try {
      await update.mutateAsync({ status: 'SPAM' })
      toast.show('Marked as spam', 'warning')
    } catch {
      toast.show('Failed to mark as spam', 'error')
    }
  }

  const handleHide = async () => {
    if (!confirm('Hide this comment from the post?')) return
    try {
      await hideComment.mutateAsync()
      toast.show('Comment hidden ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to hide comment', 'error')
    }
  }

  return (
    <div className={styles.threadDetail}>

      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <div className={styles.detailAuthor}>
            {thread.author}
            <span className={cn(
              styles.statusChip,
              thread.status === 'OPEN'   ? styles.statusOpen   :
              thread.status === 'CLOSED' ? styles.statusClosed :
              styles.statusSpam
            )}>
              {thread.status}
            </span>
          </div>
          <div className={styles.detailMeta}>
            <PlatformIcon platform={thread.platform} size={12} />
            <span>{thread.platform}</span>
            <span>·</span>
            <span>{thread.clientName}</span>
            {thread.assignedTo && (
              <>
                <span>·</span>
                <span>Assigned to {thread.assignedTo}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.detailActions}>
          {thread.type === 'COMMENT' && (
            <button
              className={cn(styles.detailActionBtn, styles.detailActionBtnDanger)}
              onClick={handleHide}
              disabled={hideComment.isPending}
            >
              Hide comment
            </button>
          )}
          <button
            className={styles.detailActionBtn}
            onClick={handleSpam}
            disabled={update.isPending}
          >
            Spam
          </button>
          {thread.status !== 'CLOSED' && (
            <button
              className={styles.detailActionBtn}
              onClick={handleClose}
              disabled={update.isPending}
            >
              Close thread
            </button>
          )}
        </div>
      </div>

      {/* Post context */}
      {thread.postContent && (
        <div className={styles.postContext}>
          <span className={styles.postContextLabel}>Post:</span>
          <span className={styles.postContextText}>{thread.postContent}</span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages}>
        {thread.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Reply box */}
{thread.status !== 'CLOSED' && thread.status !== 'SPAM' && (
  <div className={styles.replyBox}>

    {/* AI suggestions row */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-1)',
    }}>
      <span style={{
        fontSize: 'var(--text-small)',
        color: 'var(--color-muted)',
        fontWeight: 500,
      }}>
        Reply
      </span>
      {!showAI && (
        <ReplySuggestions
          message={
            thread.messages
              .filter((m) => m.type === 'INBOUND')
              .at(-1)?.content ?? ''
          }
          platform={thread.platform}
          threadId={thread.id}
          onUse={(suggestion) => {
            setReplyText(suggestion)
            setShowAI(false)
          }}
        />
      )}
    </div>

    <textarea
      className={styles.replyTextarea}
      placeholder={`Reply to ${thread.author}...`}
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          handleReply()
        }
      }}
    />

    <div className={styles.replyActions}>
      <span className={styles.replyHint}>⌘ Enter to send</span>
      <Button
        variant="primary"
        size="sm"
        onClick={handleReply}
        loading={reply.isPending}
        disabled={!replyText.trim()}
      >
        Send reply
      </Button>
    </div>
  </div>
)}

      {thread.status === 'CLOSED' && (
        <div style={{
          padding: 'var(--space-4) var(--space-5)',
          borderTop: '0.5px solid var(--color-border)',
          textAlign: 'center',
          fontSize: 'var(--text-small)',
          color: 'var(--color-muted)',
        }}>
          This thread is closed.{' '}
          <button
            style={{
              color: 'var(--color-teal-600)',
              fontWeight: 500,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-small)',
            }}
            onClick={() => update.mutateAsync({ status: 'OPEN' })}
          >
            Reopen
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
type TypeFilter = '' | 'COMMENT' | 'DM'

export default function InboxPage() {
  const [typeFilter,     setTypeFilter    ] = useState<TypeFilter>('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter,   setStatusFilter  ] = useState('OPEN')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  const { data: threads, isLoading } = useInboxThreads({
    type:     typeFilter     || undefined,
    platform: platformFilter || undefined,
    status:   statusFilter   || undefined,
  })

  const activeThread   = threads?.find((t) => t.id === activeThreadId)
  const totalUnread    = threads?.reduce((s, t) => s + t.unreadCount, 0) ?? 0
  const commentUnread  = threads?.filter((t) => t.type === 'COMMENT').reduce((s, t) => s + t.unreadCount, 0) ?? 0
  const dmUnread       = threads?.filter((t) => t.type === 'DM').reduce((s, t) => s + t.unreadCount, 0) ?? 0

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>Inbox</h2>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginTop: '2px' }}>
            Comments and DMs across all clients and platforms.
          </p>
        </div>

        <div className={styles.filters}>
          {/* Type tabs */}
          <div className={styles.tabs}>
            {([
              { value: '',        label: 'All',      unread: totalUnread   },
              { value: 'COMMENT', label: 'Comments', unread: commentUnread },
              { value: 'DM',      label: 'DMs',      unread: dmUnread      },
            ] as { value: TypeFilter; label: string; unread: number }[]).map((tab) => (
              <button
                key={tab.value}
                className={cn(styles.tab, typeFilter === tab.value && styles.tabActive)}
                onClick={() => setTypeFilter(tab.value)}
              >
                {tab.label}
                {tab.unread > 0 && (
                  <span className={styles.unreadBadge}>{tab.unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <select
            className={styles.filterSelect}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">All platforms</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="LINE">LINE</option>
          </select>

          {/* Status filter */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="OPEN">Open</option>
            <option value="">All statuses</option>
            <option value="CLOSED">Closed</option>
            <option value="SPAM">Spam</option>
          </select>
        </div>
      </div>

      {/* Main layout */}
      <div className={cn(styles.layout, activeThread && 'hasActive')}>

        {/* Thread list */}
        <div className={styles.threadList}>
          {isLoading && (
            [1,2,3,4].map((n) => <div key={n} className={styles.skeletonThread} />)
          )}

          {!isLoading && threads?.length === 0 && (
            <div className={styles.empty}>
              <svg className={styles.emptyIcon} viewBox="0 0 48 48"
                   fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8h40v28H28l-8 8V36H4V8z"/>
              </svg>
              <div className={styles.emptyTitle}>All caught up!</div>
              <div className={styles.emptySub}>
                No {statusFilter === 'OPEN' ? 'open' : ''} threads match your filters.
              </div>
            </div>
          )}

          {!isLoading && threads?.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={activeThreadId === thread.id}
              onClick={() => setActiveThreadId(
                activeThreadId === thread.id ? null : thread.id
              )}
            />
          ))}
        </div>

        {/* Thread detail */}
        {activeThread ? (
          <ThreadDetail
            thread={activeThread}
            onClose={() => setActiveThreadId(null)}
          />
        ) : (
          <div className={cn(styles.threadDetail, styles.empty)}>
            <svg className={styles.emptyIcon} viewBox="0 0 48 48"
                 fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 8h40v28H28l-8 8V36H4V8z"/>
            </svg>
            <div className={styles.emptyTitle}>Select a conversation</div>
            <div className={styles.emptySub}>
              Click a thread on the left to view and reply to messages.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}