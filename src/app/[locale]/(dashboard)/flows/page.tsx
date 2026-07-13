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
      toast.show('Flow created ✓', 'success')
      router.push(`/${locale}/flows/${flow.id}`)
    } catch {
      toast.show('Failed to create flow', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200, padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '480px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '0.5px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 'var(--text-h3)', fontWeight: 600 }}>
            New bot flow
          </span>
          <button onClick={onClose} style={{
            width: 28, height: 28, border: 'none',
            background: 'transparent', cursor: 'pointer',
            fontSize: 18, color: 'var(--color-muted)',
            borderRadius: 'var(--radius-md)',
          }}>×</button>
        </div>

        <div style={{
          padding: 'var(--space-6)',
          display: 'flex', flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
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
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '0.5px solid var(--color-border)',
        }}>
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
        nextStatus === 'ACTIVE' ? 'Flow activated ✓' : 'Flow paused',
        'success'
      )
    } catch {
      toast.show('Failed to update status', 'error')
    }
  }

  const statusColor = STATUS_COLORS[flow.status]
  const nodeTypes = Array.from(new Set(flow.nodes.map((n) => n.type)))

  return (
    <div style={{
      background: 'var(--color-white)',
      border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'border-color var(--transition-fast)',
      cursor: 'pointer',
    }}
      onClick={() => router.push(`/${locale}/flows/${flow.id}`)}
    >
      {/* Header */}
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '0.5px solid var(--color-border)',
        background: 'var(--color-bg)',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 'var(--space-3)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 'var(--text-body)',
            color: 'var(--color-ink)', marginBottom: 4,
          }}>
            {flow.name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 'var(--space-2)', flexWrap: 'wrap',
          }}>
            <PlatformIcon platform={flow.platform} size={13} />
            <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
              {flow.clientName}
            </span>
            <span style={{
              fontSize: 'var(--text-caption)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: statusColor.bg,
              color: statusColor.text,
              fontWeight: 500,
            }}>
              {flow.status}
            </span>
          </div>
        </div>

        <div
          style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleToggleStatus}
            disabled={updateStatus.isPending}
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
            {flow.status === 'ACTIVE' ? 'Pause' : 'Activate'}
          </button>
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
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--space-4) var(--space-5)' }}>

        {flow.description && (
          <p style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
            marginBottom: 'var(--space-3)',
            lineHeight: 1.5,
          }}>
            {flow.description}
          </p>
        )}

        {/* Node type chips */}
        <div style={{
          display: 'flex', gap: 'var(--space-1)',
          flexWrap: 'wrap', marginBottom: 'var(--space-4)',
        }}>
          {nodeTypes.map((type) => (
            <span key={type} style={{
              fontSize: 'var(--text-caption)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg-2)',
              color: 'var(--color-muted)',
              fontWeight: 500,
            }}>
              {NODE_TYPE_ICONS[type]} {type}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-3)',
        }}>
          {[
            { value: flow.nodes.length,                   label: 'Nodes'       },
            { value: flow.triggerCount.toLocaleString(),  label: 'Triggered'   },
            { value: flow.completionRate > 0 ? `${flow.completionRate}%` : '—', label: 'Completion' },
          ].map(({ value, label }) => (
            <div key={label} style={{
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2) var(--space-3)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 'var(--text-body)',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}>
                {value}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
          borderTop: '0.5px solid var(--color-border)',
          fontSize: 'var(--text-small)',
          color: 'var(--color-muted)',
        }}>
          <span>Updated {formatDate(flow.updatedAt, locale, { dateStyle: 'medium' })}</span>
          <span style={{
            color: 'var(--color-teal-600)',
            fontWeight: 500,
          }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>Bot flows</h2>
          <p style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)', marginTop: '2px',
          }}>
            Automate conversations with visual flow builders.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New flow
        </Button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        {[
          { value: flows?.length ?? 0, label: 'Total flows',    color: 'var(--color-ink)'     },
          { value: activeFlows,         label: 'Active',         color: 'var(--color-success)' },
          { value: draftFlows,          label: 'Drafts',         color: 'var(--color-warning)' },
          { value: totalTrigs,          label: 'Times triggered',color: 'var(--color-info)'   },
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
          { value: '',         label: 'All'      },
          { value: 'ACTIVE',   label: 'Active'   },
          { value: 'INACTIVE', label: 'Paused'   },
          { value: 'DRAFT',    label: 'Draft'    },
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              height: 260, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(90deg, var(--color-bg-2) 25%, var(--color-border) 50%, var(--color-bg-2) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && flows?.length === 0 && (
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
            <rect x="2" y="4" width="14" height="10" rx="2"/>
            <rect x="32" y="20" width="14" height="10" rx="2"/>
            <rect x="2" y="34" width="14" height="10" rx="2"/>
            <path d="M16 9h8a4 4 0 014 4v8M16 39h8a4 4 0 01-4-4v-8"/>
          </svg>
          <div style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>
            No flows yet
          </div>
          <div style={{
            fontSize: 'var(--text-body)', color: 'var(--color-muted)',
            maxWidth: 300, lineHeight: 1.6,
          }}>
            Create a bot flow to automate conversations — welcome messages, FAQ replies, lead capture and more.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + Create first flow
          </Button>
        </div>
      )}

      {/* Flow grid */}
      {!isLoading && flows && flows.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--space-4)',
        }}>
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