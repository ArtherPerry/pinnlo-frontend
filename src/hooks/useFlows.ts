import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { BotFlow, CreateFlowInput,FlowStatus } from '@/lib/types'

export const flowKeys = {
  all:    ()             => ['flows']                    as const,
  list:   (f: object={}) => ['flows', 'list', f]        as const,
  detail: (id: string)   => ['flows', 'detail', id]     as const,
}

async function fetchFlows(filters: {
  clientId?: string
  status?:   string
}): Promise<BotFlow[]> {
  const params: Record<string, string> = {}
  if (filters.clientId) params.clientId = filters.clientId
  if (filters.status)   params.status   = filters.status
  const { data } = await api.get('/api/flows', { params })
  return data.content
}

export function useFlows(filters: { clientId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: flowKeys.list(filters),
    queryFn:  () => fetchFlows(filters),
  })
}

async function fetchFlow(id: string): Promise<BotFlow> {
  const { data } = await api.get(`/api/flows/${id}`)
  return data
}

export function useFlow(id: string) {
  return useQuery({
    queryKey: flowKeys.detail(id),
    queryFn:  () => fetchFlow(id),
    enabled:  !!id,
  })
}

export function useCreateFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateFlowInput) => {
      const { data } = await api.post('/api/flows', input)
      return data as BotFlow
    },
    onSuccess: (newFlow) => {
      qc.setQueryData(
        flowKeys.list(),
        (old: BotFlow[] | undefined) =>
          old ? [newFlow, ...old] : [newFlow]
      )
    },
  })
}

export function useSaveFlow(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (flow: Partial<BotFlow>) => {
      const { data } = await api.put(`/api/flows/${id}`, flow)
      return data as BotFlow
    },
    onSuccess: (updated) => {
      qc.setQueryData(flowKeys.detail(id), updated)
    },
  })
}

export function useUpdateFlowStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status: FlowStatus) => {
      const { data } = await api.patch(`/api/flows/${id}/status`, { status })
      return data as BotFlow
    },
    onMutate: async (status) => {
      await qc.cancelQueries({ queryKey: flowKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: flowKeys.all() })
      qc.setQueriesData(
        { queryKey: flowKeys.all() },
        (old: BotFlow[] | undefined) =>
          old ? old.map((f) => f.id === id ? { ...f, status } : f) : old
      )
      return { snapshot }
    },
    onError: (_err, _status, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) =>
          qc.setQueryData(key, value)
        )
      }
    },
  })
}

export function useDeleteFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/flows/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: flowKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: flowKeys.all() })
      qc.setQueriesData(
        { queryKey: flowKeys.all() },
        (old: BotFlow[] | undefined) =>
          old ? old.filter((f) => f.id !== id) : []
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