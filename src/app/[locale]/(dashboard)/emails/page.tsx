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
import type {
  EmailCampaign,
  EmailCampaignStatus,
} from '@/lib/types'

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
    <div style={{
      background: 'var(--color-white)',
      border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
    }}>
      <div style={{ fontSize: 'var(--text-h2)', fontWeight: 600, color, marginBottom: 2 }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
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
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 4,
        fontSize: 'var(--text-small)',
      }}>
        <span style={{ color: 'var(--color-muted)' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{
        height: 6,
        background: 'var(--color-bg-2)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(value, 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 'var(--radius-full)',
        }} />
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
        sendNow ? 'Campaign queued for sending ✓' : 'Campaign saved ✓',
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
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 200,
        padding: 'var(--space-6) var(--space-4)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '600px',
          boxShadow: 'var(--shadow-lg)',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '0.5px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 'var(--text-h3)', fontWeight: 600 }}>
            New email campaign
          </span>
          <button onClick={onClose} style={{
            width: 28, height: 28, border: 'none',
            background: 'transparent', cursor: 'pointer',
            fontSize: 18, color: 'var(--color-muted)',
            borderRadius: 'var(--radius-md)',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{
          padding: 'var(--space-6)',
          display: 'flex', flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>

          <Input
            label="Campaign name"
            placeholder="November newsletter — Somjai Coffee"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Client */}
          <div>
            <span style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block',
              marginBottom: 'var(--space-2)',
            }}>
              Client workspace
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {clients?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setClientId(c.id)
                    if (!fromName) setFromName(c.name)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
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
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-small)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-teal-500)',
                    flexShrink: 0,
                  }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* From */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
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
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 'var(--space-1)',
            }}>
              <span style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)',
              }}>
                Email body
              </span>
              <span style={{
                fontSize: 'var(--text-small)',
                color: 'var(--color-muted)',
              }}>
                HTML supported
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`<h2>สวัสดีค่ะ {{name}}</h2>\n<p>เดือนนี้เรามีโปรโมชั่นสุดพิเศษ...</p>\n\n<a href="{{cta_url}}">คลิกที่นี่</a>`}
              rows={8}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--color-ink)',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.65,
              }}
            />
            <p style={{
              fontSize: 'var(--text-small)',
              color: 'var(--color-muted)',
              marginTop: 'var(--space-1)',
              lineHeight: 1.5,
            }}>
              Use <code style={{ background: 'var(--color-bg-2)', padding: '1px 4px', borderRadius: 3 }}>
                {'{{name}}'}
              </code> for contact name,{' '}
              <code style={{ background: 'var(--color-bg-2)', padding: '1px 4px', borderRadius: 3 }}>
                {'{{unsubscribe_url}}'}
              </code> for unsubscribe link.
            </p>
          </div>

          {/* Tags */}
          <div>
            <span style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block',
              marginBottom: 'var(--space-2)',
            }}>
              Send to contacts tagged with
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {KNOWN_TAGS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
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
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-small)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
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
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '0.5px solid var(--color-border)',
        }}>
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
      toast.show('Campaign queued for sending ✓', 'success')
    } catch {
      toast.show('Failed to send campaign', 'error')
    }
  }

  const statusColor = STATUS_COLORS[campaign.status]

  return (
    <div style={{
      background: 'var(--color-white)',
      border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '0.5px solid var(--color-border)',
        background: 'var(--color-bg)',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 'var(--text-body)',
            color: 'var(--color-ink)', marginBottom: 4,
          }}>
            {campaign.name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 'var(--space-2)', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
              ✉ {campaign.fromName} &lt;{campaign.fromEmail}&gt;
            </span>
            <span style={{
              fontSize: 'var(--text-caption)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: statusColor.bg,
              color: statusColor.text,
              fontWeight: 500,
            }}>
              {campaign.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
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
              style={{
                height: 30, padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '0.5px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-muted)',
                fontSize: 'var(--text-small)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--space-4) var(--space-5)' }}>

        {/* Subject */}
        <div style={{
          fontSize: 'var(--text-body)',
          fontWeight: 500,
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-1)',
        }}>
          {campaign.subject}
        </div>
        {campaign.previewText && (
          <div style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
            marginBottom: 'var(--space-4)',
          }}>
            {campaign.previewText}
          </div>
        )}

        {/* Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: campaign.status === 'SENT'
            ? 'repeat(4, 1fr)'
            : 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
          marginBottom: campaign.status === 'SENT' ? 'var(--space-4)' : 0,
        }}>
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>
              {campaign.recipientCount}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
              Recipients
            </div>
          </div>
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'var(--text-h3)', fontWeight: 600,
              color: campaign.sentCount > 0
                ? 'var(--color-success)'
                : 'var(--color-muted)',
            }}>
              {campaign.sentCount}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
              Delivered
            </div>
          </div>
          {campaign.status === 'SENT' && (
            <>
              <div style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 'var(--text-h3)', fontWeight: 600,
                  color: 'var(--color-info)',
                }}>
                  {campaign.openCount}
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                  Opened
                </div>
              </div>
              <div style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 'var(--text-h3)', fontWeight: 600,
                  color: 'var(--color-teal-600)',
                }}>
                  {campaign.clickCount}
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
          borderTop: '0.5px solid var(--color-border)',
          fontSize: 'var(--text-small)',
          color: 'var(--color-muted)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {campaign.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: 'var(--text-caption)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg-2)',
                color: 'var(--color-muted)',
              }}>
                {tag}
              </span>
            ))}
          </div>
          <span>
            {campaign.sentAt
              ? `Sent ${new Date(campaign.sentAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}`
              : campaign.scheduledAt
                ? `Scheduled ${new Date(campaign.scheduledAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}`
                : `Created ${new Date(campaign.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}`
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
            Email campaigns
          </h2>
          <p style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)', marginTop: '2px',
          }}>
            Send HTML email campaigns to your contact segments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New campaign
        </Button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        <StatCard value={totalSent}      label="Campaigns sent"   color="var(--color-success)" />
        <StatCard value={totalScheduled} label="Scheduled"        color="var(--color-info)"    />
        <StatCard value={totalDraft}     label="Drafts"           color="var(--color-muted)"   />
        <StatCard value={avgOpenRate}    label="Avg open rate"    color="var(--color-teal-600)" suffix={typeof avgOpenRate === 'string' && avgOpenRate !== '—' ? '%' : ''} />
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
            style={{
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
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
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-small)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2].map((n) => (
            <div key={n} style={{
              height: 220, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(90deg, var(--color-bg-2) 25%, var(--color-border) 50%, var(--color-bg-2) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && campaigns?.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-12) var(--space-6)',
          background: 'var(--color-white)',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
               stroke="var(--color-border)" strokeWidth="1.5">
            <rect x="4" y="8" width="40" height="32" rx="4"/>
            <path d="M4 16l20 13 20-13"/>
          </svg>
          <div style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} campaigns` : 'No campaigns yet'}
          </div>
          <div style={{
            fontSize: 'var(--text-body)', color: 'var(--color-muted)',
            maxWidth: 300, lineHeight: 1.6,
          }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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