import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { InboxThread, InboxMessage, InboxThreadStatus } from '@/lib/types'

export const inboxKeys = {
  all:    ()                         => ['inbox']                      as const,
  list:   (filters: object = {})     => ['inbox', 'list', filters]    as const,
  detail: (id: string)               => ['inbox', 'detail', id]       as const,
}

interface InboxFilters {
  type?:     string
  platform?: string
  status?:   string
}

async function fetchThreads(filters: InboxFilters): Promise<InboxThread[]> {
  const params: Record<string, string> = {}
  if (filters.type)     params.type     = filters.type
  if (filters.platform) params.platform = filters.platform
  if (filters.status)   params.status   = filters.status
  const { data } = await api.get('/api/inbox/threads', { params })
  return data.content
}

export function useInboxThreads(filters: InboxFilters = {}) {
  return useQuery({
    queryKey: inboxKeys.list(filters),
    queryFn:  () => fetchThreads(filters),
  })
}

export function useReplyToThread(threadId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(
        `/api/inbox/threads/${threadId}/reply`,
        { content }
      )
      return data as InboxMessage
    },
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: inboxKeys.all() })

      const optimisticMsg: InboxMessage = {
        id:      `temp-${Date.now()}`,
        type:    'OUTBOUND',
        content,
        author:  'You',
        sentAt:  new Date().toISOString(),
        isRead:  true,
      }

      qc.setQueriesData(
        { queryKey: inboxKeys.all() },
        (old: InboxThread[] | undefined) =>
          old
            ? old.map((t) =>
                t.id === threadId
                  ? { ...t, messages: [...t.messages, optimisticMsg], preview: content }
                  : t
              )
            : old
      )

      return { optimisticMsg }
    },
    onSuccess: (newMsg, _content, context) => {
      qc.setQueriesData(
        { queryKey: inboxKeys.all() },
        (old: InboxThread[] | undefined) =>
          old
            ? old.map((t) =>
                t.id === threadId
                  ? {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === context?.optimisticMsg.id ? newMsg : m
                      ),
                    }
                  : t
              )
            : old
      )
    },
    onError: (_err, _content, context) => {
      qc.setQueriesData(
        { queryKey: inboxKeys.all() },
        (old: InboxThread[] | undefined) =>
          old
            ? old.map((t) =>
                t.id === threadId
                  ? {
                      ...t,
                      messages: t.messages.filter(
                        (m) => m.id !== context?.optimisticMsg.id
                      ),
                    }
                  : t
              )
            : old
      )
    },
  })
}

export function useUpdateThread(threadId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<{ status: InboxThreadStatus; assignedTo: string | null }>) => {
      const { data } = await api.patch(`/api/inbox/threads/${threadId}`, input)
      return data as InboxThread
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: inboxKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: inboxKeys.all() })
      qc.setQueriesData(
        { queryKey: inboxKeys.all() },
        (old: InboxThread[] | undefined) =>
          old
            ? old.map((t) =>
                t.id === threadId ? { ...t, ...input } : t
              )
            : old
      )
      return { snapshot }
    },
    onError: (_err, _input, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) => {
          qc.setQueryData(key, value)
        })
      }
    },
  })
}

export function useHideComment(threadId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/inbox/threads/${threadId}/comment`)
    },
    onSuccess: () => {
      qc.setQueriesData(
        { queryKey: inboxKeys.all() },
        (old: InboxThread[] | undefined) =>
          old ? old.filter((t) => t.id !== threadId) : []
      )
    },
  })
}