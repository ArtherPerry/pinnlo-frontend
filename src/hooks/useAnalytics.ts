import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  AnalyticsOverview,
  AnalyticsHistoryPoint,
  PostPerformance,
  HeatmapCell,
} from '@/lib/types'

export const analyticsKeys = {
  overview: ()            => ['analytics', 'overview']        as const,
  history:  (days: number)=> ['analytics', 'history', days]   as const,
  posts:    ()            => ['analytics', 'posts']           as const,
  heatmap:  ()            => ['analytics', 'heatmap']        as const,
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn:  async () => {
      const { data } = await api.get('/api/analytics/overview')
      return data as AnalyticsOverview
    },
  })
}

export function useAnalyticsHistory(days: number) {
  return useQuery({
    queryKey: analyticsKeys.history(days),
    queryFn:  async () => {
      const { data } = await api.get('/api/analytics/history', { params: { days } })
      return data.data as AnalyticsHistoryPoint[]
    },
  })
}

export function usePostPerformance() {
  return useQuery({
    queryKey: analyticsKeys.posts(),
    queryFn:  async () => {
      const { data } = await api.get('/api/analytics/posts')
      return data.content as PostPerformance[]
    },
  })
}

export function useHeatmap() {
  return useQuery({
    queryKey: analyticsKeys.heatmap(),
    queryFn:  async () => {
      const { data } = await api.get('/api/analytics/heatmap')
      return data as { heatmap: HeatmapCell[][]; timezone: string }
    },
    staleTime: 1000 * 60 * 60, // 1 hour — heatmap changes slowly
  })
}