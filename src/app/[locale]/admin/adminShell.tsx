'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import styles from './adminLayout.module.css'

export type AdminSection = 'dashboard' | 'agencies' | 'users' | 'audit'

const NAV_ITEMS: { key: AdminSection; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'agencies',  label: 'Agencies',  icon: '▢' },
  { key: 'users',     label: 'Users',     icon: '◉' },
  { key: 'audit',     label: 'Audit Log', icon: '≡' },
]

const SECTION_TITLES: Record<AdminSection, string> = {
  dashboard: 'Dashboard',
  agencies:  'Agencies',
  users:     'Users',
  audit:     'Audit Log',
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
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !user.platformAdmin) router.replace('/dashboard')
  }, [user, router])

  if (!user) return <div style={{ padding: 24 }}>Loading…</div>
  if (!user.platformAdmin) return <div style={{ padding: 24 }}>Access denied.</div>

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          Pinnalo
          <div className={styles.brandSub}>Admin Console</div>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${section === item.key ? styles.navItemActive : ''}`}
              onClick={() => onSectionChange(item.key)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>{SECTION_TITLES[section]}</div>
          <div className={styles.topbarUser}>
            <span>{user.name}</span>
            <div className={styles.avatar}>{getInitials(user.name)}</div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}