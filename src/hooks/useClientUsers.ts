import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface ClientUserSummary {
  id:        string
  email:     string
  name:      string
  status:    string
  grantedAt: string
}

export interface ClientInvitation {
  id:        string
  email:     string
  name:      string | null
  status:    'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
  /**
   * The invitation link. Returned ONCE, at creation, and never again — the
   * server stores only a hash of the token. If the agency loses it, the
   * invitation must be revoked and reissued.
   */
  inviteUrl: string | null
}

export const clientUserKeys = {
  users:       (clientId: string) => ['client-users', clientId] as const,
  invitations: (clientId: string) => ['client-invitations', clientId] as const,
}

/** People who can already sign in to this client's workspace. */
export function useClientUsers(clientId: string | null) {
  return useQuery({
    queryKey: clientUserKeys.users(clientId ?? 'none'),
    enabled:  !!clientId,
    queryFn: async () => {
      const { data } = await api.get<ClientUserSummary[]>(`/api/clients/${clientId}/users`)
      return data
    },
  })
}

/** Invitations issued for this client, in any state. */
export function useClientInvitations(clientId: string | null) {
  return useQuery({
    queryKey: clientUserKeys.invitations(clientId ?? 'none'),
    enabled:  !!clientId,
    queryFn: async () => {
      const { data } = await api.get<ClientInvitation[]>(`/api/clients/${clientId}/invitations`)
      return data
    },
  })
}

export function useInviteClientUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId, email, name,
    }: { clientId: string; email: string; name?: string }) => {
      const { data } = await api.post<ClientInvitation>(
        `/api/clients/${clientId}/invitations`,
        { email, name: name || null }
      )
      return data
    },
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: clientUserKeys.invitations(clientId) })
    },
  })
}

export function useRevokeInvitation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ clientId, invitationId }: { clientId: string; invitationId: string }) => {
      await api.delete(`/api/clients/${clientId}/invitations/${invitationId}`)
    },
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: clientUserKeys.invitations(clientId) })
    },
  })
}

export function useRevokeClientAccess() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ clientId, userId }: { clientId: string; userId: string }) => {
      await api.delete(`/api/clients/${clientId}/users/${userId}`)
    },
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: clientUserKeys.users(clientId) })
    },
  })
}