'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  User,
  Zap,
  Tag,
  Share2,
  Send,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { clearAccessToken } from '@/lib/token'
import api from '@/lib/api'
import styles from './adminLayout.module.css'

export type AdminSection = 'dashboard' | 'agencies' | 'users' | 'usage' | 'costs' | 'connections' | 'publishing' | 'audit'

/**
 * A navigation entry. Entries with no key are sections still to be built:
 * they are shown so the structure is visible, but disabled rather than linked
 * to a page that does not exist yet.
 */
interface NavEntry {
  key: AdminSection | null
  label: string
  icon: LucideIcon
}

const NAV_GROUPS: { label: string; items: NavEntry[] }[] = [
  { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', icon: BarChart3 }] },
  {
    label: 'Customers',
    items: [
      { key: 'agencies', label: 'Agencies', icon: Building2 },
      { key: 'users', label: 'Users', icon: User },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'usage', label: 'Usage', icon: Zap },
      { key: 'costs', label: 'Costs', icon: Tag },
      { key: 'connections', label: 'Connections', icon: Share2 },
      { key: 'publishing', label: 'Publishing', icon: Send },
    ],
  },
  { label: 'Records', items: [{ key: 'audit', label: 'Audit log', icon: FileText }] },
]

const SECTION_TITLES: Record<AdminSection, string> = {
  dashboard: 'Dashboard',
  agencies: 'Agencies',
  users: 'Users',
  usage: 'Usage',
  costs: 'Costs',
  connections: 'Connections',
  publishing: 'Publishing',
  audit: 'Audit log',
}

const SECTION_SUBTITLES: Partial<Record<AdminSection, string>> = {
  dashboard: 'Last 30 days, compared with the 30 before',
  usage: "Each agency's current billing period, closest to a limit first",
  costs: 'What serving agencies costs, and the rates behind it',
  connections: 'Every connected account, checked against Meta, problems first',
  publishing: 'Whether each failed post could already be live, and what is scheduled',
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function AdminShell({
  section,
  onSectionChange,
  children,
}: {
  section: AdminSection
  onSectionChange: (s: AdminSection) => void
  children: React.ReactNode
}) {
  // _hydrated says the auth store has finished reading browser storage.
  // Without it, a null user means both "still loading" and "signed out",
  // and the page waits for ever instead of sending you to sign in.
  const { user, _hydrated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!_hydrated) return
    if (!user) {
      router.replace(`/${locale}/login`)
    } else if (!user.platformAdmin) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [user, _hydrated, pathname, router])

  // Blank rather than a message: a redirect is already under way, and text
  // would flash and disappear.
  if (!_hydrated) {
    return <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />
  }
  if (!user || !user.platformAdmin) return null

  const locale = pathname.split('/')[1] ?? 'en'

  const handleLogout = async () => {
    // Tell the server first so the refresh token is revoked rather than just
    // forgotten, then clear locally whatever it said — a failed call must not
    // trap someone in a session they asked to leave.
    try {
      await api.post('/api/v1/auth/logout')
    } catch {
      // Ignored deliberately.
    }
    clearAccessToken()
    logout()
    router.push(`/${locale}/login`)
  }

  const subtitle = SECTION_SUBTITLES[section]

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Movio</span>
          <span className={styles.brandTag}>Admin</span>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon
                if (item.key === null) {
                  return (
                    <div key={item.label} className={styles.navItemSoon} aria-disabled="true">
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>{item.label}</span>
                      <span className={styles.soonTag}>Soon</span>
                    </div>
                  )
                }
                const active = section === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onSectionChange(item.key as AdminSection)}
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className={styles.userBlock}>
          <div className={styles.avatar}>{getInitials(user.name)}</div>
          <div className={styles.userText}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>Platform admin</span>
          </div>
        </div>

        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          {/* The same inline icon the main app uses, rather than a Lucide name
              that may not exist in this version. */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M10 10l3-3-3-3M13 7H5" />
          </svg>
          <span>Log out</span>
        </button>
      </aside>

      <main className={styles.content}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{SECTION_TITLES[section]}</h1>
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  )
}