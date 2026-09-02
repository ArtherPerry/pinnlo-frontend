import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Client {
  id:        string
  name:      string
  platforms: string[]
  status:    string
}

interface PagedClients {
  content:       Client[]
  totalElements: number
  totalPages:    number
  page:          number
  size:          number
}

/**
 * The body for both create and update — the backend takes the same
 * CreateClientRequest for POST and PUT, so one form serves both.
 */
export interface ClientInput {
  name:      string
  platforms: string[]
  status:    string
}

const clientKeys = {
  list: () => ['clients', 'list'] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<PagedClients>('/api/clients', {
        params: { size: 100 },
      })
      return data.content
    },
  })
}

export function useCreateClient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data } = await api.post('/api/clients', input)
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.list() })
    },
  })
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data } = await api.put(`/api/clients/${id}`, input)
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.list() })
    },
  })
}

/**
 * Archives rather than deletes.
 *
 * DELETE /api/clients/{id} exists, but every child table cascades — posts,
 * contacts, media, platform connections, workspace access and invitations all
 * go with it, irreversibly and without warning. ClientStatus already has
 * ARCHIVED, so the UI uses that and leaves the destructive endpoint unexposed.
 */
export function useArchiveClient(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (current: ClientInput) => {
      const { data } = await api.put(`/api/clients/${id}`, {
        ...current,
        status: 'ARCHIVED',
      })
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.list() })
    },
  })
}