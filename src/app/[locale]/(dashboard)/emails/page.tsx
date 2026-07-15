'use client'

import { useState } from 'react'
import {
  useEmailCampaigns,
  useCreateEmailCampaign,
  useDeleteEmailCampaign,
  useSendEmailCampaign,
} from '@/hooks/useEmailCampaigns'
import { useClients } from '@/hooks/useClients'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useLocale } from 'next-intl'
import { formatDate } from '@/lib/utils'
import type {
  EmailCampaign,
  EmailCampaignStatus,
} from '@/lib/types'
import styles from './emails.module.css'

const STATUS_COLORS: Record<EmailCampaignStatus, { bg: string; text: string }> = {
  DRAFT:     { bg: 'var(--color-bg-2)',          text: 'var(--color-muted)'   },
  SCHEDULED: { bg: 'var(--color-info-light)',    text: 'var(--color-info)'    },
  SENDING:   { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
  SENT:      { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
  FAILED:    { bg: 'var(--color-danger-light)',  text: 'var(--color-danger)'  },
}

const KNOWN_TAGS = ['vip', 'interested', 'corporate', 'follow-up', 'new']

// ── Stat card ──────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  color = 'var(--color-ink)',
  suffix = '',
}: {
  value:   number | string
  label:   string
  color?:  string
  suffix?: string
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardValue} style={{ color }}>
        {value}{suffix}
      </div>
      <div className={styles.statCardLabel}>
        {label}
      </div>
    </div>
  )
}

