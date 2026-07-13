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
        sendNow ? 'Campaign created and queued ✓' : 'Campaign saved ✓',
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
    <div style={{
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
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '580px',
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
            New broadcast campaign
          </span>
          <button onClick={onClose} style={{
            width: 28, height: 28, border: 'none',
            background: 'transparent', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 18,
            color: 'var(--color-muted)',
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
            placeholder="Weekend promotion — Somjai Coffee"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Platform */}
          <div>
            <span style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block',
              marginBottom: 'var(--space-2)',
            }}>Platform</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
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
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-small)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
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
            <span style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block',
              marginBottom: 'var(--space-2)',
            }}>Client workspace</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {clients?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClientId(c.id)}
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

          {/* Template picker */}
          {templates && templates.length > 0 && (
            <div>
              <span style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block',
                marginBottom: 'var(--space-2)',
              }}>
                Start from template (optional)
              </span>
              <select
                value={templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                style={{
                  width: '100%', height: '36px',
                  padding: '0 var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                }}
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
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 'var(--space-1)',
            }}>
              <span style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)',
              }}>
                Message
              </span>
              <span style={{
                fontSize: 'var(--text-small)',
                color: charCount > 1000
                  ? 'var(--color-danger)'
                  : 'var(--color-muted)',
              }}>
                {charCount} chars
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your broadcast message... Use {{name}} to personalise."
              rows={5}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-body)',
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
            }}>
              Use <code style={{
                background: 'var(--color-bg-2)',
                padding: '1px 4px',
                borderRadius: 3,
              }}>
                {'{{name}}'}
              </code> to personalise each message with the contact&apos;s name.
            </p>
          </div>

          {/* Recipient tags */}
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
            {selectedTags.length > 0 && (
              <p style={{
                fontSize: 'var(--text-small)',
                color: 'var(--color-muted)',
                marginTop: 'var(--space-2)',
              }}>
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
      toast.show('Campaign queued for sending ✓', 'success')
    } catch {
      toast.show('Failed to send campaign', 'error')
    }
  }

  const statusColor = STATUS_COLORS[broadcast.status]

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
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        background: 'var(--color-bg)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 'var(--text-body)',
            color: 'var(--color-ink)', marginBottom: 4,
          }}>
            {broadcast.name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 'var(--space-2)', flexWrap: 'wrap',
          }}>
            <PlatformIcon platform={broadcast.platform} size={13} />
            <span style={{
              fontSize: 'var(--text-small)',
              color: 'var(--color-muted)',
            }}>
              {broadcast.clientName}
            </span>
            <span style={{
              fontSize: 'var(--text-caption)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: statusColor.bg,
              color: statusColor.text,
              fontWeight: 500,
            }}>
              {broadcast.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
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

        {/* Message preview */}
        <div style={{
          fontSize: 'var(--text-small)',
          color: 'var(--color-ink)',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          lineHeight: 1.6,
          marginBottom: 'var(--space-4)',
          maxHeight: '80px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {broadcast.message}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>
              {broadcast.recipientCount}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
              Recipients
            </div>
          </div>

          {broadcast.status === 'SENT' && (
            <>
              <div style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 'var(--text-h3)', fontWeight: 600,
                  color: 'var(--color-success)',
                }}>
                  {broadcast.sentCount}
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                  Delivered
                </div>
              </div>

              {broadcast.failedCount > 0 && (
                <div style={{
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 'var(--text-h3)', fontWeight: 600,
                    color: 'var(--color-danger)',
                  }}>
                    {broadcast.failedCount}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                    Failed
                  </div>
                </div>
              )}

              {broadcast.openRate !== null && (
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
                    {broadcast.openRate.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                    Open rate
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer meta */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
          borderTop: '0.5px solid var(--color-border)',
          fontSize: 'var(--text-small)',
          color: 'var(--color-muted)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {broadcast.tags.map((tag) => (
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
            Broadcast campaigns
          </h2>
          <p style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
            marginTop: '2px',
          }}>
            Send personalised DM campaigns to contact segments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New campaign
        </Button>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        {[
          { value: totalSent,      label: 'Campaigns sent',     color: 'var(--color-success)' },
          { value: totalScheduled, label: 'Scheduled',          color: 'var(--color-info)'    },
          { value: totalDraft,     label: 'Drafts',             color: 'var(--color-muted)'   },
          { value: totalReach,     label: 'Total messages sent', color: 'var(--color-ink)'    },
        ].map(({ value, label, color }) => (
          <div key={label} style={{
            background: 'var(--color-white)',
            border: '0.5px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}>
            <div style={{ fontSize: 'var(--text-h2)', fontWeight: 600, color, marginBottom: 2 }}>
              {value.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
              {label}
            </div>
          </div>
        ))}
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
              height: 200, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(90deg, var(--color-bg-2) 25%, var(--color-border) 50%, var(--color-bg-2) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && broadcasts?.length === 0 && (
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
            <path d="M6 24h36M6 16l36 8-36 8"/>
            <circle cx="38" cy="24" r="4"/>
          </svg>
          <div style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} campaigns` : 'No campaigns yet'}
          </div>
          <div style={{
            fontSize: 'var(--text-body)', color: 'var(--color-muted)',
            maxWidth: 300, lineHeight: 1.6,
          }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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