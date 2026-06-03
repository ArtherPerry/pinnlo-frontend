import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Competitor,
  CreateCompetitorInput,
  BenchmarkGroup,
  CreateBenchmarkGroupInput,
  ReportPortal,
} from '@/lib/types'

// ── Query keys ────────────────────────────────────────────────────
export const competitorKeys = {
  all:    ()             => ['competitors']                    as const,
  list:   (clientId?: string) => ['competitors', 'list', clientId] as const,
  detail: (id: string)   => ['competitors', 'detail', id]     as const,
}

export const benchmarkKeys = {
  all:    ()           => ['benchmarks']              as const,
  list:   ()           => ['benchmarks', 'list']      as const,
  detail: (id: string) => ['benchmarks', 'detail', id] as const,
}

export const portalKeys = {
  all:    ()           => ['portals']              as const,
  list:   ()           => ['portals', 'list']      as const,
  detail: (id: string) => ['portals', 'detail', id] as const,
}

// ══════════════════════════════════════════════════════════════════
// COMPETITORS
// ══════════════════════════════════════════════════════════════════

async function fetchCompetitors(clientId?: string): Promise<Competitor[]> {
  const params = clientId ? { clientId } : {}
  const { data } = await api.get('/api/competitors', { params })
  return data.content
}

export function useCompetitors(clientId?: string) {
  return useQuery({
    queryKey: competitorKeys.list(clientId),
    queryFn:  () => fetchCompetitors(clientId),
  })
}

async function fetchCompetitor(id: string): Promise<Competitor> {
  const { data } = await api.get(`/api/competitors/${id}`)
  return data
}

export function useCompetitor(id: string) {
  return useQuery({
    queryKey: competitorKeys.detail(id),
    queryFn:  () => fetchCompetitor(id),
    enabled:  !!id,
  })
}

export function useAddCompetitor() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCompetitorInput) => {
      const { data } = await api.post('/api/competitors', input)
      return data as Competitor
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: competitorKeys.all() })

      const optimistic: Competitor = {
        id:             `temp-${Date.now()}`,
        name:           input.name,
        platform:       input.platform,
        pageUrl:        input.pageUrl,
        pageId:         '',
        avatarUrl:      null,
        followers:      0,
        followerGrowth: 0,
        avgEngagement:  0,
        postsPerWeek:   0,
        clientId:       input.clientId,
        clientName:     '',
        snapshots:      [],
        createdAt:      new Date().toISOString(),
        lastSyncedAt:   new Date().toISOString(),
      }

      qc.setQueriesData(
        { queryKey: competitorKeys.all() },
        (old: Competitor[] | undefined) =>
          old ? [...old, optimistic] : [optimistic]
      )

      return { optimistic }
    },
    onSuccess: (newComp, _input, context) => {
      qc.setQueriesData(
        { queryKey: competitorKeys.all() },
        (old: Competitor[] | undefined) =>
          old
            ? old.map((c) =>
                c.id === context?.optimistic.id ? newComp : c
              )
            : [newComp]
      )
    },
    onError: (_err, _input, context) => {
      qc.setQueriesData(
        { queryKey: competitorKeys.all() },
        (old: Competitor[] | undefined) =>
          old
            ? old.filter((c) => c.id !== context?.optimistic.id)
            : []
      )
    },
  })
}

export function useRemoveCompetitor() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/competitors/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: competitorKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: competitorKeys.all() })
      qc.setQueriesData(
        { queryKey: competitorKeys.all() },
        (old: Competitor[] | undefined) =>
          old ? old.filter((c) => c.id !== id) : []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) => {
          qc.setQueryData(key, value)
        })
      }
    },
  })
}

