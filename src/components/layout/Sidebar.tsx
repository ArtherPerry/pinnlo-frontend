'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import styles from './Sidebar.module.css'
import {
  LayoutDashboard, Building2, FileText, CheckCircle, Users,
  MessageSquare, LayoutTemplate, Send, Mail, Workflow,
  TrendingUp, Eye, BarChart3, LayoutGrid, Radio, Star,
  Code2, Settings,
} from 'lucide-react'

const ICON_SIZE = 18

const Icons = {
  dashboard:   <LayoutDashboard size={ICON_SIZE} />,
  clients:     <Building2 size={ICON_SIZE} />,
  posts:       <FileText size={ICON_SIZE} />,
  approval:    <CheckCircle size={ICON_SIZE} />,
  crm:         <Users size={ICON_SIZE} />,
  inbox:       <MessageSquare size={ICON_SIZE} />,
  templates:   <LayoutTemplate size={ICON_SIZE} />,
  broadcasts:  <Send size={ICON_SIZE} />,
  emails:      <Mail size={ICON_SIZE} />,
  flows:       <Workflow size={ICON_SIZE} />,
  analytics:   <TrendingUp size={ICON_SIZE} />,
  competitors: <Eye size={ICON_SIZE} />,
  benchmarks:  <BarChart3 size={ICON_SIZE} />,
  portals:     <LayoutGrid size={ICON_SIZE} />,
  listening:   <Radio size={ICON_SIZE} />,
  influencers: <Star size={ICON_SIZE} />,
  developer:   <Code2 size={ICON_SIZE} />,
  settings:    <Settings size={ICON_SIZE} />,
}

type NavItem = {
  key: string
  href: string
  icon: JSX.Element
  exact?: boolean
}

type NavGroup = {
  label: string | null
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
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
        <span className={styles.logoMark}>Pinnalo</span>
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