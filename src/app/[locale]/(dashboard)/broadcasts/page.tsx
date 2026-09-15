'use client'

import { useState, useEffect } from 'react'
import {
  useBroadcasts,
  useCreateBroadcast,
  useDeleteBroadcast,
  useSendBroadcast,
} from '@/hooks/useBroadcasts'
import {
  useWhatsappConnections,
  useWhatsappTemplates,
  useSyncWhatsappTemplates,
} from '@/hooks/useWhatsapp'
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

// Facebook is gone: Messenger broadcast is retired. LINE is offered but has no
// backend yet, so it is selectable-but-disabled until that ships.
const PLATFORMS: BroadcastPlatform[] = ['WHATSAPP', 'LINE']

const KNOWN_TAGS = ['vip', 'interested', 'corporate', 'follow-up', 'new']

// ── Create broadcast modal ─────────────────────────────────────────
function CreateBroadcastModal({ onClose }: { onClose: () => void }) {
  const [name,         setName        ] = useState('')
  const [platform,     setPlatform    ] = useState<BroadcastPlatform>('WHATSAPP')
  const [clientId,     setClientId    ] = useState('')
  const [connectionId, setConnectionId] = useState('')
  const [templateId,   setTemplateId  ] = useState('')
  const [variables,    setVariables   ] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [scheduledAt,  setScheduledAt ] = useState('')
  const [saving,       setSaving      ] = useState(false)

  const { data: clients }     = useClients()
  const { data: connections } = useWhatsappConnections(clientId)
  const { data: templates }   = useWhatsappTemplates(connectionId || undefined)
  const syncTemplates         = useSyncWhatsappTemplates()
  const createBroadcast       = useCreateBroadcast()
  const toast                 = useToast()

  const isLine = platform === 'LINE'

  // Auto-select the connection when the client has exactly one; clear it
  // otherwise so a stale id from another client cannot leak through.
  useEffect(() => {
    if (connections && connections.length === 1) {
      setConnectionId(connections[0].id)
    } else {
      setConnectionId('')
    }
    setTemplateId('')
    setVariables([])
  }, [clientId, connections])

  const approved = templates?.filter((t) => t.status === 'APPROVED') ?? []
  const selectedTemplate = approved.find((t) => t.id === templateId)

  // Resize the variable inputs to the chosen template's placeholder count.
  useEffect(() => {
    const n = selectedTemplate?.variableCount ?? 0
    setVariables((prev) => {
      const next = [...prev]
      next.length = n
      return Array.from(next, (v) => v ?? '')
    })
  }, [templateId, selectedTemplate?.variableCount])

  const handleSync = async () => {
    if (!connectionId) return
    try {
      const { synced } = await syncTemplates.mutateAsync(connectionId)
      toast.show(`Synced ${synced} template${synced === 1 ? '' : 's'}`, 'success')
    } catch {
      toast.show('Could not sync templates', 'error')
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleSave = async (sendNow = false) => {
    if (!name.trim())  { toast.show('Enter a campaign name', 'warning'); return }
    if (!clientId)     { toast.show('Select a client', 'warning');       return }
    if (!connectionId) { toast.show('Select a WhatsApp number', 'warning'); return }
    if (!templateId)   { toast.show('Choose an approved template', 'warning'); return }
    if (variables.some((v) => !v.trim())) {
      toast.show('Fill in every template value', 'warning'); return
    }
    if (selectedTags.length === 0) {
      toast.show('Select at least one recipient tag', 'warning'); return
    }

    setSaving(true)
    try {
      await createBroadcast.mutateAsync({
        name,
        clientId,
        connectionId,
        templateId,
        variableValues: variables,
        tags:           selectedTags,
        scheduledAt:    scheduledAt || undefined,
      })
      toast.show(sendNow ? 'Campaign created and queued' : 'Campaign saved', 'success')
      onClose()
    } catch {
      toast.show('Failed to create campaign', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>New broadcast campaign</span>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close">×</button>
        </div>

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
                    border: `1px solid ${platform === p ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
                    background: platform === p ? 'var(--color-teal-50)' : 'var(--color-white)',
                    color: platform === p ? 'var(--color-teal-600)' : 'var(--color-muted)',
                  }}
                >
                  <PlatformIcon platform={p} size={14} />
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {isLine ? (
            <div className={styles.comingSoon}>
              <strong>LINE broadcasts are coming soon.</strong>
              <span>
                LINE Official Account connection isn&apos;t available yet. WhatsApp
                broadcasts work today — switch the platform above.
              </span>
            </div>
          ) : (
            <>
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
                        border: `1px solid ${clientId === c.id ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
                        background: clientId === c.id ? 'var(--color-teal-50)' : 'var(--color-white)',
                        color: clientId === c.id ? 'var(--color-teal-600)' : 'var(--color-ink)',
                      }}
                    >
                      <span className={styles.clientDot} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp number — only shown when the client has more than one */}
              {clientId && connections && connections.length === 0 && (
                <div className={styles.notice}>
                  This client has no connected WhatsApp number. Connect one from
                  the client&apos;s panel first.
                </div>
              )}
              {connections && connections.length > 1 && (
                <div>
                  <span className={styles.fieldLabel}>WhatsApp number</span>
                  <div className={styles.clientList}>
                    {connections.map((wa) => (
                      <button
                        key={wa.id}
                        type="button"
                        onClick={() => setConnectionId(wa.id)}
                        className={styles.clientOption}
                        style={{
                          border: `1px solid ${connectionId === wa.id ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
                          background: connectionId === wa.id ? 'var(--color-teal-50)' : 'var(--color-white)',
                          color: connectionId === wa.id ? 'var(--color-teal-600)' : 'var(--color-ink)',
                        }}
                      >
                        {wa.verifiedName ?? wa.displayPhoneNumber ?? 'WhatsApp Business'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Template */}
              {connectionId && (
                <div>
                  <div className={styles.templateLabelRow}>
                    <span className={styles.fieldLabel}>Approved template</span>
                    <button
                      type="button"
                      className={styles.syncBtn}
                      onClick={handleSync}
                      disabled={syncTemplates.isPending}
                    >
                      {syncTemplates.isPending ? 'Syncing…' : 'Sync from WhatsApp'}
                    </button>
                  </div>
                  {approved.length === 0 ? (
                    <p className={styles.messageHelp}>
                      No approved templates yet. Sync from WhatsApp, or create and
                      get one approved in the WhatsApp Manager first.
                    </p>
                  ) : (
                    <select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className={styles.templateSelect}
                    >
                      <option value="">— Choose a template —</option>
                      {approved.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.language})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Template preview + variable inputs */}
              {selectedTemplate && (
                <div>
                  <span className={styles.fieldLabel}>Message preview</span>
                  <div className={styles.templatePreview}>{selectedTemplate.bodyText}</div>
                  {selectedTemplate.variableCount > 0 && (
                    <div className={styles.variablesWrap}>
                      {Array.from({ length: selectedTemplate.variableCount }, (_, i) => (
                        <Input
                          key={i}
                          label={`Value for {{${i + 1}}}`}
                          placeholder={`Fills {{${i + 1}}} for every recipient`}
                          value={variables[i] ?? ''}
                          onChange={(e) => {
                            const next = [...variables]
                            next[i] = e.target.value
                            setVariables(next)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recipient tags */}
              <div>
                <span className={styles.fieldLabel}>Send to contacts tagged with</span>
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
                          border: `1px solid ${active ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
                          background: active ? 'var(--color-teal-50)' : 'var(--color-white)',
                          color: active ? 'var(--color-teal-600)' : 'var(--color-muted)',
                        }}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <p className={styles.tagsHint}>
                    Reaches contacts tagged {selectedTags.join(', ')} who have opted in
                    to this number.
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
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="secondary"
            onClick={() => handleSave(false)}
            loading={saving}
            disabled={isLine}
          >
            Save as draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            loading={saving}
            disabled={isLine}
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
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderMain}>
          <div className={styles.cardName}>{broadcast.name}</div>
          <div className={styles.cardMetaRow}>
            <PlatformIcon platform="WHATSAPP" size={13} />
            <span className={styles.cardClientName}>{broadcast.clientName}</span>
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
            <Button variant="primary" size="sm" onClick={handleSend} loading={sendBroadcast.isPending}>
              Send now
            </Button>
          )}
          {(broadcast.status === 'DRAFT' || broadcast.status === 'SCHEDULED') && (
            <button onClick={handleDelete} className={styles.deleteBtn}>Delete</button>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        {/* The template, not a free-text message — WhatsApp broadcasts are
            always an approved template. */}
        <div className={styles.messagePreview}>
          Template: <strong>{broadcast.templateName}</strong>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.metricBox}>
            <div className={styles.metricValue}>{broadcast.recipientCount}</div>
            <div className={styles.metricLabel}>Recipients</div>
          </div>

          {broadcast.status === 'SENT' && (
            <>
              <div className={styles.metricBox}>
                <div className={styles.metricValueSuccess}>{broadcast.sentCount}</div>
                <div className={styles.metricLabel}>Delivered</div>
              </div>
              {broadcast.failedCount > 0 && (
                <div className={styles.metricBox}>
                  <div className={styles.metricValueDanger}>{broadcast.failedCount}</div>
                  <div className={styles.metricLabel}>Failed</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardTags}>
            {broadcast.tags.map((tag) => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
          </div>
          <span>
            {broadcast.sentAt
              ? `Sent ${formatDate(broadcast.sentAt, locale, { dateStyle: 'medium' })}`
              : broadcast.scheduledAt
                ? `Scheduled ${formatDate(broadcast.scheduledAt, locale, { dateStyle: 'medium', timeStyle: 'short' })}`
                : `Created ${formatDate(broadcast.createdAt, locale, { dateStyle: 'medium' })}`}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function BroadcastsPage() {
  const [showCreate,   setShowCreate  ] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: broadcasts, isLoading } = useBroadcasts({
    status: statusFilter || undefined,
  })

  const totalSent      = broadcasts?.filter((b) => b.status === 'SENT').length      ?? 0
  const totalScheduled = broadcasts?.filter((b) => b.status === 'SCHEDULED').length ?? 0
  const totalDraft     = broadcasts?.filter((b) => b.status === 'DRAFT').length     ?? 0
  const totalReach     = broadcasts?.reduce((s, b) => s + b.sentCount, 0)           ?? 0

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Broadcast campaigns</h2>
          <p className={styles.pageSub}>
            Send approved WhatsApp templates to opted-in contact segments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New campaign
        </Button>
      </div>

      <div className={styles.statsGrid}>
        {[
          { value: totalSent,      label: 'Campaigns sent',      color: 'var(--color-success)' },
          { value: totalScheduled, label: 'Scheduled',           color: 'var(--color-info)'    },
          { value: totalDraft,     label: 'Drafts',              color: 'var(--color-muted)'   },
          { value: totalReach,     label: 'Total messages sent', color: 'var(--color-ink)'     },
        ].map(({ value, label, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statCardValue} style={{ color }}>{value.toLocaleString()}</div>
            <div className={styles.statCardLabel}>{label}</div>
          </div>
        ))}
      </div>

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
              border: `1px solid ${statusFilter === tab.value ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
              background: statusFilter === tab.value ? 'var(--color-teal-50)' : 'var(--color-white)',
              color: statusFilter === tab.value ? 'var(--color-teal-600)' : 'var(--color-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.loadingWrap}>
          {[1, 2].map((n) => <div key={n} className={styles.skeletonCard} />)}
        </div>
      )}

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
            Create a broadcast to send an approved WhatsApp template to your
            opted-in contact segments.
          </div>
          {!statusFilter && (
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + Create first campaign
            </Button>
          )}
        </div>
      )}

      {!isLoading && broadcasts && broadcasts.length > 0 && (
        <div className={styles.campaignList}>
          {broadcasts.map((bc) => <BroadcastCard key={bc.id} broadcast={bc} />)}
        </div>
      )}

      {showCreate && <CreateBroadcastModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}