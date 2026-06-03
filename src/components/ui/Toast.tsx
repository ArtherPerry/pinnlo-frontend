'use client'

import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import styles from './Toast.module.css'

const ICONS: Record<string, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(styles.toast, styles[toast.type])}
          role="alert"
        >
          <span className={styles.icon} aria-hidden="true">
            {ICONS[toast.type]}
          </span>
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.dismiss}
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}