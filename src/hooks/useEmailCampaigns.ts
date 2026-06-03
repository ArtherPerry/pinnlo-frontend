import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { EmailCampaign, CreateEmailCampaignInput } from '@/lib/types'

export const emailCampaignKeys = {
  all:  ()                     => ['email-campaigns']                   as const,
  list: (filters: object = {}) => ['email-campaigns', 'list', filters] as const,
}

interface EmailFilters {
  clientId?: string
  status?:   string
}

async function fetchEmailCampaigns(
  filters: EmailFilters
): Promise<EmailCampaign[]> {
  const params: Record<string, string> = {}
  if (filters.clientId) params.clientId = filters.clientId
  if (filters.status)   params.status   = filters.status
  const { data } = await api.get('/api/email-campaigns', { params })
  return data.content
}

export function useEmailCampaigns(filters: EmailFilters = {}) {
  return useQuery({
    queryKey: emailCampaignKeys.list(filters),
    queryFn:  () => fetchEmailCampaigns(filters),
  })
}

export function useCreateEmailCampaign() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEmailCampaignInput) => {
      const { data } = await api.post('/api/email-campaigns', input)
      return data as EmailCampaign
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: emailCampaignKeys.all() })

      const optimistic: EmailCampaign = {
        id:             `temp-${Date.now()}`,
        name:           input.name,
        subject:        input.subject,
        previewText:    input.previewText,
        body:           input.body,
        clientId:       input.clientId,
        clientName:     '',
        status:         input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        recipientCount: 0,
        sentCount:      0,
        openCount:      0,
        clickCount:     0,
        openRate:       null,
        clickRate:      null,
        scheduledAt:    input.scheduledAt ?? null,
        sentAt:         null,
        createdBy:      'You',
        createdAt:      new Date().toISOString(),
        tags:           input.tags,
        fromName:       input.fromName,
        fromEmail:      input.fromEmail,
      }

      qc.setQueriesData(
        { queryKey: emailCampaignKeys.all() },
        (old: EmailCampaign[] | undefined) =>
          old ? [optimistic, ...old] : [optimistic]
      )

      return { optimistic }
    },
    onSuccess: (newCampaign, _input, context) => {
      qc.setQueriesData(
        { queryKey: emailCampaignKeys.all() },
        (old: EmailCampaign[] | undefined) =>
          old
            ? old.map((c) =>
                c.id === context?.optimistic.id ? newCampaign : c
              )
            : [newCampaign]
      )
    },
    onError: (_err, _input, context) => {
      qc.setQueriesData(
        { queryKey: emailCampaignKeys.all() },
        (old: EmailCampaign[] | undefined) =>
          old
            ? old.filter((c) => c.id !== context?.optimistic.id)
            : []
      )
    },
  })
}

export function useDeleteEmailCampaign() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/email-campaigns/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: emailCampaignKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: emailCampaignKeys.all() })
      qc.setQueriesData(
        { queryKey: emailCampaignKeys.all() },
        (old: EmailCampaign[] | undefined) =>
          old ? old.filter((c) => c.id !== id) : []
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

export function useSendEmailCampaign() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/email-campaigns/${id}/send`)
      return data as EmailCampaign
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: emailCampaignKeys.all() })
      const snapshot = qc.getQueriesData({ queryKey: emailCampaignKeys.all() })
      qc.setQueriesData(
        { queryKey: emailCampaignKeys.all() },
        (old: EmailCampaign[] | undefined) =>
          old
            ? old.map((c) =>
                c.id === id
                  ? { ...c, status: 'SENDING' as const }
                  : c
              )
            : old
      )
      return { snapshot }
    },
    onSuccess: (updated) => {
      qc.setQueriesData(
        { queryKey: emailCampaignKeys.all() },
        (old: EmailCampaign[] | undefined) =>
          old
            ? old.map((c) => c.id === updated.id ? { ...c, ...updated } : c)
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