// ── Metric bar ─────────────────────────────────────────────────────
function MetricBar({ value, label, color }: {
  value: number; label: string; color: string
}) {
  return (
    <div>
      <div className={styles.metricBarRow}>
        <span className={styles.metricBarLabel}>{label}</span>
        <span className={styles.metricBarValue} style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className={styles.metricBarTrack}>
        <div
          className={styles.metricBarFill}
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ── Create modal ───────────────────────────────────────────────────
function CreateEmailModal({ onClose }: { onClose: () => void }) {
  const [name,        setName       ] = useState('')
  const [subject,     setSubject    ] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [body,        setBody       ] = useState('')
  const [clientId,    setClientId   ] = useState('')
  const [fromName,    setFromName   ] = useState('')
  const [fromEmail,   setFromEmail  ] = useState('')
  const [selectedTags,setSelectedTags] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving,      setSaving     ] = useState(false)

  const { data: clients } = useClients()
  const createCampaign    = useCreateEmailCampaign()
  const toast             = useToast()

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSave = async (sendNow = false) => {
    if (!name.trim())      { toast.show('Enter a campaign name', 'warning');    return }
    if (!subject.trim())   { toast.show('Enter a subject line', 'warning');     return }
    if (!clientId)         { toast.show('Select a client', 'warning');          return }
    if (!fromEmail.trim()) { toast.show('Enter a from email address', 'warning'); return }
    if (!body.trim())      { toast.show('Write the email body', 'warning');     return }
    if (selectedTags.length === 0) {
      toast.show('Select at least one recipient tag', 'warning')
      return
    }

    setSaving(true)
    try {
      await createCampaign.mutateAsync({
        name,
        subject,
        previewText,
        body,
        clientId,
        fromName:    fromName || name,
        fromEmail,
        tags:        selectedTags,
        scheduledAt: scheduledAt || undefined,
      })
      toast.show(
        sendNow ? 'Campaign queued for sending' : 'Campaign saved',
        'success'
      )
      onClose()
    } catch {
      toast.show('Failed to create campaign', 'error')
    } finally {
      setSaving(false)
    }
  }

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
            New email campaign
          </span>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          <Input
            label="Campaign name"
            placeholder="November newsletter — Somjai Coffee"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Client */}
          <div>
            <span className={styles.fieldLabel}>
              Client workspace
            </span>
            <div className={styles.clientList}>
              {clients?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setClientId(c.id)
                    if (!fromName) setFromName(c.name)
                  }}
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

          {/* From */}
          <div className={styles.fieldGrid}>
            <Input
              label="From name"
              placeholder="Somjai Coffee"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
            <Input
              label="From email"
              type="email"
              placeholder="hello@somjaicoffee.th"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>

          {/* Subject */}
          <Input
            label="Subject line"
            placeholder="☕ ข่าวสารประจำเดือนจาก Somjai Coffee"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            hint={`${subject.length} chars — aim for under 60 for best deliverability`}
          />

          {/* Preview text */}
          <Input
            label="Preview text (optional)"
            placeholder="Short text that appears in the inbox preview"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            hint="Shown after the subject in most email clients"
          />

          {/* Body */}
          <div>
            <div className={styles.bodyLabelRow}>
              <span className={styles.bodyLabelText}>
                Email body
              </span>
              <span className={styles.bodyLabelHint}>
                HTML supported
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`<h2>สวัสดีค่ะ {{name}}</h2>\n<p>เดือนนี้เรามีโปรโมชั่นสุดพิเศษ...</p>\n\n<a href="{{cta_url}}">คลิกที่นี่</a>`}
              rows={8}
              className={styles.bodyTextarea}
            />
            <p className={styles.bodyHelp}>
              Use <code className={styles.inlineCode}>
                {'{{name}}'}
              </code> for contact name,{' '}
              <code className={styles.inlineCode}>
                {'{{unsubscribe_url}}'}
              </code> for unsubscribe link.
            </p>
          </div>

          {/* Tags */}
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
          </div>

          {/* Schedule */}
          <Input
            label="Schedule for (optional)"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            hint="Leave empty to save as draft and send manually later"
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
function EmailCampaignCard({ campaign }: { campaign: EmailCampaign }) {
  const deleteCampaign = useDeleteEmailCampaign()
  const sendCampaign   = useSendEmailCampaign()
  const toast          = useToast()
  const locale         = useLocale()

  const handleDelete = async () => {
    if (!confirm(`Delete "${campaign.name}"?`)) return
    try {
      await deleteCampaign.mutateAsync(campaign.id)
      toast.show('Campaign deleted', 'success')
    } catch {
      toast.show('Failed to delete', 'error')
    }
  }

  const handleSend = async () => {
    if (!confirm(`Send "${campaign.name}" to ${campaign.recipientCount} contacts now?`)) return
    try {
      await sendCampaign.mutateAsync(campaign.id)
      toast.show('Campaign queued for sending', 'success')
    } catch {
      toast.show('Failed to send campaign', 'error')
    }
  }

  const statusColor = STATUS_COLORS[campaign.status]

  return (
    <div className={styles.card}>

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderMain}>
          <div className={styles.cardName}>
            {campaign.name}
          </div>
          <div className={styles.cardMetaRow}>
            <span className={styles.cardFrom}>
              ✉ {campaign.fromName} &lt;{campaign.fromEmail}&gt;
            </span>
            <span
              className={styles.statusBadge}
              style={{ background: statusColor.bg, color: statusColor.text }}
            >
              {campaign.status}
            </span>
          </div>
        </div>

        <div className={styles.cardActions}>
          {campaign.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              loading={sendCampaign.isPending}
            >
              Send now
            </Button>
          )}
          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
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

        {/* Subject */}
        <div className={styles.cardSubject}>
          {campaign.subject}
        </div>
        {campaign.previewText && (
          <div className={styles.cardPreview}>
            {campaign.previewText}
          </div>
        )}

        {/* Metrics */}
        <div
          className={styles.metricsGrid}
          style={{
            gridTemplateColumns: campaign.status === 'SENT'
              ? 'repeat(4, 1fr)'
              : 'repeat(2, 1fr)',
            marginBottom: campaign.status === 'SENT' ? 'var(--space-4)' : 0,
          }}
        >
          <div className={styles.metricBox}>
            <div className={styles.metricValue}>
              {campaign.recipientCount}
            </div>
            <div className={styles.metricLabel}>
              Recipients
            </div>
          </div>
          <div className={styles.metricBox}>
            <div
              className={styles.metricValueSent}
              style={{
                color: campaign.sentCount > 0
                  ? 'var(--color-success)'
                  : 'var(--color-muted)',
              }}
            >
              {campaign.sentCount}
            </div>
            <div className={styles.metricLabel}>
              Delivered
            </div>
          </div>
          {campaign.status === 'SENT' && (
            <>
              <div className={styles.metricBox}>
                <div className={styles.metricValueInfo}>
                  {campaign.openCount}
                </div>
                <div className={styles.metricLabel}>
                  Opened
                </div>
              </div>
              <div className={styles.metricBox}>
                <div className={styles.metricValueTeal}>
                  {campaign.clickCount}
                </div>
                <div className={styles.metricLabel}>
                  Clicked
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rate bars for sent campaigns */}
        {campaign.status === 'SENT' &&
          campaign.openRate !== null &&
          campaign.clickRate !== null && (
          <div className={styles.rateBars}>
            <MetricBar
              value={campaign.openRate}
              label="Open rate"
              color="var(--color-info)"
            />
            <MetricBar
              value={campaign.clickRate}
              label="Click rate"
              color="var(--color-teal-500)"
            />
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.cardTags}>
            {campaign.tags.map((tag) => (
              <span key={tag} className={styles.cardTag}>
                {tag}
              </span>
            ))}
          </div>
          <span>
            {campaign.sentAt
              ? `Sent ${formatDate(campaign.sentAt, locale, { dateStyle: 'medium' })}`
              : campaign.scheduledAt
                ? `Scheduled ${formatDate(campaign.scheduledAt, locale, { dateStyle: 'medium' })}`
                : `Created ${formatDate(campaign.createdAt, locale, { dateStyle: 'medium' })}`
            }
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function EmailCampaignsPage() {
  const [showCreate,   setShowCreate  ] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: campaigns, isLoading } = useEmailCampaigns({
    status: statusFilter || undefined,
  })

  const totalSent      = campaigns?.filter((c) => c.status === 'SENT').length      ?? 0
  const totalScheduled = campaigns?.filter((c) => c.status === 'SCHEDULED').length ?? 0
  const totalDraft     = campaigns?.filter((c) => c.status === 'DRAFT').length     ?? 0
  const avgOpenRate    = campaigns?.filter((c) => c.openRate !== null).length
    ? (campaigns!
        .filter((c) => c.openRate !== null)
        .reduce((s, c) => s + (c.openRate ?? 0), 0) /
        campaigns!.filter((c) => c.openRate !== null).length
      ).toFixed(1)
    : '—'

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            Email campaigns
          </h2>
          <p className={styles.pageSub}>
            Send HTML email campaigns to your contact segments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New campaign
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard value={totalSent}      label="Campaigns sent"   color="var(--color-success)" />
        <StatCard value={totalScheduled} label="Scheduled"        color="var(--color-info)"    />
        <StatCard value={totalDraft}     label="Drafts"           color="var(--color-muted)"   />
        <StatCard value={avgOpenRate}    label="Avg open rate"    color="var(--color-teal-600)" suffix={typeof avgOpenRate === 'string' && avgOpenRate !== '—' ? '%' : ''} />
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
      {!isLoading && campaigns?.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
               stroke="var(--color-border)" strokeWidth="1.5">
            <rect x="4" y="8" width="40" height="32" rx="4"/>
            <path d="M4 16l20 13 20-13"/>
          </svg>
          <div className={styles.emptyTitle}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} campaigns` : 'No campaigns yet'}
          </div>
          <div className={styles.emptySub}>
            Create an email campaign to reach your contacts directly in their inbox.
          </div>
          {!statusFilter && (
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + Create first campaign
            </Button>
          )}
        </div>
      )}

      {/* Campaign list */}
      {!isLoading && campaigns && campaigns.length > 0 && (
        <div className={styles.campaignList}>
          {campaigns.map((campaign) => (
            <EmailCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateEmailModal onClose={() => setShowCreate(false)} />
      )}

    </div>
  )
}