import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { MessageTemplate, CreateTemplateInput } from '@/lib/types'

export const templateKeys = {
  all:    ()                     => ['templates']                   as const,
  list:   (filters: object = {}) => ['templates', 'list', filters] as const,
}

interface TemplateFilters {
  category?: string
  platform?: string
  search?:   string
}

async function fetchTemplates(filters: TemplateFilters): Promise<MessageTemplate[]> {
  const params: Record<string, string> = {}
  if (filters.category) params.category = filters.category
  if (filters.platform) params.platform = filters.platform
  if (filters.search)   params.search   = filters.search
  const { data } = await api.get('/api/templates', { params })
  return data.content
}

export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn:  () => fetchTemplates(filters),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data } = await api.post('/api/templates', input)
      return data as MessageTemplate
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: templateKeys.all() })
      const optimistic: MessageTemplate = {
        id:         `temp-${Date.now()}`,
        name:       input.name,
        content:    input.content,
        category:   input.category,
        platform:   input.platform,
        variables:  (input.content.match(/\{\{[^}]+\}\}/g) ?? [])
          .filter((v, i, a) => a.indexOf(v) === i),
        usageCount: 0,
        createdBy:  'You',
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      }
      qc.setQueriesData(
        { queryKey: templateKeys.all() },
        (old: MessageTemplate[] | undefined) =>
          old ? [optimistic, ...old] : [optimistic]
      )
      return { optimistic }
    },
    onSuccess: (newTpl, _input, context) => {
      qc.setQueriesData(
        { queryKey: templateKeys.all() },
        (old: MessageTemplate[] | undefined) =>
          old
            ? old.map((t) => t.id === context?.optimistic.id ? newTpl : t)
            : [newTpl]
      )
    },
    onError: (_err, _input, context) => {
      qc.setQueriesData(
        { queryKey: templateKeys.all() },
        (old: MessageTemplate[] | undefined) =>
          old ? old.filter((t) => t.id !== context?.optimistic.id) : []
      )
    },
  })
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CreateTemplateInput>) => {
      const { data } = await api.patch(`/api/templates/${id}`, input)
      return data as MessageTemplate
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: templateKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: templateKeys.all() })
      qc.setQueriesData(
        { queryKey: templateKeys.all() },
        (old: MessageTemplate[] | undefined) =>
          old ? old.map((t) => t.id === id ? { ...t, ...input } : t) : old
      )
      return { snapshot }
    },
    onError: (_err, _input, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) => qc.setQueryData(key, value))
      }
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/templates/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: templateKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: templateKeys.all() })
      qc.setQueriesData(
        { queryKey: templateKeys.all() },
        (old: MessageTemplate[] | undefined) =>
          old ? old.filter((t) => t.id !== id) : []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) => qc.setQueryData(key, value))
      }
    },
  })
}