import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { Post, CreatePostInput } from '@/lib/types'

// ── Query keys ────────────────────────────────────────────────────
export const postKeys = {
  all:    ()           => ['posts']               as const,
  list:   (filters={}) => ['posts', 'list', filters] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
}

// ── Fetch all posts (with optional status filter) ─────────────────
async function fetchPosts(status?: string): Promise<Post[]> {
  const params = status ? { status } : {}
  const { data } = await api.get('/api/posts', { params })
  return data.content
}

export function usePosts(status?: string) {
  return useQuery({
    queryKey: postKeys.list({ status }),
    queryFn:  () => fetchPosts(status),
  })
}

// ── Fetch single post ─────────────────────────────────────────────
async function fetchPost(id: string): Promise<Post> {
  const { data } = await api.get(`/api/posts/${id}`)
  return data
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn:  () => fetchPost(id),
    enabled:  !!id,
  })
}

// ── Create post ───────────────────────────────────────────────────
export function useCreatePost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { data } = await api.post('/api/posts', input)
      return data as Post
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
    },
  })
}

// ── Update post ───────────────────────────────────────────────────
export function useUpdatePost(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<CreatePostInput>) => {
      const { data } = await api.patch(`/api/posts/${id}`, input)
      return data as Post
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

// ── Submit for review ─────────────────────────────────────────────
export function useSubmitPost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/posts/${id}/submit`)
      return data as Post
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

// ── Cancel post ───────────────────────────────────────────────────
export function useCancelPost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/posts/${id}/cancel`)
      return data as Post
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

// ── Retry a failed or partly failed post ──────────────────────────
export function useRetryPost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/posts/${id}/retry`)
      return data as Post
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

// ── Delete post ───────────────────────────────────────────────────
export function useDeletePost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/posts/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
    },
  })
}

// ── Approve post ──────────────────────────────────────────────────
export function useApprovePost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/posts/${id}/approve`)
      return data
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

// ── Reject post ───────────────────────────────────────────────────
export function useRejectPost() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const { data } = await api.post(`/api/posts/${id}/reject`, { comment })
      return data
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

// ── Edit post (full replace) ──────────────────────────────────────
export function useEditPost(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { data } = await api.put(`/api/posts/${id}`, input)
      return data as Post
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: postKeys.all() })
      qc.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

/**
 * Posts for one month, grouped by local date.
 *
 * The backend returns a flat list over an Instant range; the grouping happens
 * here so the calendar grid can index by date directly.
 */
interface CalendarData {
  days: Record<string, Post[]>
}

/**
 * Grouped by the date the user sees, not the UTC date.
 *
 * A post scheduled 07:00 Bangkok time is 00:00 UTC the same day, but one at
 * 06:00 Bangkok is 23:00 UTC the day before — grouping on the UTC date would
 * put it in the wrong cell.
 */
function localDateKey(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function fetchCalendar(year: number, month: number): Promise<CalendarData> {
  // Local month boundaries converted to instants, so the range covers the
  // month as the user sees it rather than the UTC month.
  const from = new Date(year, month - 1, 1, 0, 0, 0).toISOString()
  const to   = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data } = await api.get<Post[]>('/api/posts/calendar', {
    params: { from, to },
  })

  const days: Record<string, Post[]> = {}
  for (const post of data) {
    // Published posts sit on the day they went out; everything else on the
    // day it is due.
    const anchor = post.publishedAt ?? post.scheduledAt
    if (!anchor) continue
    ;(days[localDateKey(anchor)] ??= []).push(post)
  }

  return { days }
}

export function usePostCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['posts', 'calendar', year, month],
    queryFn:  () => fetchCalendar(year, month),
  })
}