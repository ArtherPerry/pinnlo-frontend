'use client'

import { useState } from 'react'
import {
  usePortals,
  useCreatePortal,
} from '@/hooks/useCompetitors'
import { useClients } from '@/hooks/useClients'
import { Button } from '@/components/ui'
import { PortalSettingsDrawer } from '@/components/features/PortalSettingsDrawer'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { ReportPortal, PortalStatus } from '@/lib/types'
import styles from './portals.module.css'
import { ReportExporter } from '@/components/features/ReportExporter'

const STATUS_LABEL: Record<PortalStatus, string> = {
  ACTIVE:             'Active',
  INACTIVE:           'Inactive',
  PASSWORD_PROTECTED: 'Password protected',
}

const STATUS_CLASS: Record<PortalStatus, string> = {
  ACTIVE:             styles.statusActive,
  INACTIVE:           styles.statusInactive,
  PASSWORD_PROTECTED: styles.statusProtected,
}

const SECTION_LABELS: Record<string, string> = {
  PAGE_OVERVIEW:    'Overview',
  AUDIENCE_GROWTH:  'Growth',
  POST_PERFORMANCE: 'Posts',
  TOP_POSTS:        'Top posts',
  CUSTOM_MESSAGE:   'Message',
}

function PortalCard({
  portal,
  onSettings,
}: {
  portal:     ReportPortal
  onSettings: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(portal.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.portalCard}>

      {/* Color strip */}
      <div
        className={styles.colorStrip}
        style={{ background: portal.branding.primaryColor }}
      />

      <div className={styles.cardBody}>

        {/* Top row */}
        <div className={styles.cardTop}>
          <div className={styles.cardTopLeft}>
            <span className={styles.clientName}>{portal.clientName}</span>
            <span className={styles.companyName}>{portal.branding.companyName}</span>
          </div>
          <span className={cn(styles.statusBadge, STATUS_CLASS[portal.status])}>
            {STATUS_LABEL[portal.status]}
          </span>
        </div>

        {/* Stats */}
        <div className={styles.cardStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{portal.viewCount}</span>
            <span className={styles.statLabel}>Total views</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {portal.sections.filter((s) => s.enabled).length}
            </span>
            <span className={styles.statLabel}>Sections on</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {portal.lastViewedAt
                ? new Date(portal.lastViewedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
                : 'Never'
              }
            </span>
            <span className={styles.statLabel}>Last viewed</span>
          </div>
        </div>

        {/* Share URL */}
        <div className={styles.shareUrlRow}>
          <span className={styles.shareUrl}>{portal.shareUrl}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>

        {/* Sections */}
        <div className={styles.sectionsList}>
          {portal.sections.map((s) => (
            <span
              key={s.id}
              className={cn(
                styles.sectionChip,
                s.enabled && styles.sectionChipEnabled
              )}
            >
              {SECTION_LABELS[s.type] ?? s.title}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
  <Button
    variant="secondary"
    size="sm"
    full
    onClick={() => onSettings(portal.id)}
  >
    Settings
  </Button>
  <ReportExporter
    clientName={portal.clientName}
    brandColor={portal.branding.primaryColor}
    companyName={portal.branding.companyName}
  />
  <Button
    variant="ghost"
    size="sm"
    full
    onClick={() => window.open(portal.shareUrl, '_blank')}
  >
    Preview ↗
  </Button>
</div>
    </div>
  )
}

export default function PortalsPage() {
  const [showCreate,  setShowCreate ] = useState(false)
  const [activePortal,setActivePortal] = useState<string | null>(null)
  const [creating,    setCreating   ] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>('')

  const { data: portals,  isLoading } = usePortals()
  const { data: clients              } = useClients()
  const createPortal                   = useCreatePortal()
  const toast                          = useToast()

  const handleCreate = async () => {
    if (!selectedClient) {
      toast.show('Select a client workspace first', 'warning')
      return
    }
    setCreating(true)
    try {
      await createPortal.mutateAsync(selectedClient)
      toast.show('Report portal created ✓', 'success')
      setShowCreate(false)
      setSelectedClient('')
    } catch {
      toast.show('Failed to create portal', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
            Report portals
          </h2>
          <p style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
            marginTop: '2px',
          }}>
            White-label reporting pages you can share directly with clients.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + Create portal
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && portals?.length === 0 && (
        <div className={styles.empty}>
          <svg className={styles.emptyIcon} viewBox="0 0 48 48"
               fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="4" width="40" height="40" rx="4"/>
            <path d="M4 12h40"/>
            <path d="M14 12v32"/>
          </svg>
          <div className={styles.emptyTitle}>No report portals yet</div>
          <div className={styles.emptySub}>
            Create a branded report portal for each client — they get a
            shareable link to view their own analytics.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + Create first portal
          </Button>
        </div>
      )}

      {/* Portal grid */}
      {!isLoading && portals && portals.length > 0 && (
        <div className={styles.grid}>
          {portals.map((portal) => (
            <PortalCard
              key={portal.id}
              portal={portal}
              onSettings={(id) => setActivePortal(id)}
            />
          ))}
        </div>
      )}

      {/* Create portal modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 'var(--space-4)',
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              width: '100%', maxWidth: '400px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex', flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600 }}>
              Create report portal
            </h3>
            <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Select the client this portal is for. You can customise
              branding, sections, and access settings after creation.
            </p>

            {/* Client selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--color-ink)' }}>
                Client workspace
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {clients?.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client.id)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${selectedClient === client.id ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
                      background: selectedClient === client.id ? 'var(--color-teal-50)' : 'var(--color-white)',
                      color: selectedClient === client.id ? 'var(--color-teal-600)' : 'var(--color-ink)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-small)',
                      fontWeight: 500,
                      fontFamily: 'var(--font-sans)',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: 'var(--color-teal-500)',
                      flexShrink: 0,
                    }} />
                    {client.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={creating}
                disabled={!selectedClient}
              >
                Create portal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings drawer */}
      {activePortal && (
        <PortalSettingsDrawer
          portalId={activePortal}
          onClose={() => setActivePortal(null)}
        />
      )}

    </div>
  )
}