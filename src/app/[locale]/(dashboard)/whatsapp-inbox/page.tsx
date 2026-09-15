'use client'

import { useState } from 'react'
import {
  useWhatsappConversations,
  useReplyWhatsapp,
  useSetWhatsappConversationStatus,
} from '@/hooks/useWhatsapp'
import { useToast } from '@/hooks/useToast'
import { useLocale } from 'next-intl'
import { cn, formatDate } from '@/lib/utils'
import type { WhatsappConversation, WhatsappMessage } from '@/lib/types'
import styles from './whatsapp-inbox.module.css'

export default function WhatsappInboxPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: conversations, isLoading } =
    useWhatsappConversations(undefined, statusFilter || undefined)

  const active = conversations?.find((c) => c.id === activeId) ?? null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>WhatsApp inbox</h2>
        <div className={styles.filters}>
          {[
            { value: '',       label: 'All'    },
            { value: 'OPEN',   label: 'Open'   },
            { value: 'CLOSED', label: 'Closed' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={cn(styles.filterTab, statusFilter === t.value && styles.filterTabActive)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {/* List */}
        <div className={styles.list}>
          {isLoading && <div className={styles.muted}>Loading…</div>}

          {!isLoading && conversations?.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>No conversations</div>
              <div className={styles.emptySub}>
                Messages people send to a connected WhatsApp number appear here.
              </div>
            </div>
          )}

          {conversations?.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              onClick={() => setActiveId(c.id)}
            />
          ))}
        </div>

        {/* Thread */}
        <div className={styles.thread}>
          {active ? (
            <Thread conversation={active} />
          ) : (
            <div className={styles.noSelection}>Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── List row ───────────────────────────────────────────────────────
function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: WhatsappConversation
  active:       boolean
  onClick:      () => void
}) {
  const last = conversation.messages[conversation.messages.length - 1]
  const name = conversation.profileName ?? conversation.waId

  return (
    <button
      onClick={onClick}
      className={cn(styles.row, active && styles.rowActive)}
    >
      <div className={styles.avatar}>{initials(name)}</div>
      <div className={styles.rowMain}>
        <div className={styles.rowTop}>
          <span className={styles.rowName}>{name}</span>
          {conversation.status === 'CLOSED' && (
            <span className={styles.closedTag}>Closed</span>
          )}
        </div>
        <div className={styles.rowPreview}>
          {last ? previewOf(last) : 'No messages'}
        </div>
      </div>
    </button>
  )
}

// ── Thread ─────────────────────────────────────────────────────────
function Thread({ conversation }: { conversation: WhatsappConversation }) {
  const [text, setText] = useState('')
  const reply     = useReplyWhatsapp()
  const setStatus = useSetWhatsappConversationStatus()
  const toast     = useToast()
  const locale    = useLocale()

  const name = conversation.profileName ?? conversation.waId

  const handleSend = async () => {
    if (!text.trim()) return
    try {
      await reply.mutateAsync({ id: conversation.id, text: text.trim() })
      setText('')
    } catch (e) {
      // The service refuses a reply once the window has closed; surface that
      // message rather than a generic failure.
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.show(msg ?? 'Could not send the reply', 'error')
    }
  }

  const handleToggleStatus = async () => {
    const next = conversation.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    try {
      await setStatus.mutateAsync({ id: conversation.id, status: next })
    } catch {
      toast.show('Could not update the conversation', 'error')
    }
  }

  return (
    <div className={styles.threadInner}>
      {/* Thread header */}
      <div className={styles.threadHead}>
        <div>
          <div className={styles.threadName}>{name}</div>
          <div className={styles.threadMeta}>
            {conversation.waId}
            {conversation.contactId && <span className={styles.linked}> · in contacts</span>}
          </div>
        </div>
        <button className={styles.statusBtn} onClick={handleToggleStatus}>
          {conversation.status === 'OPEN' ? 'Close' : 'Reopen'}
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} locale={locale} />
        ))}
      </div>

      {/* Reply — enabled only inside the 24-hour window */}
      {conversation.windowOpen ? (
        <div className={styles.replyBar}>
          <textarea
            className={styles.replyInput}
            placeholder="Type a reply…"
            value={text}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!text.trim() || reply.isPending}
          >
            {reply.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      ) : (
        <div className={styles.windowClosed}>
          The 24-hour reply window has closed. To message this person again, send
          an approved template — free-form replies are only allowed within 24
          hours of their last message.
        </div>
      )}
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────
function MessageBubble({ message, locale }: { message: WhatsappMessage; locale: string }) {
  const outbound = message.direction === 'OUTBOUND'
  return (
    <div className={cn(styles.bubbleRow, outbound && styles.bubbleRowOut)}>
      <div className={cn(styles.bubble, outbound ? styles.bubbleOut : styles.bubbleIn)}>
        <div className={styles.bubbleText}>
          {message.messageType === 'text'
            ? message.content
            : (message.content ?? `[${message.messageType}]`)}
        </div>
        <div className={styles.bubbleMeta}>
          {formatDate(message.sentAt, locale, { timeStyle: 'short' })}
          {outbound && message.deliveryStatus && (
            <span className={styles.deliveryStatus}> · {message.deliveryStatus}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function previewOf(m: WhatsappMessage): string {
  if (m.messageType === 'text') return m.content ?? ''
  return `[${m.messageType}]`
}