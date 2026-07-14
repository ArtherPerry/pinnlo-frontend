'use client'

import { Sidebar }        from './Sidebar'
import { Header }         from './Header'
import { ToastContainer } from '@/components/ui'
import { useMobileNav }   from '@/hooks/useMobileNav'
import styles from './DashboardLayout.module.css'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const open = useMobileNav((s) => s.open)
  const close = useMobileNav((s) => s.close)

  return (
    <div className={styles.shell}>
      <Sidebar />
      {open && <div className={styles.overlay} onClick={close} />}
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}