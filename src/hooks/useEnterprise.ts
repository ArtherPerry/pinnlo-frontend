import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  ListeningQuery,
  Mention,
  CreateListeningQueryInput,
  Influencer,
  InfluencerSearchParams,
  ApiKey,
  ApiUsageStats,
} from '@/lib/types'

// ── Query keys ────────────────────────────────────────────────────
export const listeningKeys = {
  all:      ()           => ['listening']                    as const,
  list:     ()           => ['listening', 'list']            as const,
  detail:   (id: string) => ['listening', 'detail', id]     as const,
  mentions: (id: string) => ['listening', 'mentions', id]   as const,
}

export const influencerKeys = {
  all:    ()                          => ['influencers']                    as const,
  list:   (params: object = {})       => ['influencers', 'list', params]   as const,
  detail: (id: string)                => ['influencers', 'detail', id]     as const,
}

export const apiKeys = {
  keys:  () => ['developer', 'keys']  as const,
  usage: () => ['developer', 'usage'] as const,
}

// ══════════════════════════════════════════════════════════════════
// SOCIAL LISTENING
// ══════════════════════════════════════════════════════════════════

async function fetchListeningQueries(): Promise<ListeningQuery[]> {
  const { data } = await api.get('/api/listening/queries')
  return data.content
}

export function useListeningQueries() {
  return useQuery({
    queryKey: listeningKeys.list(),
    queryFn:  fetchListeningQueries,
  })
}

async function fetchMentions(queryId: string): Promise<Mention[]> {
  const { data } = await api.get(`/api/listening/queries/${queryId}/mentions`)
  return data.content
}

export function useMentions(queryId: string) {
  return useQuery({
    queryKey: listeningKeys.mentions(queryId),
    queryFn:  () => fetchMentions(queryId),
    enabled:  !!queryId,
  })
}

export function useCreateListeningQuery() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateListeningQueryInput) => {
      const { data } = await api.post('/api/listening/queries', input)
      return data as ListeningQuery
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: listeningKeys.list() })

      const optimistic: ListeningQuery = {
        id:           `temp-${Date.now()}`,
        keyword:      input.keyword,
        platforms:    input.platforms,
        language:     input.language,
        alertEnabled: input.alertEnabled,
        alertFrequency: input.alertFrequency,
        mentionCount: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        createdAt:    new Date().toISOString(),
        lastFoundAt:  null,
      }

      qc.setQueryData(
        listeningKeys.list(),
        (old: ListeningQuery[] | undefined) =>
          old ? [optimistic, ...old] : [optimistic]
      )

      return { optimistic }
    },
    onSuccess: (newQuery, _input, context) => {
      qc.setQueryData(
        listeningKeys.list(),
        (old: ListeningQuery[] | undefined) =>
          old
            ? old.map((q) =>
                q.id === context?.optimistic.id ? newQuery : q
              )
            : [newQuery]
      )
    },
    onError: (_err, _input, context) => {
      qc.setQueryData(
        listeningKeys.list(),
        (old: ListeningQuery[] | undefined) =>
          old
            ? old.filter((q) => q.id !== context?.optimistic.id)
            : []
      )
    },
  })
}

export function useDeleteListeningQuery() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/listening/queries/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: listeningKeys.list() })
      const snapshot = qc.getQueryData(listeningKeys.list())
      qc.setQueryData(
        listeningKeys.list(),
        (old: ListeningQuery[] | undefined) =>
          old ? old.filter((q) => q.id !== id) : []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        qc.setQueryData(listeningKeys.list(), context.snapshot)
      }
    },
  })
}

export function useUpdateListeningQuery(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<CreateListeningQueryInput>) => {
      const { data } = await api.patch(`/api/listening/queries/${id}`, input)
      return data as ListeningQuery
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: listeningKeys.list() })
      const snapshot = qc.getQueryData(listeningKeys.list())
      qc.setQueryData(
        listeningKeys.list(),
        (old: ListeningQuery[] | undefined) =>
          old
            ? old.map((q) => q.id === id ? { ...q, ...input } : q)
            : old
      )
      return { snapshot }
    },
    onError: (_err, _input, context) => {
      if (context?.snapshot) {
        qc.setQueryData(listeningKeys.list(), context.snapshot)
      }
    },
  })
}

// ══════════════════════════════════════════════════════════════════
// INFLUENCER DISCOVERY
// ══════════════════════════════════════════════════════════════════

async function fetchInfluencers(
  params: InfluencerSearchParams
): Promise<Influencer[]> {
  const query: Record<string, string> = {}
  if (params.keyword)       query.keyword       = params.keyword
  if (params.platform)      query.platform      = params.platform
  if (params.tier)          query.tier          = params.tier
  if (params.location)      query.location      = params.location
  if (params.language)      query.language      = params.language
  if (params.minEngagement) query.minEngagement = String(params.minEngagement)

  const { data } = await api.get('/api/influencers', { params: query })
  return data.content
}

export function useInfluencers(params: InfluencerSearchParams = {}) {
  return useQuery({
    queryKey: influencerKeys.list(params),
    queryFn:  () => fetchInfluencers(params),
  })
}

async function fetchInfluencer(id: string): Promise<Influencer> {
  const { data } = await api.get(`/api/influencers/${id}`)
  return data
}

export function useInfluencer(id: string) {
  return useQuery({
    queryKey: influencerKeys.detail(id),
    queryFn:  () => fetchInfluencer(id),
    enabled:  !!id,
  })
}

// ══════════════════════════════════════════════════════════════════
// API KEY MANAGEMENT
// ══════════════════════════════════════════════════════════════════

async function fetchApiKeys(): Promise<ApiKey[]> {
  const { data } = await api.get('/api/developer/keys')
  return data
}

export function useApiKeys() {
  return useQuery({
    queryKey: apiKeys.keys(),
    queryFn:  fetchApiKeys,
  })
}

async function fetchApiUsage(): Promise<ApiUsageStats> {
  const { data } = await api.get('/api/developer/usage')
  return data
}

export function useApiUsage() {
  return useQuery({
    queryKey: apiKeys.usage(),
    queryFn:  fetchApiUsage,
    refetchInterval: 60000, // refresh every minute
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name:        string
      permissions: string[]
      expiresAt?:  string
    }) => {
      const { data } = await api.post('/api/developer/keys', input)
      return data as ApiKey & { fullKey: string }
    },
    onSuccess: (newKey) => {
      qc.setQueryData(
        apiKeys.keys(),
        (old: ApiKey[] | undefined) =>
          old ? [newKey, ...old] : [newKey]
      )
    },
  })
}

export function useRevokeApiKey() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/developer/keys/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: apiKeys.keys() })
      const snapshot = qc.getQueryData(apiKeys.keys())
      qc.setQueryData(
        apiKeys.keys(),
        (old: ApiKey[] | undefined) =>
          old
            ? old.map((k) =>
                k.id === id ? { ...k, status: 'REVOKED' as const } : k
              )
            : old
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        qc.setQueryData(apiKeys.keys(), context.snapshot)
      }
    },
  })
}