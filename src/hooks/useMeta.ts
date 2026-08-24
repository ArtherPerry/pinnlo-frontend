import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { MetaPendingPage, PlatformConnectionDto } from '@/lib/types'

/** Connections for one client. */
export function useClientConnections(clientId: string | null) {
  return useQuery({
    queryKey: ['meta', 'connections', clientId],
    enabled:  !!clientId,
    queryFn: async () => {
      const { data } = await api.get<PlatformConnectionDto[]>(
        '/api/v1/meta/connections',
        { params: { clientId } }
      )
      return data
    },
  })
}

/**
 * Step 1 — ask the backend for a Facebook authorization URL, then hand the
 * browser over. A full-page redirect, not a popup: popups get blocked and
 * behave badly on mobile, and Meta reviewers do test on mobile.
 */
export function useStartMetaConnect() {
  return useMutation({
    mutationFn: async ({ clientId, locale }: { clientId: string; locale: string }) => {
      const { data } = await api.get<{ authUrl: string }>(
        '/api/v1/meta/connect',
        { params: { clientId, locale } }
      )
      return data.authUrl
    },
    onSuccess: (authUrl) => {
      window.location.href = authUrl
    },
  })
}

/** Step 3a — pages returned by Facebook, with tokens stripped server-side. */
export function useMetaPendingPages(nonce: string | null) {
  return useQuery({
    queryKey: ['meta', 'pending', nonce],
    enabled:  !!nonce,
    retry:    false,
    queryFn: async () => {
      const { data } = await api.get<{ clientId: string; pages: MetaPendingPage[] }>(
        `/api/v1/meta/pending/${nonce}`
      )
      return data
    },
  })
}

/** Step 3b — connect the chosen page. The token stays on the server. */
export function useConnectMetaPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ nonce, pageId }: { nonce: string; pageId: string }) => {
      const { data } = await api.post<{ connections: PlatformConnectionDto[] }>(
        '/api/v1/meta/connect-page',
        { nonce, pageId }
      )
      return data.connections
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meta', 'connections'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useDisconnectMetaConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/meta/connections/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meta', 'connections'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}