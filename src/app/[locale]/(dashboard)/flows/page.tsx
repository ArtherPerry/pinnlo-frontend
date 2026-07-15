'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  useFlows,
  useCreateFlow,
  useDeleteFlow,
  useUpdateFlowStatus,
} from '@/hooks/useFlows'
import { useClients } from '@/hooks/useClients'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import type {
  BotFlow,
  FlowStatus,
  FlowPlatform,
} from '@/lib/types'
import styles from './flows.module.css'

const STATUS_COLORS: Record<FlowStatus, { bg: string; text: string }> = {
  ACTIVE:   { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
  INACTIVE: { bg: 'var(--color-bg-2)',          text: 'var(--color-muted)'   },
  DRAFT:    { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
}

const PLATFORMS: FlowPlatform[] = ['FACEBOOK', 'WHATSAPP', 'LINE']

const NODE_TYPE_ICONS: Record<string, string> = {
  TRIGGER:   '⚡',
  MESSAGE:   '💬',
  CONDITION: '🔀',
  ACTION:    '⚙️',
  DELAY:     '⏱',
  TAG:       '🏷',
  ASSIGN:    '👤',
  END:       '🔚',
}

// ── Create flow modal ──────────────────────────────────────────────
function CreateFlowModal({ onClose }: { onClose: () => void }) {
  const [name,        setName       ] = useState('')
  const [description, setDescription] = useState('')
  const [platform,    setPlatform   ] = useState<FlowPlatform>('FACEBOOK')
  const [clientId,    setClientId   ] = useState('')
  const [saving,      setSaving     ] = useState(false)

  const { data: clients } = useClients()
  const createFlow        = useCreateFlow()
  const router            = useRouter()
  const locale            = useLocale()
  const toast             = useToast()

  const handleCreate = async () => {
    if (!name.trim())  { toast.show('Enter a flow name', 'warning');  return }
    if (!clientId)     { toast.show('Select a client', 'warning');    return }

    setSaving(true)
    try {
      const flow = await createFlow.mutateAsync({
        name, description, platform, clientId,
      })
      toast.show('Flow created', 'success')
      router.push(`/${locale}/flows/${flow.id}`)
    } catch {
      toast.show('Failed to create flow', 'error')
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
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            New bot flow
          </span>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          <Input
            label="Flow name"
            placeholder="Welcome new customers"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Description (optional)"
            placeholder="Greet new contacts and capture their needs"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} loading={saving}>
            Create & open editor
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Flow card ──────────────────────────────────────────────────────
function FlowCard({ flow }: { flow: BotFlow }) {
  const router          = useRouter()
  const locale          = useLocale()
  const deleteFlow      = useDeleteFlow()
  const updateStatus    = useUpdateFlowStatus(flow.id)
  const toast           = useToast()

  const handleDelete = async () => {
    if (!confirm(`Delete "${flow.name}"? This cannot be undone.`)) return
    try {
      await deleteFlow.mutateAsync(flow.id)
      toast.show('Flow deleted', 'success')
    } catch {
      toast.show('Failed to delete flow', 'error')
    }
  }

  const handleToggleStatus = async () => {
    const nextStatus: FlowStatus =
      flow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateStatus.mutateAsync(nextStatus)
      toast.show(
        nextStatus === 'ACTIVE' ? 'Flow activated' : 'Flow paused',
        'success'
      )
    } catch {
      toast.show('Failed to update status', 'error')
    }
  }

  const statusColor = STATUS_COLORS[flow.status]
  const nodeTypes = Array.from(new Set(flow.nodes.map((n) => n.type)))

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/${locale}/flows/${flow.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/${locale}/flows/${flow.id}`)
        }
      }}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderMain}>
          <div className={styles.cardName}>
            {flow.name}
          </div>
          <div className={styles.cardMetaRow}>
            <PlatformIcon platform={flow.platform} size={13} />
            <span className={styles.cardClientName}>
              {flow.clientName}
            </span>
            <span
              className={styles.statusBadge}
              style={{ background: statusColor.bg, color: statusColor.text }}
            >
              {flow.status}
            </span>
          </div>
        </div>

        <div
          className={styles.cardActions}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleToggleStatus}
            disabled={updateStatus.isPending}
            className={styles.cardActionBtn}
          >
            {flow.status === 'ACTIVE' ? 'Pause' : 'Activate'}
          </button>
          <button
            onClick={handleDelete}
            className={styles.cardActionBtn}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>

        {flow.description && (
          <p className={styles.cardDescription}>
            {flow.description}
          </p>
        )}

        {/* Node type chips */}
        <div className={styles.nodeChips}>
          {nodeTypes.map((type) => (
            <span key={type} className={styles.nodeChip}>
              {NODE_TYPE_ICONS[type]} {type}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { value: flow.nodes.length,                   label: 'Nodes'       },
            { value: flow.triggerCount.toLocaleString(),  label: 'Triggered'   },
            { value: flow.completionRate > 0 ? `${flow.completionRate}%` : '—', label: 'Completion' },
          ].map(({ value, label }) => (
            <div key={label} className={styles.metricBox}>
              <div className={styles.metricValue}>
                {value}
              </div>
              <div className={styles.metricLabel}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <span>Updated {formatDate(flow.updatedAt, locale, { dateStyle: 'medium' })}</span>
          <span className={styles.openEditorLink}>
            Open editor →
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function FlowsPage() {
  const [showCreate,   setShowCreate  ] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: flows, isLoading } = useFlows({
    status: statusFilter || undefined,
  })

  const activeFlows = flows?.filter((f) => f.status === 'ACTIVE').length  ?? 0
  const draftFlows  = flows?.filter((f) => f.status === 'DRAFT').length   ?? 0
  const totalTrigs  = flows?.reduce((s, f) => s + f.triggerCount, 0)      ?? 0

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Bot flows</h2>
          <p className={styles.pageSub}>
            Automate conversations with visual flow builders.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New flow
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { value: flows?.length ?? 0, label: 'Total flows',    color: 'var(--color-ink)'     },
          { value: activeFlows,         label: 'Active',         color: 'var(--color-success)' },
          { value: draftFlows,          label: 'Drafts',         color: 'var(--color-warning)' },
          { value: totalTrigs,          label: 'Times triggered',color: 'var(--color-info)'   },
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
          { value: '',         label: 'All'      },
          { value: 'ACTIVE',   label: 'Active'   },
          { value: 'INACTIVE', label: 'Paused'   },
          { value: 'DRAFT',    label: 'Draft'    },
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
        <div className={styles.cardsGrid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && flows?.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
               stroke="var(--color-border)" strokeWidth="1.5">
            <rect x="2" y="4" width="14" height="10" rx="2"/>
            <rect x="32" y="20" width="14" height="10" rx="2"/>
            <rect x="2" y="34" width="14" height="10" rx="2"/>
            <path d="M16 9h8a4 4 0 014 4v8M16 39h8a4 4 0 01-4-4v-8"/>
          </svg>
          <div className={styles.emptyTitle}>
            No flows yet
          </div>
          <div className={styles.emptySub}>
            Create a bot flow to automate conversations — welcome messages, FAQ replies, lead capture and more.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + Create first flow
          </Button>
        </div>
      )}

      {/* Flow grid */}
      {!isLoading && flows && flows.length > 0 && (
        <div className={styles.cardsGrid}>
          {flows.map((flow) => (
            <FlowCard key={flow.id} flow={flow} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateFlowModal onClose={() => setShowCreate(false)} />
      )}

    </div>
  )
}
