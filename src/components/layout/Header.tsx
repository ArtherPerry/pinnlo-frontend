'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import styles from './Header.module.css'
import { Menu, Check } from 'lucide-react'
import { useMobileNav } from '@/hooks/useMobileNav'

const LOCALES = [
  { code: 'th', label: 'ภาษาไทย',  flag: '🇹🇭' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'my', label: 'မြန်မာ',    flag: '🇲🇲' },
  { code: 'lo', label: 'ພາສາລາວ',  flag: '🇱🇦' },
]

const MOCK_NOTIFICATIONS = [
  {
    id:      'n-001',
    type:    'approval',
    title:   'Post needs approval',
    body:    'Korn T. submitted a Facebook post for Somjai Coffee.',
    time:    '5m ago',
    read:    false,
    href:    '/posts/approval',
    icon:    '📋',
  },
  {
    id:      'n-002',
    type:    'lead',
    title:   'New lead captured',
    body:    'Sirinda Rattanapruk messaged Mango Resort via Messenger.',
    time:    '23m ago',
    read:    false,
    href:    '/crm',
    icon:    '👤',
  },
  {
    id:      'n-003',
    type:    'post',
    title:   'Post published',
    body:    'Weekend promotion post went live on Somjai Coffee Facebook.',
    time:    '2h ago',
    read:    false,
    href:    '/posts',
    icon:    '✅',
  },
  {
    id:      'n-004',
    type:    'failed',
    title:   'Post failed to publish',
    body:    'BKK Fitness Instagram token has expired. Reconnect in Settings.',
    time:    '3h ago',
    read:    true,
    href:    '/settings',
    icon:    '⚠️',
  },
  {
    id:      'n-005',
    type:    'broadcast',
    title:   'Broadcast sent',
    body:    'Weekend promotion campaign delivered to 138 contacts.',
    time:    '1d ago',
    read:    true,
    href:    '/broadcasts',
    icon:    '📣',
  },
]

// ── Language switcher ──────────────────────────────────────────────
function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const router          = useRouter()
  const pathname        = usePathname()
  const ref             = useRef<HTMLDivElement>(null)

  const segments    = pathname.split('/')
  const currentCode = segments[1] || 'th'
  const current     = LOCALES.find((l) => l.code === currentCode) ?? LOCALES[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSwitch = (code: string) => {
    const newSegments = [...segments]
    newSegments[1] = code
    router.replace(newSegments.join('/'))
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 32, padding: '0 10px',
          borderRadius: 'var(--radius-md)',
          border: '0.5px solid var(--color-border)',
          background: open ? 'var(--color-bg-2)' : 'transparent',
          color: 'var(--color-muted)',
          fontSize: 'var(--text-small)', fontWeight: 500,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          transition: 'all var(--transition-fast)',
        }}
      >
        <span style={{ fontSize: 14 }}>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--color-white)',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden', minWidth: 160, zIndex: 200,
        }}>
          {LOCALES.map((locale) => {
            const isActive = locale.code === currentCode
            return (
              <button
                key={locale.code}
                onClick={() => handleSwitch(locale.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px',
                  border: 'none',
                  background: isActive ? 'var(--color-teal-50)' : 'transparent',
                  color: isActive ? 'var(--color-teal-600)' : 'var(--color-ink)',
                  fontSize: 'var(--text-small)',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{locale.flag}</span>
                <div>
                  <div>{locale.label}</div>
                  <div style={{
                    fontSize: 11,
                    color: isActive ? 'var(--color-teal-500)' : 'var(--color-muted)',
                  }}>
                    {locale.code.toUpperCase()}
                  </div>
                </div>
                {isActive && (
                  <span style={{
                    marginLeft: 'auto', color: 'var(--color-teal-500)',
                    display: 'inline-flex',
                  }}>
                    <Check size={14} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Notification center ────────────────────────────────────────────
function NotificationCenter() {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [hoveredId, setHoveredId]         = useState<string | null>(null)
  const ref    = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleClick = (n: typeof MOCK_NOTIFICATIONS[0]) => {
    markRead(n.id)
    router.push(`/${locale}${n.href}`)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={styles.iconBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{
          background: open ? 'var(--color-bg-2)' : 'transparent',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path d="M9 2a5 5 0 015 5v3l1.5 2H2.5L4 10V7a5 5 0 015-5z"/>
          <path d="M7 14a2 2 0 004 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className={styles.bellBadge}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--color-white)',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          width: 340, zIndex: 200,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '0.5px solid var(--color-border)',
            background: 'var(--color-bg)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--color-ink)' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8,
                  fontSize: 'var(--text-caption)',
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-teal-500)',
                  color: 'white',
                  fontWeight: 600,
                }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--color-teal-600)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: 12, width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '0.5px solid var(--color-border)',
                  background: hoveredId === n.id
                    ? 'var(--color-bg)'
                    : n.read ? 'transparent' : 'var(--color-teal-50)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--text-small)',
                    fontWeight: n.read ? 400 : 600,
                    color: 'var(--color-ink)',
                    marginBottom: 2,
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--color-muted)',
                    lineHeight: 1.5,
                  }}>
                    {n.body}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--color-muted-light)',
                    marginTop: 4,
                  }}>
                    {n.time}
                  </div>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-teal-500)',
                    flexShrink: 0, marginTop: 4,
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            textAlign: 'center',
            borderTop: '0.5px solid var(--color-border)',
            background: 'var(--color-bg)',
          }}>
            <button
              onClick={() => { router.push(`/${locale}/notifications`); setOpen(false) }}
              style={{
                fontSize: 'var(--text-small)',
                color: 'var(--color-teal-600)',
                border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontWeight: 500,
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main header ────────────────────────────────────────────────────
export function Header() {
  const pathname = usePathname()
  const segment  = pathname.split('/')[2] ?? 'dashboard'
  const title    = segment.charAt(0).toUpperCase() + segment.slice(1)
  const toggleMobileNav = useMobileNav((s) => s.toggle)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={toggleMobileNav} aria-label="Menu">
          <Menu size={22} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.right}>
        <LanguageSwitcher />
        <NotificationCenter />
      </div>
    </header>
  )
}