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

// ── Calendar ──────────────────────────────────────────────────────
interface CalendarDay {
  id:         string
  status:     string
  clientName: string
}

interface CalendarData {
  year:  number
  month: number
  days:  Record<string, CalendarDay[]>
}

async function fetchCalendar(year: number, month: number): Promise<CalendarData> {
  const { data } = await api.get('/api/posts/calendar', { params: { year, month } })
  return data
}

export function usePostCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['posts', 'calendar', year, month],
    queryFn:  () => fetchCalendar(year, month),
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