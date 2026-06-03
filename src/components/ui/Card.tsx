import { cn } from '@/lib/utils'
import styles from './Card.module.css'

type CardVariant = 'default' | 'muted' | 'tinted' | 'warning' | 'danger'

interface CardProps {
  variant?:   CardVariant
  clickable?: boolean
  className?: string
  children:   React.ReactNode
  onClick?:   () => void
}

export function Card({
  variant   = 'default',
  clickable = false,
  className,
  children,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        styles[variant],
        clickable && styles.clickable,
        className
      )}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  )
}

Card.Header   = function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(styles.header, className)}>{children}</div>
}

Card.Title    = function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className={styles.title}>{children}</div>
}

Card.Subtitle = function CardSubtitle({ children }: { children: React.ReactNode }) {
  return <div className={styles.subtitle}>{children}</div>
}

Card.Body     = function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(styles.body, className)}>{children}</div>
}

Card.Footer   = function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(styles.footer, className)}>{children}</div>
}