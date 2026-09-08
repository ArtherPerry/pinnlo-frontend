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

/** Live page stats from Graph. */
export interface MetaPageInfo {
  id:               string
  name:             string
  fan_count?:       number
  followers_count?: number
}

/**
 * Follower counts for one connection, fetched live from Meta.
 *
 * Facebook only: fetchPageInfo asks Graph for fan_count, which does not exist
 * on an Instagram Business account, so an IG connection returns an error
 * rather than a smaller payload.
 *
 * A failure here is not worth surfacing — the row still shows the page name
 * and status, it just has no counts. Hence retry: false and a stale time, so
 * a dead connection does not re-hit Graph on every drawer open.
 */
export function usePageInfo(connectionId: string, enabled: boolean) {
  return useQuery({
    queryKey:  ['meta', 'pageInfo', connectionId],
    enabled,
    retry:     false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<MetaPageInfo>(
        `/api/v1/meta/connections/${connectionId}/info`
      )
      return data
    },
  })
}

/** Already resolved by the backend: one entry per card, labels included. */
export interface PageInsight {
  metric:      string
  label:       string
  periodLabel: string
  value:       number
  asOf:        string | null
}

/**
 * Page insights for one connection, live from Meta.
 *
 * Fetched only when asked for: this is a network round trip to Graph per
 * connection, so loading it for every row on drawer open would be several
 * external calls for a panel nobody opened.
 *
 * Facebook only, like usePageInfo — Instagram uses a different metric
 * vocabulary and the requested names would error.
 */
export function usePageInsights(connectionId: string, enabled: boolean) {
  return useQuery({
    queryKey:  ['meta', 'insights', connectionId],
    enabled,
    retry:     false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<PageInsight[]>(
        `/api/v1/meta/connections/${connectionId}/insights`
      )
      return data
    },
  })
}