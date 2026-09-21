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

export function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function actionVariant(action: string): 'success' | 'danger' | 'neutral' | 'info' {
  if (action.startsWith('APPROVE')) return 'success'
  if (action.startsWith('SUSPEND') || action.includes('SUSPENDED')) return 'danger'
  if (action.startsWith('SET_PLAN')) return 'info'
  return 'neutral'
}