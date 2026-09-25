// Shared formatting helpers for the admin panel sections.

export const PLANS = ['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']

export function statusVariant(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'PENDING') return 'warning'
  if (status === 'APPROVED') return 'success'
  if (status === 'SUSPENDED') return 'danger'
  return 'neutral'
}

export function userStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'PENDING') return 'warning'
  if (status === 'SUSPENDED') return 'danger'
  return 'neutral'
}

const GRANT_UNITS: Record<string, [string, string]> = {
  AI_REVIEW: ['AI review', 'AI reviews'],
  EMAIL_SENT: ['email', 'emails'],
  WHATSAPP_MESSAGE: ['WhatsApp message', 'WhatsApp messages'],
}

const RATE_NAMES: Record<string, string> = {
  AI_SUMMARY: 'AI summary',
  AI_REVIEW: 'AI review',
  EMAIL_SENT: 'email',
  WHATSAPP_MESSAGE: 'WhatsApp message',
}

export function formatAction(action: string): string {
  // SET_COST_RATE_WHATSAPP_MESSAGE reads as "Set WhatsApp message rate".
  const rate = action.match(/^(SET|CANCEL)_COST_RATE_(.+)$/)
  if (rate) {
    const name = RATE_NAMES[rate[2]] ?? rate[2]
    return rate[1] === 'SET' ? `Set ${name} rate` : `Cancelled scheduled ${name} rate`
  }
  // GRANT_WHATSAPP_MESSAGE_+500 reads as "Granted 500 WhatsApp messages".
  // The generic rule below would give "Grant Whatsapp Message +500".
  const grant = action.match(/^GRANT_(.+)_\+(\d+)$/)
  if (grant) {
    const n = Number(grant[2])
    const [one, many] = GRANT_UNITS[grant[1]] ?? [grant[1], grant[1]]
    return `Granted ${n.toLocaleString('en-US')} ${n === 1 ? one : many}`
  }
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function actionVariant(action: string): 'success' | 'danger' | 'neutral' | 'info' {
  if (action.startsWith('APPROVE')) return 'success'
  if (action.startsWith('SUSPEND') || action.includes('SUSPENDED')) return 'danger'
  if (action.startsWith('SET_PLAN') || action.startsWith('GRANT_') || action.startsWith('SET_COST_RATE'))
    return 'info'
  return 'neutral'
}