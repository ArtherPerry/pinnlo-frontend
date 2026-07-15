'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Check } from 'lucide-react'
import {
  useApiKeys,
  useApiUsage,
  useCreateApiKey,
  useRevokeApiKey,
} from '@/hooks/useEnterprise'
import { Button, Input } from '@/components/ui'
import { PlanGate } from '@/components/features/PlanGate'
import { useToast } from '@/hooks/useToast'
import { cn, formatDate } from '@/lib/utils'
import type { ApiKey, ApiKeyStatus } from '@/lib/types'
import styles from './developer.module.css'

const ALL_PERMISSIONS = [
  'posts:read',    'posts:write',
  'contacts:read', 'contacts:write',
  'analytics:read','clients:read',
  'clients:write', 'webhooks:manage',
]

const STATUS_CLASS: Record<ApiKeyStatus, string> = {
  ACTIVE:  styles.keyStatusActive,
  REVOKED: styles.keyStatusRevoked,
  EXPIRED: styles.keyStatusExpired,
}

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose:   () => void
  onCreated: (fullKey: string) => void
}) {
  const [name,        setName       ] = useState('')
  const [permissions, setPermissions] = useState<string[]>(['posts:read', 'analytics:read'])
  const [expiresAt,   setExpiresAt  ] = useState('')
  const createKey = useCreateApiKey()
  const toast     = useToast()

  const togglePerm = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) { toast.show('Enter a name for this key', 'warning'); return }
    if (permissions.length === 0) { toast.show('Select at least one permission', 'warning'); return }
    try {
      const result = await createKey.mutateAsync({ name, permissions, expiresAt: expiresAt || undefined })
      onCreated(result.fullKey)
    } catch {
      toast.show('Failed to create API key', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create API key</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <Input
            label="Key name"
            placeholder="Production integration"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hint="A name to identify where this key is used"
          />
          <div>
            <span className={styles.sectionLabel}>Permissions</span>
            <div className={styles.permGrid}>
              {ALL_PERMISSIONS.map((perm) => {
                const active = permissions.includes(perm)
                return (
                  <button
                    key={perm}
                    type="button"
                    className={cn(styles.permOption, active && styles.permOptionActive)}
                    onClick={() => togglePerm(perm)}
                  >
                    <input
                      type="checkbox"
                      className={styles.permCheckbox}
                      checked={active}
                      onChange={() => {}}
                    />
                    <span className={styles.permLabel}>{perm}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <Input
            label="Expiry date (optional)"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            hint="Leave empty for a non-expiring key"
          />
        </div>
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} loading={createKey.isPending}>
            Create key
          </Button>
        </div>
      </div>
    </div>
  )
}

function NewKeyReveal({ fullKey, onClose }: { fullKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(fullKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>API key created</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.newKeyBox}>
            <span className={styles.newKeyWarning}>
              ⚠ Copy this key now — it will never be shown again.
            </span>
            <div className={styles.newKeyValue}>{fullKey}</div>
            <div className={styles.newKeyActions}>
              <Button variant="primary" size="sm" onClick={handleCopy}>
                {copied ? <><Check size={14} /> Copied</> : 'Copy key'}
              </Button>
            </div>
          </div>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Store this key securely — in an environment variable, not in your source code.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}

function ApiKeyCard({ apiKey }: { apiKey: ApiKey }) {
  const revokeKey = useRevokeApiKey()
  const toast     = useToast()
  const locale    = useLocale()
  const isRevoked = apiKey.status === 'REVOKED'

  const handleRevoke = async () => {
    if (!confirm(`Revoke key "${apiKey.name}"? This cannot be undone.`)) return
    try {
      await revokeKey.mutateAsync(apiKey.id)
      toast.show('API key revoked', 'success')
    } catch {
      toast.show('Failed to revoke key', 'error')
    }
  }

  return (
    <div className={cn(styles.keyCard, isRevoked && styles.keyCardRevoked)}>
      <div className={styles.keyTop}>
        <div className={styles.keyTopLeft}>
          <span className={styles.keyName}>{apiKey.name}</span>
          <code className={styles.keyPrefix}>{apiKey.keyPrefix}</code>
        </div>
        <div className={styles.keyTopRight}>
          <span className={cn(styles.keyStatus, STATUS_CLASS[apiKey.status])}>
            {apiKey.status}
          </span>
          {!isRevoked && (
            <button className={styles.revokeBtn} onClick={handleRevoke}>Revoke</button>
          )}
        </div>
      </div>

      <div className={styles.permissions}>
        {apiKey.permissions.map((perm) => (
          <span key={perm} className={styles.permChip}>{perm}</span>
        ))}
      </div>

      <div className={styles.keyMeta}>
        <div className={styles.keyMetaItem}>
          <span>Requests today:</span>
          <span className={styles.keyMetaValue}>{apiKey.requestsToday.toLocaleString()}</span>
        </div>
        <div className={styles.keyMetaItem}>
          <span>This month:</span>
          <span className={styles.keyMetaValue}>{apiKey.requestsMonth.toLocaleString()}</span>
        </div>
        <div className={styles.keyMetaItem}>
          <span>Last used:</span>
          <span className={styles.keyMetaValue}>
            {apiKey.lastUsedAt
              ? formatDate(apiKey.lastUsedAt, locale, { dateStyle: 'medium' })
              : 'Never'
            }
          </span>
        </div>
        {apiKey.expiresAt && (
          <div className={styles.keyMetaItem}>
            <span>Expires:</span>
            <span className={styles.keyMetaValue}>
              {formatDate(apiKey.expiresAt, locale, { dateStyle: 'medium' })}
            </span>
          </div>
        )}
        <div className={styles.keyMetaItem}>
          <span>Created:</span>
          <span className={styles.keyMetaValue}>
            {formatDate(apiKey.createdAt, locale, { dateStyle: 'medium' })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DeveloperPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [newFullKey, setNewFullKey ] = useState<string | null>(null)

  const { data: keys,  isLoading: keysLoading  } = useApiKeys()
  const { data: usage, isLoading: usageLoading } = useApiUsage()

  const usagePct = usage ? (usage.requestsMonth / usage.monthlyLimit) * 100 : 0

  const handleCreated = (fullKey: string) => {
    setShowCreate(false)
    setNewFullKey(fullKey)
  }

  return (
    <PlanGate
      requiredPlan="ENTERPRISE"
      featureName="REST API access"
      features={[
        '100,000 API requests per month',
        'Full read/write access to posts, contacts and analytics',
        'Webhook subscriptions for real-time events',
        'Multiple API keys with granular permissions',
        'Dedicated API support and SLA',
      ]}
    >
      <div className={styles.page}>

        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.pageTitle}>API access</h2>
            <p className={styles.pageSub}>
              Manage API keys and monitor usage for your Pinnalo integration.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + Create API key
          </Button>
        </div>

        {!usageLoading && usage && (
          <>
            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <div className={styles.usageValue}>{usage.requestsToday.toLocaleString()}</div>
                <div className={styles.usageLabel}>Requests today</div>
              </div>
              <div className={styles.usageCard}>
                <div className={styles.usageValue}>{usage.requestsMonth.toLocaleString()}</div>
                <div className={styles.usageLabel}>This month</div>
              </div>
              <div className={styles.usageCard}>
                <div className={styles.usageValue}>{usage.successRate}%</div>
                <div className={styles.usageLabel}>Success rate</div>
              </div>
              <div className={styles.usageCard}>
                <div className={styles.usageValue}>{usage.avgResponseMs}ms</div>
                <div className={styles.usageLabel}>Avg response time</div>
              </div>
            </div>

            <div className={styles.usageCard}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>Monthly quota</span>
              </div>
              <div className={styles.usageBarRow}>
                <span className={styles.usageBarLabel}>API requests</span>
                <div className={styles.usageBarTrack}>
                  <div
                    className={cn(
                      styles.usageBarFill,
                      usagePct > 90 && styles.usageBarFillDanger,
                      usagePct > 75 && usagePct <= 90 && styles.usageBarFillWarn,
                    )}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
                <span className={styles.usageBarValue}>
                  {usage.requestsMonth.toLocaleString()} / {usage.monthlyLimit.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>API keys</h3>
            <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
              {keys?.filter((k) => k.status === 'ACTIVE').length ?? 0} active
            </span>
          </div>
          {keysLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[1, 2, 3].map((n) => <div key={n} className={styles.skeletonCard} />)}
            </div>
          )}
          {!keysLoading && keys && (
            <div className={styles.keyList}>
              {keys.map((key) => <ApiKeyCard key={key.id} apiKey={key} />)}
            </div>
          )}
        </div>

        {usage && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Top endpoints this month</h3>
            <div className={cn(styles.usageCard, styles.endpointList)}>
              {usage.topEndpoints.map((ep) => {
                const max = usage.topEndpoints[0].count
                return (
                  <div key={ep.path} className={styles.endpointRow}>
                    <span className={styles.endpointPath}>{ep.path}</span>
                    <div className={styles.endpointBarTrack}>
                      <div
                        className={styles.endpointBarFill}
                        style={{ width: `${(ep.count / max) * 100}%` }}
                      />
                    </div>
                    <span className={styles.endpointCount}>{ep.count.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Quick reference</h3>
          <div className={styles.docsGrid}>
            {[
              { icon: '📖', title: 'Authentication',  sub: 'Bearer token in Authorization header'      },
              { icon: '🔗', title: 'Base URL',         sub: 'https://api.pinnlo.io/api/v1'              },
              { icon: '📦', title: 'Rate limits',      sub: '100,000 requests / month on Enterprise'   },
              { icon: '🔔', title: 'Webhooks',         sub: 'Subscribe to post, contact and lead events'},
              { icon: '📄', title: 'Pagination',       sub: 'All list endpoints support page + size'    },
              { icon: '🌐', title: 'Versioning',       sub: 'API version pinned in URL: /api/v1/'       },
            ].map(({ icon, title, sub }) => (
              <div key={title} className={styles.docCard}>
                <div className={styles.docIcon}>{icon}</div>
                <div className={styles.docTitle}>{title}</div>
                <div className={styles.docSub}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {showCreate && (
          <CreateKeyModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}

        {newFullKey && (
          <NewKeyReveal fullKey={newFullKey} onClose={() => setNewFullKey(null)} />
        )}

      </div>
    </PlanGate>
  )
}