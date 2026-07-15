'use client'

import { useState } from 'react'
import {
  useBroadcasts,
  useCreateBroadcast,
  useDeleteBroadcast,
  useSendBroadcast,
} from '@/hooks/useBroadcasts'
import { useTemplates } from '@/hooks/useTemplates'
import { useClients } from '@/hooks/useClients'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useLocale } from 'next-intl'
import { formatDate } from '@/lib/utils'
import type {
  BroadcastCampaign,
  BroadcastStatus,
  BroadcastPlatform,
} from '@/lib/types'
import styles from './broadcasts.module.css'

const STATUS_COLORS: Record<BroadcastStatus, { bg: string; text: string }> = {
  DRAFT:     { bg: 'var(--color-bg-2)',          text: 'var(--color-muted)'   },
  SCHEDULED: { bg: 'var(--color-info-light)',    text: 'var(--color-info)'    },
  SENDING:   { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
  SENT:      { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
  FAILED:    { bg: 'var(--color-danger-light)',  text: 'var(--color-danger)'  },
}

const PLATFORMS: BroadcastPlatform[] = ['FACEBOOK', 'WHATSAPP', 'LINE']

const KNOWN_TAGS = ['vip', 'interested', 'corporate', 'follow-up', 'new']

// ── Create broadcast modal ─────────────────────────────────────────
function CreateBroadcastModal({ onClose }: { onClose: () => void }) {
  const [name,        setName       ] = useState('')
  const [platform,    setPlatform   ] = useState<BroadcastPlatform>('FACEBOOK')
  const [clientId,    setClientId   ] = useState('')
  const [message,     setMessage    ] = useState('')
  const [templateId,  setTemplateId ] = useState('')
  const [selectedTags,setSelectedTags] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving,      setSaving     ] = useState(false)

  const { data: clients   } = useClients()
  const { data: templates } = useTemplates()
  const createBroadcast     = useCreateBroadcast()
  const toast               = useToast()

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id)
    const tpl = templates?.find((t) => t.id === id)
    if (tpl) setMessage(tpl.content)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSave = async (sendNow = false) => {
    if (!name.trim())     { toast.show('Enter a campaign name', 'warning'); return }
    if (!clientId)        { toast.show('Select a client', 'warning');       return }
    if (!message.trim())  { toast.show('Write a message', 'warning');       return }
    if (selectedTags.length === 0) {
      toast.show('Select at least one recipient tag', 'warning')
      return
    }

    setSaving(true)
    try {
      await createBroadcast.mutateAsync({
        name,
        platform,
        clientId,
        message,
        templateId: templateId || undefined,
        tags:       selectedTags,
        scheduledAt: scheduledAt || undefined,
      })
      toast.show(
        sendNow ? 'Campaign created and queued' : 'Campaign saved',
        'success'
      )
      onClose()
    } catch {
      toast.show('Failed to create campaign', 'error')
    } finally {
      setSaving(false)
    }
  }

  const charCount = message.length

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            New broadcast campaign
          </span>
          <button onClick={onClose} className={styles.modalClose}>×</button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <Input
            label="Campaign name"
            placeholder="Weekend promotion — Somjai Coffee"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Platform */}
          <div>
            <span className={styles.fieldLabel}>Platform</span>
            <div className={styles.platformRow}>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={styles.platformOption}
                  style={{
                    border: `1px solid ${platform === p
                      ? 'var(--color-teal-500)'
                      : 'var(--color-border)'
                    }`,
                    background: platform === p
                      ? 'var(--color-teal-50)'
                      : 'var(--color-white)',
                    color: platform === p
                      ? 'var(--color-teal-600)'
                      : 'var(--color-muted)',
                  }}
                >
                  <PlatformIcon platform={p} size={14} />
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div>
            <span className={styles.fieldLabel}>Client workspace</span>
            <div className={styles.clientList}>
              {clients?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClientId(c.id)}
                  className={styles.clientOption}
                  style={{
                    border: `1px solid ${clientId === c.id
                      ? 'var(--color-teal-500)'
                      : 'var(--color-border)'
                    }`,
                    background: clientId === c.id
                      ? 'var(--color-teal-50)'
                      : 'var(--color-white)',
                    color: clientId === c.id
                      ? 'var(--color-teal-600)'
                      : 'var(--color-ink)',
                  }}
                >
                  <span className={styles.clientDot} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Template picker */}
          {templates && templates.length > 0 && (
            <div>
              <span className={styles.fieldLabel}>
                Start from template (optional)
              </span>
              <select
                value={templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className={styles.templateSelect}
              >
                <option value="">— Write from scratch —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <div className={styles.messageLabelRow}>
              <span className={styles.messageLabelText}>
                Message
              </span>
              <span
                className={styles.messageCharCount}
                style={{
                  color: charCount > 1000
                    ? 'var(--color-danger)'
                    : 'var(--color-muted)',
                }}
              >
                {charCount} chars
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your broadcast message... Use {{name}} to personalise."
              rows={5}
              className={styles.messageTextarea}
            />
            <p className={styles.messageHelp}>
              Use <code className={styles.inlineCode}>
                {'{{name}}'}
              </code> to personalise each message with the contact&apos;s name.
            </p>
          </div>

          {/* Recipient tags */}
          <div>
            <span className={styles.fieldLabel}>
              Send to contacts tagged with
            </span>
            <div className={styles.tagsWrap}>
              {KNOWN_TAGS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={styles.tagOption}
                    style={{
                      border: `1px solid ${active
                        ? 'var(--color-teal-500)'
                        : 'var(--color-border)'
                      }`,
                      background: active
                        ? 'var(--color-teal-50)'
                        : 'var(--color-white)',
                      color: active
                        ? 'var(--color-teal-600)'
                        : 'var(--color-muted)',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            {selectedTags.length > 0 && (
              <p className={styles.tagsHint}>
                Will send to all contacts tagged: {selectedTags.join(', ')}
              </p>
            )}
          </div>

          {/* Schedule */}
          <Input
            label="Schedule for (optional — leave blank to save as draft)"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            hint="Leave empty to send manually later"
          />
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="secondary"
            onClick={() => handleSave(false)}
            loading={saving}
          >
            Save as draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            loading={saving}
          >
            {scheduledAt ? 'Schedule send' : 'Send now'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Campaign card ──────────────────────────────────────────────────
function BroadcastCard({ broadcast }: { broadcast: BroadcastCampaign }) {
  const deleteBroadcast = useDeleteBroadcast()
  const sendBroadcast   = useSendBroadcast()
  const toast           = useToast()
  const locale          = useLocale()

  const handleDelete = async () => {
    if (!confirm(`Delete "${broadcast.name}"?`)) return
    try {
      await deleteBroadcast.mutateAsync(broadcast.id)
      toast.show('Campaign deleted', 'success')
    } catch {
      toast.show('Failed to delete campaign', 'error')
    }
  }

  const handleSend = async () => {
    if (!confirm(`Send "${broadcast.name}" to ${broadcast.recipientCount} contacts now?`)) return
    try {
      await sendBroadcast.mutateAsync(broadcast.id)
      toast.show('Campaign queued for sending', 'success')
    } catch {
      toast.show('Failed to send campaign', 'error')
    }
  }

  const statusColor = STATUS_COLORS[broadcast.status]

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderMain}>
          <div className={styles.cardName}>
            {broadcast.name}
          </div>
          <div className={styles.cardMetaRow}>
            <PlatformIcon platform={broadcast.platform} size={13} />
            <span className={styles.cardClientName}>
              {broadcast.clientName}
            </span>
            <span
              className={styles.statusBadge}
              style={{ background: statusColor.bg, color: statusColor.text }}
            >
              {broadcast.status}
            </span>
          </div>
        </div>

        <div className={styles.cardActions}>
          {broadcast.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              loading={sendBroadcast.isPending}
            >
              Send now
            </Button>
          )}
          {(broadcast.status === 'DRAFT' || broadcast.status === 'SCHEDULED') && (
            <button
              onClick={handleDelete}
              className={styles.deleteBtn}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>

        {/* Message preview */}
        <div className={styles.messagePreview}>
          {broadcast.message}
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.metricBox}>
            <div className={styles.metricValue}>
              {broadcast.recipientCount}
            </div>
            <div className={styles.metricLabel}>
              Recipients
            </div>
          </div>

          {broadcast.status === 'SENT' && (
            <>
              <div className={styles.metricBox}>
                <div className={styles.metricValueSuccess}>
                  {broadcast.sentCount}
                </div>
                <div className={styles.metricLabel}>
                  Delivered
                </div>
              </div>

              {broadcast.failedCount > 0 && (
                <div className={styles.metricBox}>
                  <div className={styles.metricValueDanger}>
                    {broadcast.failedCount}
                  </div>
                  <div className={styles.metricLabel}>
                    Failed
                  </div>
                </div>
              )}

              {broadcast.openRate !== null && (
                <div className={styles.metricBox}>
                  <div className={styles.metricValueTeal}>
                    {broadcast.openRate.toFixed(1)}%
                  </div>
                  <div className={styles.metricLabel}>
                    Open rate
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer meta */}
        <div className={styles.cardFooter}>
          <div className={styles.cardTags}>
            {broadcast.tags.map((tag) => (
              <span key={tag} className={styles.cardTag}>
                {tag}
              </span>
            ))}
          </div>
          <span>
            {broadcast.sentAt
              ? `Sent ${formatDate(broadcast.sentAt, locale, { dateStyle: 'medium' })}`
              : broadcast.scheduledAt
                ? `Scheduled ${formatDate(broadcast.scheduledAt, locale, { dateStyle: 'medium', timeStyle: 'short' })}`
                : `Created ${formatDate(broadcast.createdAt, locale, { dateStyle: 'medium' })}`
            }
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function BroadcastsPage() {
  const [showCreate,    setShowCreate   ] = useState(false)
  const [statusFilter,  setStatusFilter ] = useState('')

  const { data: broadcasts, isLoading } = useBroadcasts({
    status: statusFilter || undefined,
  })

  const totalSent      = broadcasts?.filter((b) => b.status === 'SENT').length      ?? 0
  const totalScheduled = broadcasts?.filter((b) => b.status === 'SCHEDULED').length ?? 0
  const totalDraft     = broadcasts?.filter((b) => b.status === 'DRAFT').length     ?? 0
  const totalReach     = broadcasts?.reduce((s, b) => s + b.sentCount, 0)           ?? 0

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            Broadcast campaigns
          </h2>
          <p className={styles.pageSub}>
            Send personalised DM campaigns to contact segments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New campaign
        </Button>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        {[
          { value: totalSent,      label: 'Campaigns sent',     color: 'var(--color-success)' },
          { value: totalScheduled, label: 'Scheduled',          color: 'var(--color-info)'    },
          { value: totalDraft,     label: 'Drafts',             color: 'var(--color-muted)'   },
          { value: totalReach,     label: 'Total messages sent', color: 'var(--color-ink)'    },
        ].map(({ value, label, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statCardValue} style={{ color }}>
              {value.toLocaleString()}
            </div>
            <div className={styles.statCardLabel}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className={styles.filterRow}>
        {[
          { value: '',          label: 'All'       },
          { value: 'DRAFT',     label: 'Draft'     },
          { value: 'SCHEDULED', label: 'Scheduled' },
          { value: 'SENDING',   label: 'Sending'   },
          { value: 'SENT',      label: 'Sent'      },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={styles.filterTab}
            style={{
              border: `1px solid ${statusFilter === tab.value
                ? 'var(--color-teal-500)'
                : 'var(--color-border)'
              }`,
              background: statusFilter === tab.value
                ? 'var(--color-teal-50)'
                : 'var(--color-white)',
              color: statusFilter === tab.value
                ? 'var(--color-teal-600)'
                : 'var(--color-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={styles.loadingWrap}>
          {[1, 2].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && broadcasts?.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
               stroke="var(--color-border)" strokeWidth="1.5">
            <path d="M6 24h36M6 16l36 8-36 8"/>
            <circle cx="38" cy="24" r="4"/>
          </svg>
          <div className={styles.emptyTitle}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} campaigns` : 'No campaigns yet'}
          </div>
          <div className={styles.emptySub}>
            Create a broadcast campaign to send personalised DMs to
            your contact segments.
          </div>
          {!statusFilter && (
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + Create first campaign
            </Button>
          )}
        </div>
      )}

      {/* Campaign list */}
      {!isLoading && broadcasts && broadcasts.length > 0 && (
        <div className={styles.campaignList}>
          {broadcasts.map((bc) => (
            <BroadcastCard key={bc.id} broadcast={bc} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateBroadcastModal onClose={() => setShowCreate(false)} />
      )}

    </div>
  )
}
