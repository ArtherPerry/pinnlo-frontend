import { cn } from '@/lib/utils'
import styles from './Badge.module.css'

type BadgeVariant =
  | 'starter' | 'pro' | 'agency' | 'enterprise'
  | 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'
  | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  variant:   BadgeVariant
  children:  React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], className)}>
      {children}
    </span>
  )
}