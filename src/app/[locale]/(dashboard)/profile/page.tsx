'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import styles from './profile.module.css'


function AvatarCircle({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={styles.avatarCircle}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
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

  return (
    <div className={styles.page}>

      {/* Page title */}
      <div>
        <h2 className={styles.pageTitle}>My profile</h2>
        <p className={styles.pageSub}>
          Manage your personal account settings.
        </p>
      </div>

      {/* Identity card */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>Account</div>
        <div className={styles.sectionBody}>

          {/* Avatar + name */}
          <div className={styles.identityRow}>
            <AvatarCircle name={name || user?.name || 'U'} size={72} />
            <div>
              <div className={styles.userName}>
                {user?.name}
              </div>
              <div className={styles.badgesRow}>
                <span className={styles.roleBadge}>
                  {ROLE_LABELS[user?.role ?? 'STAFF']}
                </span>
                <span className={styles.planBadge}>
                  {PLAN_LABELS[user?.plan ?? 'STARTER']} plan
                </span>
              </div>
              <div className={styles.agencyName}>
                {user?.agencyName}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className={styles.fieldGrid}>
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

          <div className={styles.saveRow}>
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
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>Change password</div>
        <div className={styles.sectionBody}>
          <Input
            label="Current password"
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="••••••••"
          />
          <div className={styles.fieldGrid}>
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

          <div className={styles.saveRow}>
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
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>Account info</div>
        <div className={styles.infoBody}>
          {[
            { label: 'User ID',      value: user?.id       ?? '—' },
            { label: 'Agency ID',    value: user?.agencyId ?? '—' },
            { label: 'Role',         value: ROLE_LABELS[user?.role ?? 'STAFF'] },
            { label: 'Plan',         value: PLAN_LABELS[user?.plan ?? 'STARTER'] },
          ].map(({ label, value }) => (
            <div key={label} className={styles.infoRow}>
              <span className={styles.infoLabel}>
                {label}
              </span>
              <span
                className={styles.infoValue}
                style={{ fontFamily: label.includes('ID') ? 'var(--font-mono)' : 'var(--font-sans)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className={styles.dangerZone}>
        <div>
          <div className={styles.dangerTitle}>
            Delete account
          </div>
          <div className={styles.dangerDesc}>
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
          className={styles.dialogOverlay}
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className={styles.dialogBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.dialogTitle}>
              Delete your account?
            </h3>
            <p className={styles.dialogText}>
              This permanently deletes your account and all associated data, and can&apos;t be undone.
              To protect against accidental deletion, our team processes deletions manually — we&apos;ll
              action your request within 2 business days.
            </p>
            <div className={styles.dialogActions}>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <a
                href="mailto:support@pinnalo.com?subject=Account%20deletion%20request"
                className={styles.dialogDangerLink}
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
