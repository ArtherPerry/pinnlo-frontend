// Merge class names — like clsx but tiny, no dependency needed
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Format date for display with timezone
export function formatDate(
  date: string | Date,
  locale = 'th-TH',
  options?: Intl.DateTimeFormatOptions
): string {
  const opts: Intl.DateTimeFormatOptions = options ?? {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  }
  return new Intl.DateTimeFormat(locale, opts).format(new Date(date))
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