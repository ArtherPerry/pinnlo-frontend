'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role, Plan, Platform } from '@/lib/types'
import styles from './settings.module.css'

type Tab = 'agency' | 'team' | 'platforms' | 'notifications' | 'billing'

interface AgencySettings {
  id:        string
  name:      string
  email:     string
  phone:     string
  website:   string
  timezone:  string
  language:  string
  plan:      Plan
  createdAt: string
}

interface TeamMember {
  id:           string
  name:         string
  email:        string
  role:         Role
  status:       'ACTIVE' | 'PENDING'
  joinedAt:     string | null
  lastActiveAt: string | null
}

interface PlatformSetting {
  id:              string
  type:            Platform
  name:            string
  pageId:          string
  status:          'CONNECTED' | 'TOKEN_EXPIRED' | 'DISCONNECTED'
  tokenExpiresAt:  string | null
  connectedAt:     string
}

type NotificationSettings = Record<string, boolean> & {
  emailDigestFrequency?: string
}

// ── Hooks ──────────────────────────────────────────────────────────
function useAgencySettings() {
  return useQuery({
    queryKey: ['settings', 'agency'],
    queryFn:  async () => {
      const { data } = await api.get<AgencySettings>('/api/settings/agency')
      return data
    },
  })
}

function useTeamSettings() {
  return useQuery({
    queryKey: ['settings', 'team'],
    queryFn:  async () => {
      const { data } = await api.get<TeamMember[]>('/api/settings/team')
      return data
    },
  })
}

function usePlatformSettings() {
  return useQuery({
    queryKey: ['settings', 'platforms'],
    queryFn:  async () => {
      const { data } = await api.get<PlatformSetting[]>('/api/settings/platforms')
      return data
    },
  })
}

function useNotificationSettings() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn:  async () => {
      const { data } = await api.get<NotificationSettings>('/api/settings/notifications')
      return data
    },
  })
}

// ── Agency tab ─────────────────────────────────────────────────────
function AgencyTab() {
  const { data: agency, isLoading } = useAgencySettings()
  const qc    = useQueryClient()
  const toast = useToast()

  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm({
    values: agency,
  })

  const onSubmit = async (values: AgencySettings) => {
    try {
      await api.patch('/api/settings/agency', values)
      qc.setQueryData(['settings', 'agency'], values)
      toast.show('Agency settings saved', 'success')
    } catch {
      toast.show('Failed to save settings', 'error')
    }
  }

  if (isLoading) return (
    <div className={styles.loadingState}>
      Loading...
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.cardBody}>
        <div className={styles.formRow}>
          <Input label="Agency name"    {...register('name')}    defaultValue={agency?.name}    />
          <Input label="Email address"  {...register('email')}   defaultValue={agency?.email}   type="email" />
        </div>
        <div className={styles.formRow}>
          <Input label="Phone number"   {...register('phone')}   defaultValue={agency?.phone}   type="tel" />
          <Input label="Website"        {...register('website')} defaultValue={agency?.website} type="url" />
        </div>
        <div className={styles.formRow}>
          <div>
            <span className={styles.fieldLabel}>
              Timezone
            </span>
            <select
              className={styles.fieldSelect}
              {...register('timezone')}
              defaultValue={agency?.timezone}
            >
              <option value="Asia/Bangkok">ICT — Bangkok (UTC+7)</option>
              <option value="Asia/Rangoon">MMT — Yangon (UTC+6:30)</option>
              <option value="Asia/Vientiane">ICT — Vientiane (UTC+7)</option>
            </select>
          </div>
          <div>
            <span className={styles.fieldLabel}>
              Default language
            </span>
            <select
              className={styles.fieldSelect}
              {...register('language')}
              defaultValue={agency?.language}
            >
              <option value="th">Thai (ภาษาไทย)</option>
              <option value="en">English</option>
              <option value="my">Burmese (မြန်မာ)</option>
              <option value="lo">Lao (ພາສາລາວ)</option>
            </select>
          </div>
        </div>
        <div className={styles.saveRow}>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  )
}

// ── Team tab ───────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  OWNER:   'Owner',
  MANAGER: 'Manager',
  STAFF:   'Staff',
}

