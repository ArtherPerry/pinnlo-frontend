'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'


function AvatarCircle({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={{
      width:  size, height: size,
      borderRadius: '50%',
      background: 'var(--color-teal-500)',
      color: 'white',
      fontSize: size * 0.32,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const toast              = useToast()

  const [name,      setName     ] = useState(user?.name    ?? '')
  const [email,     setEmail    ] = useState(user?.email   ?? '')
  const [saving,    setSaving   ] = useState(false)
  const [savingPw,  setSavingPw ] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw    ] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSaveProfile = async () => {
    if (!name.trim())  { toast.show('Name cannot be empty', 'warning');         return }
    if (!email.trim()) { toast.show('Email cannot be empty', 'warning');        return }

    setSaving(true)
    try {
      // Mock save — will call PATCH /api/v1/users/me when backend is ready
      await new Promise((r) => setTimeout(r, 600))
      setUser({ ...user!, name, email })
      toast.show('Profile updated', 'success')
    } catch {
      toast.show('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPw)           { toast.show('Enter your current password', 'warning'); return }
    if (newPw.length < 8)     { toast.show('New password must be at least 8 characters', 'warning'); return }
    if (newPw !== confirmPw)  { toast.show('Passwords do not match', 'warning'); return }

    setSavingPw(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      toast.show('Password changed', 'success')
    } catch {
      toast.show('Failed to change password', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    OWNER:   'Owner',
    MANAGER: 'Manager',
    STAFF:   'Staff',
  }

  const PLAN_LABELS: Record<string, string> = {
    STARTER:    'Starter',
    PRO:        'Pro',
    AGENCY:     'Agency',
    ENTERPRISE: 'Enterprise',
  }

  const sectionCard = {
    background: 'var(--color-white)',
    border: '0.5px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden' as const,
  }

  const sectionHeader = {
    padding: 'var(--space-4) var(--space-5)',
    borderBottom: '0.5px solid var(--color-border)',
    background: 'var(--color-bg)',
    fontWeight: 600,
    fontSize: 'var(--text-h3)',
    color: 'var(--color-ink)',
  }

  const sectionBody = {
    padding: 'var(--space-5)',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 'var(--space-5)', maxWidth: 600,
    }}>

      {/* Page title */}
      <div>
        <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>My profile</h2>
        <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginTop: 2 }}>
          Manage your personal account settings.
        </p>
      </div>

      {/* Identity card */}
      <div style={sectionCard}>
        <div style={sectionHeader}>Account</div>
        <div style={sectionBody}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <AvatarCircle name={name || user?.name || 'U'} size={72} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-h3)', color: 'var(--color-ink)' }}>
                {user?.name}
              </div>
              <div style={{
                fontSize: 'var(--text-small)',
                color: 'var(--color-muted)',
                marginTop: 2,
                display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap',
              }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-warning-light)',
                  color: 'var(--color-warning)',
                  fontWeight: 500,
                  fontSize: 'var(--text-caption)',
                }}>
                  {ROLE_LABELS[user?.role ?? 'STAFF']}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-teal-50)',
                  color: 'var(--color-teal-600)',
                  fontWeight: 500,
                  fontSize: 'var(--text-caption)',
                }}>
                  {PLAN_LABELS[user?.plan ?? 'STARTER']} plan
                </span>
              </div>
              <div style={{
                fontSize: 'var(--text-small)',
                color: 'var(--color-muted)',
                marginTop: 4,
              }}>
                {user?.agencyName}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingTop: 'var(--space-2)',
            borderTop: '0.5px solid var(--color-border)',
          }}>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              loading={saving}
              disabled={name === user?.name && email === user?.email}
            >
              Save profile
            </Button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div style={sectionCard}>
        <div style={sectionHeader}>Change password</div>
        <div style={sectionBody}>
          <Input
            label="Current password"
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="••••••••"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="New password"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              hint={newPw.length > 0 && newPw.length < 8 ? 'Too short' : ''}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              hint={confirmPw && confirmPw !== newPw ? 'Does not match' : ''}
            />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingTop: 'var(--space-2)',
            borderTop: '0.5px solid var(--color-border)',
          }}>
            <Button
              variant="primary"
              onClick={handleChangePassword}
              loading={savingPw}
              disabled={!currentPw || !newPw || !confirmPw}
            >
              Change password
            </Button>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div style={sectionCard}>
        <div style={sectionHeader}>Account info</div>
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            { label: 'User ID',      value: user?.id       ?? '—' },
            { label: 'Agency ID',    value: user?.agencyId ?? '—' },
            { label: 'Role',         value: ROLE_LABELS[user?.role ?? 'STAFF'] },
            { label: 'Plan',         value: PLAN_LABELS[user?.plan ?? 'STARTER'] },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', fontWeight: 500 }}>
                {label}
              </span>
              <span style={{
                fontSize: 'var(--text-small)',
                color: 'var(--color-ink)',
                fontFamily: label.includes('ID') ? 'var(--font-mono)' : 'var(--font-sans)',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{
        background: 'var(--color-danger-light)',
        border: '0.5px solid var(--color-danger)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 'var(--space-4)',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-danger)', marginBottom: 2 }}>
            Delete account
          </div>
          <div style={{ fontSize: 'var(--text-small)', color: 'var(--color-danger)', opacity: 0.8, lineHeight: 1.5 }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete account
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 'var(--space-4)',
          }}
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              maxWidth: 440, width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              Delete your account?
            </h3>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
              This permanently deletes your account and all associated data, and can&apos;t be undone.
              To protect against accidental deletion, our team processes deletions manually — we&apos;ll
              action your request within 2 business days.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <a
                href="mailto:support@pinnalo.com?subject=Account%20deletion%20request"
                style={{
                  fontSize: 'var(--text-small)', fontWeight: 600,
                  color: 'var(--color-danger)', textDecoration: 'none',
                  padding: 'var(--space-2) var(--space-4)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                }}
                onClick={() => setShowDeleteDialog(false)}
              >
                Request deletion
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}