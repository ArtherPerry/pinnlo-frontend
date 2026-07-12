'use client'

import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import styles from './Toast.module.css'
import { CheckCircle, XCircle, AlertTriangle, Info, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(styles.toast, styles[toast.type])}
            role="alert"
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon size={16} />
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
        )
      })}
    </div>
  )
}