const ROLE_CLASS: Record<string, string> = {
  OWNER:   styles.roleOwner,
  MANAGER: styles.roleManager,
  STAFF:   styles.roleStaff,
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email,       setEmail      ] = useState('')
  const [role,        setRole       ] = useState('STAFF')
  const [isSubmitting,setIsSubmitting] = useState(false)
  const qc    = useQueryClient()
  const toast = useToast()

  const handleInvite = async () => {
  if (!email.trim()) { toast.show('Enter an email address', 'warning'); return }
  setIsSubmitting(true)
  try {
    const { data } = await api.post('/api/settings/team/invite', { email, role })
    qc.invalidateQueries({ queryKey: ['settings', 'team'] })
    toast.show(
      `Member added. Temporary password: ${data.tempPassword}`,
      'success'
    )
    onClose()
  } catch {
    toast.show('Failed to add member', 'error')
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Invite team member</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@agency.co.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <span className={styles.sectionLabel}>Role</span>
            <div className={styles.roleGrid}>
              {['MANAGER', 'STAFF'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={cn(styles.roleOption, role === r && styles.roleOptionActive)}
                  onClick={() => setRole(r)}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            <p className={styles.roleHint}>
              {role === 'MANAGER'
                ? 'Can manage all content, clients and staff. Cannot manage billing.'
                : 'Can create and submit posts. Cannot manage clients or billing.'
              }
            </p>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleInvite} loading={isSubmitting}>
            Send invitation
          </Button>
        </div>
      </div>
    </div>
  )
}

function TeamTab() {
  const { data: team, isLoading } = useTeamSettings()
  const [showInvite, setShowInvite] = useState(false)
  const qc     = useQueryClient()
  const toast  = useToast()
  const locale = useLocale()

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return
    try {
      await api.delete(`/api/settings/team/${id}`)
      qc.setQueryData(['settings', 'team'], (old?: TeamMember[]) =>
        old?.filter((m) => m.id !== id) ?? []
      )
      toast.show('Team member removed', 'success')
    } catch {
      toast.show('Failed to remove member', 'error')
    }
  }

  if (isLoading) return (
    <div className={styles.loadingState}>
      Loading...
    </div>
  )

  return (
    <>
      <table className={styles.teamTable}>
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {team?.map((member) => {
            const initials = member.name !== 'Invite pending'
              ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              : '?'
            const isPending = member.status === 'PENDING'

            return (
              <tr key={member.id}>
                <td>
                  <div className={styles.memberInfo}>
                    <div className={cn(
                      styles.memberAvatar,
                      isPending && styles.memberAvatarPending
                    )}>
                      {initials}
                    </div>
                    <div>
                      <div className={styles.memberName}>{member.name}</div>
                      <div className={styles.memberEmail}>{member.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={cn(styles.roleBadge, ROLE_CLASS[member.role])}>
                    {ROLE_LABELS[member.role]}
                  </span>
                </td>
                <td>
                  <span className={cn(
                    styles.statusBadge,
                    isPending ? styles.statusPending : styles.statusActive
                  )}>
                    {isPending ? 'Pending' : 'Active'}
                  </span>
                </td>
                <td className={styles.mutedCell}>
                  {member.lastActiveAt
                    ? formatDate(member.lastActiveAt, locale, { dateStyle: 'medium' })
                    : '—'
                  }
                </td>
                <td>
                  {member.role !== 'OWNER' && (
                    <button
                      className={cn(styles.actionBtn, styles.actionBtnDanger)}
                      onClick={() => handleRemove(member.id, member.name)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className={styles.tabFooter}>
        <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>
          + Invite team member
        </Button>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  )
}

// ── Platforms tab ──────────────────────────────────────────────────
const PLATFORM_STATUS_LABELS: Record<string, string> = {
  CONNECTED:     'Connected',
  TOKEN_EXPIRED: 'Token expired',
  DISCONNECTED:  'Disconnected',
}

function PlatformsTab() {
  const { data: platforms, isLoading } = usePlatformSettings()
  const qc     = useQueryClient()
  const toast  = useToast()
  const locale = useLocale()

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`Disconnect "${name}"? Posts will stop publishing to this platform.`)) return
    try {
      await api.delete(`/api/settings/platforms/${id}`)
      qc.setQueryData(['settings', 'platforms'], (old?: PlatformSetting[]) =>
        old?.filter((p) => p.id !== id) ?? []
      )
      toast.show('Platform disconnected', 'success')
    } catch {
      toast.show('Failed to disconnect platform', 'error')
    }
  }

  const handleReconnect = async (id: string) => {
    try {
      await api.post(`/api/settings/platforms/${id}/reconnect`)
      toast.show('Reconnection initiated — follow the OAuth flow', 'info')
    } catch {
      toast.show('Failed to reconnect', 'error')
    }
  }

  if (isLoading) return (
    <div className={styles.loadingState}>
      Loading...
    </div>
  )

  return (
    <div className={styles.cardBody}>
      <div className={styles.platformList}>
        {platforms?.map((platform) => {
          const isExpired = platform.status === 'TOKEN_EXPIRED'
          return (
            <div
              key={platform.id}
              className={cn(styles.platformRow, isExpired && styles.platformRowExpired)}
            >
              <PlatformIcon platform={platform.type} size={20} />
              <div className={styles.platformInfo}>
                <div className={styles.platformName}>{platform.name}</div>
                <div className={styles.platformMeta}>
                  {PLATFORM_STATUS_LABELS[platform.status]}
                  {platform.tokenExpiresAt && !isExpired && (
                    <> · Token expires {formatDate(platform.tokenExpiresAt, locale, { dateStyle: 'medium' })}</>
                  )}
                  {isExpired && (
                    <span className={styles.expiredNote}>
                      {' '}· Expired — reconnect to resume publishing
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.platformActions}>
                {isExpired && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReconnect(platform.id)}
                  >
                    Reconnect
                  </Button>
                )}
                <button
                  className={cn(styles.actionBtn, styles.actionBtnDanger)}
                  onClick={() => handleDisconnect(platform.id, platform.name)}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.infoBox}>
        ℹ To connect a new platform, go to the client workspace settings and use the
        &quot;Connect platform&quot; button. Platforms are connected per client, not agency-wide.
      </div>
    </div>
  )
}

// ── Notifications tab ──────────────────────────────────────────────
function NotificationsTab() {
  const { data: notifs, isLoading } = useNotificationSettings()
  const [local, setLocal] = useState<Record<string, boolean>>({})
  const toast = useToast()

  const getValue = (key: string) =>
    key in local ? local[key] : notifs?.[key] ?? false

  const handleToggle = async (key: string) => {
    const next = !getValue(key)
    setLocal((prev) => ({ ...prev, [key]: next }))
    try {
      await api.patch('/api/settings/notifications', { [key]: next })
      toast.show('Notification settings saved', 'success')
    } catch {
      toast.show('Failed to save', 'error')
      setLocal((prev) => ({ ...prev, [key]: !next }))
    }
  }

  const notifItems = [
    { key: 'emailOnNewLead',        title: 'New lead captured',    sub: 'When a contact is auto-captured via Messenger or WhatsApp' },
    { key: 'emailOnPostFailed',     title: 'Post publish failed',  sub: 'When a scheduled post fails to publish to any platform'    },
    { key: 'emailOnApprovalNeeded', title: 'Approval requested',   sub: 'When a staff member submits a post for your review'         },
    { key: 'inAppNewLead',          title: 'In-app lead alerts',   sub: 'Show badge on CRM nav when new leads arrive'                },
    { key: 'inAppPostPublished',    title: 'Post published',       sub: 'In-app notification when posts go live'                     },
    { key: 'inAppApproval',         title: 'Approval notifications', sub: 'In-app badge on approval queue nav item'                 },
  ]

  if (isLoading) return (
    <div className={styles.loadingState}>
      Loading...
    </div>
  )

  return (
    <div className={styles.cardBody}>
      {notifItems.map((item) => (
        <div key={item.key} className={styles.notifRow}>
          <div className={styles.notifLeft}>
            <span className={styles.notifTitle}>{item.title}</span>
            <span className={styles.notifSub}>{item.sub}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={getValue(item.key)}
              onChange={() => handleToggle(item.key)}
            />
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </label>
        </div>
      ))}
    </div>
  )
}

// ── Billing tab ────────────────────────────────────────────────────
function BillingTab() {
  const { user } = useAuth()
  const toast    = useToast()

  const PLAN_NAMES: Record<string, string> = {
    STARTER:    'Starter',
    PRO:        'Pro',
    AGENCY:     'Agency',
    ENTERPRISE: 'Enterprise',
  }

  const PLAN_PRICES: Record<string, string> = {
    STARTER:    '฿590 / month',
    PRO:        '฿1,490 / month',
    AGENCY:     '฿3,490 / month',
    ENTERPRISE: 'Custom pricing',
  }

  return (
    <div className={styles.cardBody}>

      {/* Current plan */}
      <div className={styles.planCard}>
        <div className={styles.planInfo}>
          <span className={styles.planName}>
            {PLAN_NAMES[user?.plan ?? 'STARTER']} plan
          </span>
          <span className={styles.planMeta}>
            {PLAN_PRICES[user?.plan ?? 'STARTER']} ·
            Renews on 1 July 2026
          </span>
        </div>
        <Button variant="secondary" onClick={() => toast.show('Opening billing portal...', 'info')}>
          Manage billing
        </Button>
      </div>

      {/* Plan comparison hint */}
      <div className={styles.infoBox}>
        <strong className={styles.infoBoxStrong}>
          Want to upgrade or downgrade?
        </strong>
        <br />
        Upgrades take effect immediately with prorated billing.
        Downgrades take effect at the start of the next billing cycle.
        Contact support for Enterprise pricing.
      </div>

      {/* Plan options */}
      {(['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE'] as const).map((plan) => {
        const isCurrent = user?.plan === plan
        return (
          <div
            key={plan}
            className={styles.planOptionRow}
            style={{
              border: `1px solid ${isCurrent ? 'var(--color-teal-500)' : 'var(--color-border)'}`,
              background: isCurrent ? 'var(--color-teal-50)' : 'var(--color-white)',
            }}
          >
            <div>
              <div className={styles.planOptionName} style={{ color: isCurrent ? 'var(--color-teal-700)' : 'var(--color-ink)' }}>
                {PLAN_NAMES[plan]}
                {isCurrent && (
                  <span className={styles.currentBadge}>
                    Current
                  </span>
                )}
              </div>
              <div className={styles.planOptionPrice}>
                {PLAN_PRICES[plan]}
              </div>
            </div>
            {!isCurrent && (
              <Button
                variant={plan === 'ENTERPRISE' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => toast.show(`Contact us to switch to ${PLAN_NAMES[plan]}`, 'info')}
              >
                {plan === 'ENTERPRISE' ? 'Contact sales' : 'Switch plan'}
              </Button>
            )}
          </div>
        )
      })}

      {/* Danger zone */}
      <div className={styles.dangerZone}>
        <span className={styles.dangerText}>
          Cancel your subscription. Your account will remain active until the end
          of the current billing period, then be downgraded to Starter.
        </span>
        <Button
          variant="danger"
          size="sm"
          onClick={() => toast.show('Please contact support to cancel', 'warning')}
        >
          Cancel plan
        </Button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
const TABS: { key: Tab; label: string }[] = [
  { key: 'agency',        label: 'Agency'        },
  { key: 'team',          label: 'Team'          },
  { key: 'platforms',     label: 'Platforms'     },
  { key: 'notifications', label: 'Notifications' },
  { key: 'billing',       label: 'Billing'       },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('agency')

  const TAB_TITLES: Record<Tab, string> = {
    agency:        'Agency settings',
    team:          'Team members',
    platforms:     'Connected platforms',
    notifications: 'Notification preferences',
    billing:       'Plan & billing',
  }

  return (
    <div className={styles.page}>

      <div>
        <h2 className={styles.pageTitle}>Settings</h2>
        <p className={styles.pageSub}>
          Manage your agency, team, and account preferences.
        </p>
      </div>

      {/* Tab nav */}
      <div className={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(styles.tabBtn, activeTab === tab.key && styles.tabBtnActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{TAB_TITLES[activeTab]}</span>
        </div>

        {activeTab === 'agency'        && <AgencyTab />}
        {activeTab === 'team'          && <TeamTab />}
        {activeTab === 'platforms'     && <PlatformsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'billing'       && <BillingTab />}
      </div>

    </div>
  )
}