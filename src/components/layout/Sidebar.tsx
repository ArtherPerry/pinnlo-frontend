'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import styles from './Sidebar.module.css'

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="11" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="11" width="6" height="6" rx="1.5"/>
      <rect x="11" y="11" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  posts: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="16" height="16" rx="2"/>
      <path d="M4 6h10M4 9h7M4 12h5"/>
    </svg>
  ),
  approval: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 7.5V5a2 2 0 00-2-2H4a2 2 0 00-2 2v9a2 2 0 002 2h4"/>
      <path d="M10 14l2 2 4-4"/>
    </svg>
  ),
  crm: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="6" r="3"/>
      <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
    </svg>
  ),
  inbox: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h14a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V4a1 1 0 011-1z"/>
    </svg>
  ),
  templates: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="14" height="14" rx="2"/>
      <path d="M5 6h8M5 9h6M5 12h4"/>
    </svg>
  ),
  broadcasts: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9h12M3 5l12 4-12 4"/>
      <circle cx="14" cy="9" r="2"/>
    </svg>
  ),
  emails: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="16" height="11" rx="2"/>
      <path d="M1 7l8 5 8-5"/>
    </svg>
  ),
  flows: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="4" rx="1"/>
      <rect x="11" y="7" width="6" height="4" rx="1"/>
      <rect x="1" y="13" width="6" height="4" rx="1"/>
      <path d="M7 3h2a2 2 0 012 2v4"/>
      <path d="M7 15h2a2 2 0 002-2V9"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 13l4-4 4 3 4-6 4 3"/>
      <path d="M1 17h16"/>
    </svg>
  ),
  competitors: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="9" r="4"/>
      <circle cx="12" cy="9" r="4"/>
    </svg>
  ),
  benchmarks: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 14l4-4 3 3 4-5 3 3"/>
      <path d="M2 17h14"/>
    </svg>
  ),
  portals: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="16" height="12" rx="2"/>
      <path d="M1 7h16"/>
      <path d="M5 7v8"/>
    </svg>
  ),
  listening: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="3"/>
      <path d="M9 1a8 8 0 010 16M9 3a6 6 0 010 12M9 5a4 4 0 010 8"/>
    </svg>
  ),
  influencers: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 2l1.8 3.6L15 6.3l-3 2.9.7 4.1L9 11.3l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/>
    </svg>
  ),
  developer: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 6l-3 3 3 3M13 6l3 3-3 3M10 4l-2 10"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="2.5"/>
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M3.1 14.9l1.4-1.4M13.5 4.5l1.4-1.4"/>
    </svg>
  ),
}

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { key: 'dashboard', href: '/dashboard', icon: Icons.dashboard, exact: true },
      { key: 'clients',   href: '/clients',   icon: Icons.crm, exact: true },
    ],
  },
  {
    label: 'intelligence',
    items: [
      { key: 'competitors', href: '/competitors', icon: Icons.competitors },
      { key: 'benchmarks',  href: '/benchmarks',  icon: Icons.benchmarks },
      { key: 'analytics',   href: '/analytics',   icon: Icons.analytics },
    ],
  },
  {
    label: 'content',
    items: [
      { key: 'posts',     href: '/posts',          icon: Icons.posts, exact: true },
      { key: 'approval',  href: '/posts/approval', icon: Icons.approval },
      { key: 'templates', href: '/templates',      icon: Icons.templates },
    ],
  },
  {
    label: 'audience',
    items: [
      { key: 'crm',        href: '/crm',        icon: Icons.crm },
      { key: 'inbox',      href: '/inbox',      icon: Icons.inbox },
      { key: 'broadcasts', href: '/broadcasts', icon: Icons.broadcasts },
      { key: 'emails',     href: '/emails',     icon: Icons.emails },
      { key: 'flows',      href: '/flows',      icon: Icons.flows },
    ],
  },
  {
    label: 'more',
    items: [
      { key: 'portals',     href: '/portals',     icon: Icons.portals },
      { key: 'listening',   href: '/listening',   icon: Icons.listening },
      { key: 'influencers', href: '/influencers', icon: Icons.influencers },
      { key: 'developer',   href: '/developer',   icon: Icons.developer },
    ],
  },
  {
    label: null,
    items: [
      { key: 'settings', href: '/settings', icon: Icons.settings },
    ],
  },
]

export function Sidebar() {
  const t        = useTranslations('nav')
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuth()

  const locale = pathname.split('/')[1] || 'th'

  // ← This was the missing function
  const handleLogout = () => {
   
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pinnlo-token')
      window.__mswStarted = false
    }
     logout()
    router.push(`/${locale}/login`)
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoMark}>Pinnlo</span>
        <span className={styles.logoSub}>v2</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={styles.navGroup}>
            {group.label && (
              <div className={styles.navGroupLabel}>{t(group.label)}</div>
            )}
            {group.items.map(({ key, href, icon, exact }) => {
              const fullHref = `/${locale}${href}`
              const isActive = exact
                ? pathname === fullHref
                : pathname.startsWith(fullHref)
              return (
                <Link
                  key={key}
                  href={fullHref}
                  className={cn(styles.navItem, isActive && styles.active)}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  <span className={styles.navLabel}>{t(key)}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className={styles.bottom}>
  <Link href={`/${locale}/profile`} className={cn(styles.userRow, styles.profileLink)}>
    <div className={styles.avatar}>
      {user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ?? 'P'
      }
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div className={styles.userName}>{user?.name ?? '—'}</div>
      <div className={styles.userRole}>{user?.role ?? ''}</div>
    </div>
  </Link>

  <button onClick={handleLogout} className={styles.logoutBtn}>
    <svg width="14" height="14" viewBox="0 0 14 14"
         fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M10 10l3-3-3-3M13 7H5"/>
    </svg>
    Log out
  </button>
</div>
    </aside>
  )
}