// Merge class names — like clsx but tiny, no dependency needed
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-GB',
  th: 'th-TH-u-ca-gregory',
  my: 'my-MM',
  lo: 'lo-LA',
}

export function formatDate(
  date: string | Date,
  locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const opts: Intl.DateTimeFormatOptions = options ?? {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  }
  const resolved = LOCALE_MAP[locale] ?? locale
  return new Intl.DateTimeFormat(resolved, opts).format(new Date(date))
}

// Format currency by market
export function formatCurrency(
  amount: number,
  currency: 'THB' | 'MMK' | 'LAK' | 'USD' = 'THB'
): string {
  const localeMap = {
    THB: 'th-TH',
    MMK: 'my-MM',
    LAK: 'lo-LA',
    USD: 'en-US',
  }
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Truncate long text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

// Delay — for skeleton loading simulations in dev
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Pull the server's message out of an axios error.
 * The API returns { message: string } for every handled error, so this
 * surfaces the real reason (e.g. "A post in SCHEDULED cannot be edited")
 * instead of a generic failure string.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    const message = response?.data?.message
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }
  return fallback
}
