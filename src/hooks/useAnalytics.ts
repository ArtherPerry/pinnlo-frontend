import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  AnalyticsOverview,
  AnalyticsHistoryPoint,
  PostPerformance,
  HeatmapCell,
} from '@/lib/types'

/**
 * Agency-side analytics.
 *
 * Two generations of hooks live here.
 *
 * The report hooks at the bottom read /api/analytics/clients/{id}/report,
 * which is real: it aggregates stored Page Insights collected nightly.
 *
 * The four hooks above them predate that endpoint and are kept for the
 * components that still use them. See the note on that block before
 * building anything new on top.
 */

export const analyticsKeys = {
  overview: ()             => ['analytics', 'overview']      as const,
  history:  (days: number) => ['analytics', 'history', days] as const,
  posts:    ()             => ['analytics', 'posts']         as const,
  heatmap:  ()             => ['analytics', 'heatmap']       as const,
  report:   (clientId: string, from: string, to: string) =>
    ['analytics', 'report', clientId, from, to] as const,
}

// ── Legacy hooks ──────────────────────────────────────────────────────────
//
// These four call endpoints that do not exist on the backend. They worked
// only while MSW intercepted them; since the mock layer was removed they
// return 404 at runtime.
//
// Retained because ReportExporter and the portals page still import them, and
// removing an export from a shared module without checking every consumer is
// what broke the build in the first place. Do not build anything new on these
// — use useClientAnalytics below.

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

// ── Report hooks ──────────────────────────────────────────────────────────

export interface ReportMetric {
  key:           string
  label:         string
  /** Null when nothing has been collected — not the same as zero. */
  value:         number | null
  changePercent: number | null
}

export interface MetricSeries {
  key:    string
  label:  string
  points: { date: string; value: number }[]
}

export interface ClientReport {
  from:     string
  to:       string
  /** False when nothing has been collected for this window at all. */
  hasData:  boolean
  metrics:  ReportMetric[]
  /** One series per metric, so the chart can toggle without a second request. */
  trend:    MetricSeries[]
  topPosts: {
    postId:      string
    content:     string
    platform:    string
    value:       number
    publishedAt: string | null
  }[]
  /** Report metrics the platform has stopped providing. */
  unavailableMetrics: string[]
}

export function useClientAnalytics(clientId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: analyticsKeys.report(clientId ?? 'none', from, to),
    enabled:  !!clientId,
    queryFn: async () => {
      const { data } = await api.get<ClientReport>(
        `/api/analytics/clients/${clientId}/report`,
        { params: { from, to } }
      )
      return data
    },
  })
}

/**
 * Forces collection for one connection.
 *
 * Without this a newly connected page shows nothing for 24 hours, since Meta
 * updates most metrics once a day and the scheduled job runs overnight.
 */
export function useCollectInsights() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: string) => {
      await api.post(`/api/analytics/connections/${connectionId}/collect`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

/** Inclusive date range ending yesterday, since today's data is incomplete. */
export function rangeForDays(days: number): { from: string; to: string } {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 1)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))

  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(start), to: iso(end) }
}