import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { BroadcastCampaign, CreateBroadcastInput } from '@/lib/types'

export const broadcastKeys = {
  all:  ()                     => ['broadcasts']                   as const,
  list: (filters: object = {}) => ['broadcasts', 'list', filters] as const,
}

interface BroadcastFilters {
  clientId?: string
  status?:   string
}

async function fetchBroadcasts(
  filters: BroadcastFilters
): Promise<BroadcastCampaign[]> {
  const params: Record<string, string> = {}
  if (filters.clientId) params.clientId = filters.clientId
  if (filters.status)   params.status   = filters.status
  const { data } = await api.get('/api/broadcasts', { params })
  return data.content
}

export function useBroadcasts(filters: BroadcastFilters = {}) {
  return useQuery({
    queryKey: broadcastKeys.list(filters),
    queryFn:  () => fetchBroadcasts(filters),
  })
}

export function useCreateBroadcast() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBroadcastInput) => {
      const { data } = await api.post('/api/broadcasts', input)
      return data as BroadcastCampaign
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: broadcastKeys.all() })

      const optimistic: BroadcastCampaign = {
        id:             `temp-${Date.now()}`,
        name:           input.name,
        platform:       input.platform,
        clientId:       input.clientId,
        clientName:     '',
        status:         input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        message:        input.message,
        templateId:     input.templateId ?? null,
        recipientCount: 0,
        sentCount:      0,
        failedCount:    0,
        openRate:       null,
        scheduledAt:    input.scheduledAt ?? null,
        sentAt:         null,
        createdBy:      'You',
        createdAt:      new Date().toISOString(),
        tags:           input.tags,
      }

      qc.setQueriesData(
        { queryKey: broadcastKeys.all() },
        (old: BroadcastCampaign[] | undefined) =>
          old ? [optimistic, ...old] : [optimistic]
      )

      return { optimistic }
    },
    onSuccess: (newBc, _input, context) => {
      qc.setQueriesData(
        { queryKey: broadcastKeys.all() },
        (old: BroadcastCampaign[] | undefined) =>
          old
            ? old.map((b) =>
                b.id === context?.optimistic.id ? newBc : b
              )
            : [newBc]
      )
    },
    onError: (_err, _input, context) => {
      qc.setQueriesData(
        { queryKey: broadcastKeys.all() },
        (old: BroadcastCampaign[] | undefined) =>
          old
            ? old.filter((b) => b.id !== context?.optimistic.id)
            : []
      )
    },
  })
}

export function useDeleteBroadcast() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/broadcasts/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: broadcastKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: broadcastKeys.all() })
      qc.setQueriesData(
        { queryKey: broadcastKeys.all() },
        (old: BroadcastCampaign[] | undefined) =>
          old ? old.filter((b) => b.id !== id) : []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) =>
          qc.setQueryData(key, value)
        )
      }
    },
  })
}

export function useSendBroadcast() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/broadcasts/${id}/send`)
      return data as BroadcastCampaign
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: broadcastKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: broadcastKeys.all() })
      qc.setQueriesData(
        { queryKey: broadcastKeys.all() },
        (old: BroadcastCampaign[] | undefined) =>
          old
            ? old.map((b) =>
                b.id === id ? { ...b, status: 'SENDING' as const } : b
              )
            : old
      )
      return { snapshot }
    },
    onSuccess: (updated) => {
      qc.setQueriesData(
        { queryKey: broadcastKeys.all() },
        (old: BroadcastCampaign[] | undefined) =>
          old
            ? old.map((b) => b.id === updated.id ? { ...b, ...updated } : b)
            : old
      )
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) =>
          qc.setQueryData(key, value)
        )
      }
    },
  })
}