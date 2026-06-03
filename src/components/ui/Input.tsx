import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:      string
  hint?:       string
  error?:      string
  leftIcon?:   React.ReactNode
  rightIcon?:  React.ReactNode
  required?:   boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, hint, error, leftIcon, rightIcon, required, className, id, ...props },
    ref
  ) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn(styles.wrapper, error && styles.error)}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}

        <div
          className={cn(
  styles.inputWrapper,
  !!leftIcon  && styles.hasLeftIcon,
  !!rightIcon && styles.hasRightIcon
)}
        >
          {leftIcon  && <span className={styles.iconLeft}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(styles.input, className)}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
        </div>

        {error && (
          <span id={`${inputId}-error`} className={styles.errorMsg} role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${inputId}-hint`} className={styles.hint}>
            {hint}
          </span>
        )}
      </div>
    )
  }
)