export function useSyncCompetitor() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/competitors/${id}/sync`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: competitorKeys.all() })
    },
  })
}

// ══════════════════════════════════════════════════════════════════
// BENCHMARK GROUPS
// ══════════════════════════════════════════════════════════════════

async function fetchBenchmarks(): Promise<BenchmarkGroup[]> {
  const { data } = await api.get('/api/benchmarks')
  return data.content
}

export function useBenchmarks() {
  return useQuery({
    queryKey: benchmarkKeys.list(),
    queryFn:  fetchBenchmarks,
  })
}

export function useCreateBenchmark() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBenchmarkGroupInput) => {
      const { data } = await api.post('/api/benchmarks', input)
      return data as BenchmarkGroup
    },
    onSuccess: (newGroup) => {
      qc.setQueryData(
        benchmarkKeys.list(),
        (old: BenchmarkGroup[] | undefined) =>
          old ? [...old, newGroup] : [newGroup]
      )
    },
  })
}

export function useDeleteBenchmark() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/benchmarks/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: benchmarkKeys.list() })
      const snapshot = qc.getQueryData(benchmarkKeys.list())
      qc.setQueryData(
        benchmarkKeys.list(),
        (old: BenchmarkGroup[] | undefined) =>
          old ? old.filter((b) => b.id !== id) : []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        qc.setQueryData(benchmarkKeys.list(), context.snapshot)
      }
    },
  })
}

// ══════════════════════════════════════════════════════════════════
// WHITE-LABEL PORTALS
// ══════════════════════════════════════════════════════════════════

async function fetchPortals(): Promise<ReportPortal[]> {
  const { data } = await api.get('/api/portals')
  return data.content
}

export function usePortals() {
  return useQuery({
    queryKey: portalKeys.list(),
    queryFn:  fetchPortals,
  })
}

async function fetchPortal(id: string): Promise<ReportPortal> {
  const { data } = await api.get(`/api/portals/${id}`)
  return data
}

export function usePortal(id: string) {
  return useQuery({
    queryKey: portalKeys.detail(id),
    queryFn:  () => fetchPortal(id),
    enabled:  !!id,
  })
}

export function useCreatePortal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data } = await api.post('/api/portals', { clientId })
      return data as ReportPortal
    },
    onSuccess: (newPortal) => {
      qc.setQueryData(
        portalKeys.list(),
        (old: ReportPortal[] | undefined) =>
          old ? [...old, newPortal] : [newPortal]
      )
    },
  })
}

export function useUpdatePortal(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<ReportPortal>) => {
      const { data } = await api.patch(`/api/portals/${id}`, input)
      return data as ReportPortal
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: portalKeys.detail(id) })
      const snapshot = qc.getQueryData(portalKeys.detail(id))
      qc.setQueryData(
        portalKeys.detail(id),
        (old: ReportPortal | undefined) =>
          old ? { ...old, ...input } : old
      )
      qc.setQueryData(
        portalKeys.list(),
        (old: ReportPortal[] | undefined) =>
          old
            ? old.map((p) => p.id === id ? { ...p, ...input } : p)
            : old
      )
      return { snapshot }
    },
    onError: (_err, _input, context) => {
      if (context?.snapshot) {
        qc.setQueryData(portalKeys.detail(id), context.snapshot)
      }
    },
  })
}

export function useDeletePortal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/portals/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: portalKeys.list() })
      const snapshot = qc.getQueryData(portalKeys.list())
      qc.setQueryData(
        portalKeys.list(),
        (old: ReportPortal[] | undefined) =>
          old ? old.filter((p) => p.id !== id) : []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        qc.setQueryData(portalKeys.list(), context.snapshot)
      }
    },
  })
}

export function useRegeneratePortalLink(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/portals/${id}/regenerate-link`)
      return data as { shareToken: string; shareUrl: string }
    },
    onSuccess: (result) => {
      qc.setQueryData(
        portalKeys.detail(id),
        (old: ReportPortal | undefined) =>
          old
            ? { ...old, shareToken: result.shareToken, shareUrl: result.shareUrl }
            : old
      )
      qc.setQueryData(
        portalKeys.list(),
        (old: ReportPortal[] | undefined) =>
          old
            ? old.map((p) =>
                p.id === id
                  ? { ...p, shareToken: result.shareToken, shareUrl: result.shareUrl }
                  : p
              )
            : old
      )
    },
  })
}