import { cn } from '@/lib/utils'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  full?:     boolean
  loading?:  boolean
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  full     = false,
  loading  = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        full && styles.full,
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span
          className={cn(
            styles.spinner,
            variant === 'secondary' || variant === 'ghost'
              ? styles.spinnerDark
              : undefined
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}