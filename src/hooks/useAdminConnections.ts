import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type ConnectionSeverity = 'FAILED' | 'WARNING' | 'UNKNOWN' | 'OK'

export type ConnectionReason =
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'MISSING_PERMISSION'
  | 'QUALITY_RED'
  | 'DATA_ACCESS_ENDED'
  | 'TOKEN_EXPIRING'
  | 'DATA_ACCESS_ENDING'
  | 'QUALITY_YELLOW'
  | 'CHECK_UNVERIFIED'

export interface AdminConnection {
  /** Which table it lives in, so a check reaches the right endpoint. */
  source: 'PLATFORM' | 'WHATSAPP'
  id: string
  agencyName: string
  clientName: string
  platform: string
  account: string | null
  connectedAt: string | null
  /** UNKNOWN means never successfully checked — not confirmed healthy. */
  severity: ConnectionSeverity
  reasons: ConnectionReason[]
  tokenExpiresAt: string | null
  /** When Meta stops giving the app access to this account's data. */
  dataAccessExpiresAt: string | null
  lastCheckedAt: string | null
  checkStatus: 'VALID' | 'INVALID' | 'UNVERIFIED' | null
  checkError: string | null
  missingScopes: string[]
  qualityRating?: string | null
}

export function useConnections() {
  return useQuery({
    queryKey: ['admin', 'connections'],
    queryFn: async (): Promise<AdminConnection[]> => {
      const { data } = await api.get('/api/v1/admin/connections')
      return data
    },
  })
}

/** Asks Meta about one connection and saves the result. */
export function useCheckConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: { source: AdminConnection['source']; id: string }) => {
      const path = c.source === 'WHATSAPP' ? 'whatsapp' : 'platform'
      const { data } = await api.post(`/api/v1/admin/connections/${path}/${c.id}/check`)
      return data as AdminConnection
    },
    // A check can change dashboard alerts as well as this list.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}