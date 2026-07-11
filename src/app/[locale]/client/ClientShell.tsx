'use client'

import styles from './clientLayout.module.css'

export type ClientSection = 'review' | 'calendar' | 'reports'

const NAV_ITEMS: { key: ClientSection; label: string; icon: string }[] = [
  { key: 'review',   label: 'Posts to Review', icon: '✓' },
  { key: 'calendar', label: 'Calendar',        icon: '▦' },
  { key: 'reports',  label: 'Reports',         icon: '▲' },
]

const SECTION_META: Record<ClientSection, { title: string; sub: string }> = {
  review:   { title: 'Posts to Review', sub: 'Approve or request changes to upcoming posts' },
  calendar: { title: 'Content Calendar', sub: 'Your scheduled and planned posts' },
  reports:  { title: 'Reports', sub: 'How your social media is performing' },
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function ClientShell({
  section,
  onSectionChange,
  clientName,
  reviewCount,
  children,
}: {
  section: ClientSection
  onSectionChange: (s: ClientSection) => void
  clientName: string
  reviewCount: number
  children: React.ReactNode
}) {
  const meta = SECTION_META[section]

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <div className={styles.brandMark}>P</div>
            <div>
              <div className={styles.brandName}>Pinnalo</div>
              <div className={styles.brandSub}>Client Portal</div>
            </div>
          </div>
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
              {item.key === 'review' && reviewCount > 0 && (
                <span className={styles.navBadge}>{reviewCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.clientBadge}>
            <div className={styles.clientAvatar}>{getInitials(clientName)}</div>
            <div className={styles.clientMeta}>
              <div className={styles.clientNameText}>{clientName}</div>
              <div className={styles.clientRole}>Client</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <div className={styles.topbarTitle}>{meta.title}</div>
            <div className={styles.topbarSub}>{meta.sub}</div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}