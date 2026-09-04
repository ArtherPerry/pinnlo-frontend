import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { MediaAsset } from '@/hooks/useMedia'

export interface ClientPost {
  id:              string
  content:         string
  status:          string
  scheduledAt:     string | null
  publishedAt:     string | null
  platforms:       string[]
  media:           MediaAsset[]
  clientComment:   string | null
  clientDecidedAt: string | null
  clientId:        string
  clientName:      string
  createdAt:       string
}

export interface ReportMetric {
  key:            string
  label:          string
  /** Null when nothing has been collected — not the same as zero. */
  value:          number | null
  changePercent:  number | null
}

export interface MetricSeries {
  key:    string
  label:  string
  points: { date: string; value: number }[]
}

export interface ClientReport {
  from:      string
  to:        string
  hasData:   boolean
  metrics:   ReportMetric[]
  trend:     MetricSeries[]
  topPosts:  {
    postId:      string
    content:     string
    platform:    string
    value:       number
    publishedAt: string | null
  }[]
  unavailableMetrics: string[]
}

export function useClientReport(from?: string, to?: string, clientId?: string) {
  return useQuery({
    queryKey: ['client-workspace', 'report', from ?? 'default', to ?? 'default', clientId ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<ClientReport>('/api/client/report', {
        params: { from, to, clientId },
      })
      return data
    },
  })
}

export interface ClientWorkspaceSummary {
  id:             string
  name:           string
  status:         string
  /** True when the workspace is paused or archived: viewable, not actionable. */
  readOnly:       boolean
  awaitingReview: number
}

export interface ClientWorkspace {
  userId:     string
  name:       string
  email:      string
  agencyName: string
  clients:    ClientWorkspaceSummary[]
}

export const clientWorkspaceKeys = {
  me:       () => ['client-workspace', 'me'] as const,
  posts:    (status?: string, clientId?: string) =>
              ['client-workspace', 'posts', status ?? 'all', clientId ?? 'all'] as const,
  calendar: (from: string, to: string) =>
              ['client-workspace', 'calendar', from, to] as const,
}

/** Who the signed-in client user is, and which workspaces they hold. */
export function useClientWorkspace() {
  return useQuery({
    queryKey: clientWorkspaceKeys.me(),
    queryFn: async () => {
      const { data } = await api.get<ClientWorkspace>('/api/client/me')
      return data
    },
  })
}

export function useClientPosts(status?: string, clientId?: string) {
  return useQuery({
    queryKey: clientWorkspaceKeys.posts(status, clientId),
    queryFn: async () => {
      const { data } = await api.get<{ content: ClientPost[]; totalElements: number }>(
        '/api/client/posts',
        { params: { status, clientId } }
      )
      return data.content
    },
  })
}

export function useClientCalendar(from: string, to: string, clientId?: string) {
  return useQuery({
    queryKey: clientWorkspaceKeys.calendar(from, to),
    queryFn: async () => {
      const { data } = await api.get<ClientPost[]>('/api/client/calendar', {
        params: { from, to, clientId },
      })
      return data
    },
  })
}

/**
 * Client approves. If the agency set a publish time, the server moves the post
 * straight to SCHEDULED rather than leaving it merely APPROVED.
 */
export function useClientApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post<ClientPost>(`/api/client/posts/${postId}/approve`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-workspace'] })
    },
  })
}

export function useClientRequestChanges() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId, comment }: { postId: string; comment: string }) => {
      const { data } = await api.post<ClientPost>(
        `/api/client/posts/${postId}/request-changes`,
        { comment }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-workspace'] })
    },
  })
}

/**
 * One post from the client's own workspace.
 *
 * The calendar carries enough for a cell, but not the media, and a tooltip is
 * not a way to read a caption. Fetched by id so the detail is authoritative —
 * a calendar loaded before the agency edited a draft would show stale copy.
 */
export function useClientPost(id: string | null) {
  return useQuery({
    queryKey: ['client-workspace', 'post', id ?? 'none'],
    enabled:  !!id,
    queryFn: async () => {
      const { data } = await api.get<ClientPost>(`/api/client/posts/${id}`)
      return data
    },
  })
}