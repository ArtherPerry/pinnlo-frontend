'use client'

import { useState } from 'react'
import {
  usePortal,
  useUpdatePortal,
  useDeletePortal,
  useRegeneratePortalLink,
} from '@/hooks/useCompetitors'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { PortalStatus, PortalSection } from '@/lib/types'
import styles from './PortalSettingsDrawer.module.css'

const STATUS_OPTIONS: { value: PortalStatus; label: string; desc: string }[] = [
  { value: 'ACTIVE',            label: 'Public',    desc: 'Anyone with the link can view' },
  { value: 'PASSWORD_PROTECTED',label: 'Password',  desc: 'Requires a password to access' },
  { value: 'INACTIVE',          label: 'Off',       desc: 'Portal is hidden from clients'  },
]

const PRESET_COLORS = [
  '#1D9E75', '#378ADD', '#7F77DD',
  '#E24B4A', '#EF9F27', '#639922',
  '#D4537E', '#1a1a18',
]

const SECTION_LABELS: Record<string, string> = {
  PAGE_OVERVIEW:    'Page overview',
  AUDIENCE_GROWTH:  'Audience growth',
  POST_PERFORMANCE: 'Post performance',
  TOP_POSTS:        'Top posts',
  CUSTOM_MESSAGE:   'Custom message',
}

interface PortalSettingsDrawerProps {
  portalId: string
  onClose:  () => void
}

export function PortalSettingsDrawer({ portalId, onClose }: PortalSettingsDrawerProps) {
  const { data: portal, isLoading } = usePortal(portalId)
  const updatePortal   = useUpdatePortal(portalId)
  const deletePortal   = useDeletePortal()
  const regenLink      = useRegeneratePortalLink(portalId)
  const toast          = useToast()

  const [copied, setCopied] = useState(false)

  const handleStatusChange = async (status: PortalStatus) => {
    try {
      await updatePortal.mutateAsync({ status })
      toast.show('Portal updated ✓', 'success')
    } catch {
      toast.show('Failed to update portal', 'error')
    }
  }

  const handleColorChange = async (color: string) => {
    try {
      await updatePortal.mutateAsync({
        branding: { ...portal!.branding, primaryColor: color },
      })
      toast.show('Brand color updated ✓', 'success')
    } catch {
      toast.show('Failed to update color', 'error')
    }
  }

  const handleCompanyNameChange = async (companyName: string) => {
    if (!companyName.trim()) return
    try {
      await updatePortal.mutateAsync({
        branding: { ...portal!.branding, companyName },
      })
      toast.show('Company name updated ✓', 'success')
    } catch {
      toast.show('Failed to update', 'error')
    }
  }

  const handleSectionToggle = async (section: PortalSection) => {
    if (!portal) return
    const updated = portal.sections.map((s) =>
      s.id === section.id ? { ...s, enabled: !s.enabled } : s
    )
    try {
      await updatePortal.mutateAsync({ sections: updated })
    } catch {
      toast.show('Failed to update section', 'error')
    }
  }

  const handleCopy = () => {
    if (!portal) return
    navigator.clipboard.writeText(portal.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenLink = async () => {
    if (!confirm('Regenerate link? The old link will stop working immediately.')) return
    try {
      await regenLink.mutateAsync()
      toast.show('New link generated ✓', 'success')
    } catch {
      toast.show('Failed to regenerate link', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete portal for ${portal?.clientName}? This cannot be undone.`)) return
    try {
      await deletePortal.mutateAsync(portalId)
      toast.show('Portal deleted', 'success')
      onClose()
    } catch {
      toast.show('Failed to delete portal', 'error')
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {portal ? `${portal.clientName} — Portal settings` : 'Portal settings'}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', color: 'var(--color-muted)', textAlign: 'center' }}>
            Loading portal...
          </div>
        ) : portal ? (
          <>
            <div className={styles.body}>

              {/* Status */}
              <div className={styles.section}>
                <span className={styles.sectionTitle}>VISIBILITY</span>
                <div className={styles.statusGrid}>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={cn(
                        styles.statusOption,
                        portal.status === opt.value && styles.statusOptionActive
                      )}
                      onClick={() => handleStatusChange(opt.value)}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ fontSize: 'var(--text-caption)', opacity: 0.7 }}>
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Branding */}
              <div className={styles.section}>
                <span className={styles.sectionTitle}>BRANDING</span>

                {/* Company name */}
                <Input
                  label="Company name shown to clients"
                  defaultValue={portal.branding.companyName}
                  onBlur={(e) => handleCompanyNameChange(e.target.value)}
                />

                {/* Brand color */}
                <div>
                  <span style={{
                    fontSize: 'var(--text-small)', fontWeight: 500,
                    color: 'var(--color-ink)', display: 'block',
                    marginBottom: 'var(--space-2)',
                  }}>
                    Brand color
                  </span>
                  <div className={styles.colorRow}>
                    {PRESET_COLORS.map((color) => (
                      <div
                        key={color}
                        className={cn(
                          styles.colorSwatch,
                          portal.branding.primaryColor === color && styles.colorSwatchActive
                        )}
                        style={{ background: color }}
                        onClick={() => handleColorChange(color)}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      className={styles.colorCustom}
                      value={portal.branding.primaryColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      title="Custom color"
                    />
                  </div>
                  <div style={{
                    marginTop: 'var(--space-2)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  }}>
                    <div style={{
                      width: 16, height: 16,
                      borderRadius: 'var(--radius-sm)',
                      background: portal.branding.primaryColor,
                    }} />
                    <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      {portal.branding.primaryColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report sections */}
              <div className={styles.section}>
                <span className={styles.sectionTitle}>REPORT SECTIONS</span>
                {portal.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div key={section.id} className={styles.sectionRow}>
                      <div className={styles.sectionInfo}>
                        <span className={styles.sectionName}>
                          {SECTION_LABELS[section.type] ?? section.title}
                        </span>
                        <span className={styles.sectionType}>{section.type}</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => handleSectionToggle(section)}
                        />
                        <div className={styles.toggleTrack} />
                        <div className={styles.toggleThumb} />
                      </label>
                    </div>
                  ))}
              </div>

              {/* Share link */}
              <div className={styles.section}>
                <span className={styles.sectionTitle}>SHARE LINK</span>
                <div className={styles.shareBox}>
                  <span className={styles.shareUrl}>{portal.shareUrl}</span>
                  <div className={styles.shareActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopy}
                    >
                      {copied ? '✓ Copied' : 'Copy link'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenLink}
                      loading={regenLink.isPending}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
                <p style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--color-muted)',
                  lineHeight: 1.5,
                }}>
                  Viewed {portal.viewCount} times.
                  {portal.lastViewedAt && (
                    <> Last viewed {new Date(portal.lastViewedAt).toLocaleDateString('th-TH')}.</>
                  )}
                </p>
              </div>

              {/* Danger zone */}
              <div className={styles.section}>
                <span className={styles.sectionTitle}>DANGER ZONE</span>
                <div className={styles.dangerBox}>
                  <span className={styles.dangerText}>
                    Deleting this portal immediately revokes the share link.
                    All view history is lost.
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                  >
                    Delete portal
                  </Button>
                </div>
              </div>

            </div>

            <div className={styles.footer}>
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </>
        ) : (
          <div style={{ padding: 'var(--space-8)', color: 'var(--color-muted)', textAlign: 'center' }}>
            Portal not found
          </div>
        )}
      </div>
    </>
  )
}