import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

/** FAILED means something has already broken; WARNING means it is about to. */
export type Severity = 'FAILED' | 'WARNING'

export type AttentionType =
  | 'PUBLISH_FAILED'
  | 'NEAR_LIMIT'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_WARNING'
  | 'PENDING_APPROVAL'

export interface AttentionGroup {
  type: AttentionType
  severity: Severity
  count: number
  items: Record<string, string | number | string[]>[]
}

export interface Figure {
  key: 'activeAgencies' | 'clientWorkspaces' | 'postsPublished' | 'estimatedCost'
  value: number
  previous: number
  series: number[]
}

export interface CostPoint {
  date: string
  cost: number
}

export interface ChannelCost {
  metric: 'AI_REVIEW' | 'EMAIL_SENT' | 'WHATSAPP_MESSAGE'
  units: number
  cost: number
  share: number
}

export interface AdminDashboard {
  checkedAt: string
  attention: AttentionGroup[]
  figures: Figure[]
  costTrend: CostPoint[]
  costByChannel: ChannelCost[]
  plans: Record<string, number>
}

/**
 * The admin dashboard. Refreshes every minute so the attention list stays
 * current while the page is left open.
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async (): Promise<AdminDashboard> => {
      const { data } = await api.get('/api/v1/admin/dashboard')
      return data
    },
    refetchInterval: 60_000,
  })
}