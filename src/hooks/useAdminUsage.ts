import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type UsageMetricKey = 'AI_REVIEW' | 'EMAIL_SENT' | 'WHATSAPP_MESSAGE'

export interface MetricUsage {
  metric: UsageMetricKey
  used: number
  /** False when the plan does not include this at all. */
  included: boolean
  /** True for plans with no cap; limit is then null. */
  unlimited: boolean
  /** Plan allowance plus any extra granted this period. */
  limit: number | null
  extraAllowance: number
  periodStart: string
  periodEnd: string
}

export interface AgencyUsage {
  agencyId: string
  agencyName: string
  plan: string
  status: string
  periodStart?: string
  /** The day the next period starts — when usage resets. */
  periodEnd?: string
  metrics: MetricUsage[]
}

/** Current-period usage for every agency, in one request. */
export function useAllUsage() {
  return useQuery({
    queryKey: ['admin', 'usage'],
    queryFn: async (): Promise<AgencyUsage[]> => {
      const { data } = await api.get('/api/v1/admin/usage')
      return data
    },
  })
}

/**
 * Grants extra allowance for the current period only. Invalidates every
 * admin query: a grant changes usage, can clear a dashboard alert, and
 * writes an audit entry.
 */
export function useGrantUsage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      agencyId: string
      metric: UsageMetricKey
      amount: number
      /** Invoice number, transfer reference, or reason. Optional. */
      reference?: string
    }) => {
      const { data } = await api.post(`/api/v1/admin/agencies/${input.agencyId}/usage/grant`, {
        metric: input.metric,
        amount: input.amount,
        reference: input.reference?.trim() || undefined,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}