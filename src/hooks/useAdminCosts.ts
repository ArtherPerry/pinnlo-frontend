import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { UsageMetricKey } from './useAdminUsage'

export interface CostTrendPoint {
  date: string
  cost: number
}

export interface ChannelTotal {
  metric: UsageMetricKey
  units: number
  cost: number
  share: number
}

export interface AgencyCost {
  agencyId: string
  agencyName: string
  plan: string | null
  cost: number
  units: Partial<Record<UsageMetricKey, number>>
}

export interface CostsReport {
  days: 30 | 90
  total: number
  trend: CostTrendPoint[]
  byChannel: ChannelTotal[]
  /** Always the last 30 days, whatever the chart range. */
  byAgency: AgencyCost[]
}

export interface RateRow {
  id: string
  rate: number
  /** An instant. Display in Bangkok time: rates start at Bangkok midnight. */
  effectiveFrom: string
  createdBy: string
}

export interface MetricRates {
  metric: UsageMetricKey
  current: RateRow | null
  /** Not yet in force, soonest first. Only these can be cancelled. */
  scheduled: RateRow[]
  history: RateRow[]
}

export function useCosts(days: 30 | 90) {
  return useQuery({
    queryKey: ['admin', 'costs', days],
    queryFn: async (): Promise<CostsReport> => {
      const { data } = await api.get('/api/v1/admin/costs', { params: { days } })
      return data
    },
  })
}

export function useCostRates() {
  return useQuery({
    queryKey: ['admin', 'cost-rates'],
    queryFn: async (): Promise<MetricRates[]> => {
      const { data } = await api.get('/api/v1/admin/cost-rates')
      return data
    },
  })
}

/** Omit effectiveDate to take effect now; otherwise yyyy-MM-dd, tomorrow or later. */
export function useSetCostRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { metric: UsageMetricKey; rate: number; effectiveDate?: string }) => {
      const { data } = await api.post('/api/v1/admin/cost-rates', input)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useCancelCostRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/v1/admin/cost-rates/${id}`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}