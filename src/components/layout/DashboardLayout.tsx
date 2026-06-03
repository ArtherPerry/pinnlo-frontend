import { Sidebar }        from './Sidebar'
import { Header }         from './Header'
import { ToastContainer } from '@/components/ui'
import styles from './DashboardLayout.module.css'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
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