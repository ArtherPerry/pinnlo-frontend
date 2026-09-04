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
  list:   ()           => ['clients', 'list'] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
}

/**
 * One client, fetched fresh.
 *
 * The drawer opens from an object in the list, which can be minutes old — a
 * page connected in another tab, or a status changed by a colleague, would not
 * show. Seeded with the list's copy so the drawer paints immediately and
 * corrects itself when the request lands.
 */
export function useClient(id: string | null, placeholder?: Client) {
  return useQuery({
    queryKey: clientKeys.detail(id ?? 'none'),
    enabled:  !!id,
    placeholderData: placeholder,
    queryFn: async () => {
      const { data } = await api.get<Client>(`/api/clients/${id}`)
      return data
    },
  })
}

/**
 * Permanent deletion.
 *
 * Every child table cascades: posts, contacts, media, platform connections,
 * workspace access and invitations all go with the client, and none of it can
 * be recovered. The caller is responsible for confirming properly — a
 * window.confirm is not enough for this one.
 *
 * useArchiveClient is the reversible alternative and should be preferred.
 */
export function useDeleteClient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/clients/${id}`)
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: clientKeys.detail(id) })
      qc.invalidateQueries({ queryKey: clientKeys.list() })
    },
  })
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