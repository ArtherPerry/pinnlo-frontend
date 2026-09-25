import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type ReportLanguage = 'en' | 'th' | 'my' | 'lo'

export const REPORT_LANGUAGES: { value: ReportLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'th', label: 'ไทย' },
  { value: 'my', label: 'မြန်မာ' },
  { value: 'lo', label: 'ລາວ' },
]

export interface MetricFinding {
  key: string
  label: string
  current: number | null
  previous: number | null
  difference: number | null
  changePercent: number | null
  direction: 'UP' | 'DOWN' | 'FLAT' | 'NO_COMPARISON' | 'UNKNOWN'
  reliable: boolean
}

export interface PostFinding {
  content: string
  platform: string
  views: number
  publishedAt: string | null
}

export interface ReportFindings {
  from: string
  to: string
  previousFrom: string | null
  previousTo: string | null
  hasData: boolean
  insufficientReason: string | null
  postsPublished: number
  previousPostsPublished: number
  metrics: MetricFinding[]
  topPosts: PostFinding[]
  peakDay: { date: string; views: number } | null
  longestGapDays: number | null
  notes: string[]
}

export interface AnalystSummary {
  from: string
  to: string
  language: ReportLanguage
  content: string
  status: 'DRAFT' | 'APPROVED'
  edited: boolean
  generationCount: number
  generationsRemaining: number
  generatedAt: string
  approvedBy: string | null
  approvedAt: string | null
  /** Numbers in the text that the findings cannot account for. */
  unverifiedNumbers: string[]
  findings: ReportFindings
}

export interface ReportMonth {
  /** YYYY-MM */
  key: string
  label: string
  from: string
  to: string
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The last `count` completed calendar months, most recent first. The current
 * month is left out: half a month compared with a whole one would mislead.
 */
export function completedMonths(count = 12, locale = 'en'): ReportMonth[] {
  const now = new Date()
  const months: ReportMonth[] = []
  for (let i = 1; i <= count; i++) {
    const first = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const last  = new Date(first.getFullYear(), first.getMonth() + 1, 0)
    months.push({
      key:   isoDay(first).slice(0, 7),
      label: first.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
      from:  isoDay(first),
      to:    isoDay(last),
    })
  }
  return months
}

/** A month key (YYYY-MM) as its first and last day. */
export function monthRange(key: string): { from: string; to: string } {
  const [y, m] = key.split('-').map(Number)
  return { from: isoDay(new Date(y, m - 1, 1)), to: isoDay(new Date(y, m, 0)) }
}

const summaryKey = (clientId: string | null, from: string, to: string, language: ReportLanguage) =>
  ['report', 'summary', clientId, from, to, language] as const

export function useReportFindings(clientId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ['report', 'findings', clientId, from, to],
    enabled:  !!clientId,
    queryFn:  async () => {
      const { data } = await api.get<ReportFindings>(
        `/api/analytics/clients/${clientId}/report/findings`, { params: { from, to } })
      return data
    },
  })
}

export function useAnalystSummary(clientId: string | null, from: string, to: string, language: ReportLanguage) {
  return useQuery({
    queryKey: summaryKey(clientId, from, to, language),
    enabled:  !!clientId,
    queryFn:  async () => {
      const res = await api.get<AnalystSummary | ''>(
        `/api/analytics/clients/${clientId}/summary`, { params: { from, to, language } })
      // 204 when nothing has been written yet: a normal state, not an error.
      return res.status === 204 || !res.data ? null : (res.data as AnalystSummary)
    },
  })
}

interface SummaryVars {
  clientId: string
  from: string
  to: string
  language: ReportLanguage
  content?: string
}

/** Every summary change returns the new state, which replaces the cached one. */
function useSummaryMutation(run: (v: SummaryVars) => Promise<AnalystSummary>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess:  (data, v) => qc.setQueryData(summaryKey(v.clientId, v.from, v.to, v.language), data),
  })
}

// Only the fields the server reads are sent.
const body = (v: SummaryVars) => ({ from: v.from, to: v.to, language: v.language, content: v.content })

export const useGenerateSummary = () => useSummaryMutation(async (v) =>
  (await api.post<AnalystSummary>(`/api/analytics/clients/${v.clientId}/summary/generate`, body(v))).data)

export const useUpdateSummary = () => useSummaryMutation(async (v) =>
  (await api.put<AnalystSummary>(`/api/analytics/clients/${v.clientId}/summary`, body(v))).data)

export const useApproveSummary = () => useSummaryMutation(async (v) =>
  (await api.post<AnalystSummary>(`/api/analytics/clients/${v.clientId}/summary/approve`, body(v))).data)