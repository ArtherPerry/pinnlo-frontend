import styles from './auth.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.logo}>Pinnalo</div>
        {children}
      </div>
    </div>
  )
}