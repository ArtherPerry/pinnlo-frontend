'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { WhatsappConnection, WhatsappTemplate,WhatsappConversation } from '@/lib/types'
import type { FacebookLoginResponse } from '@/hooks/useFacebookSdk'

const CONFIG_ID = process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID

export function useWhatsappConnections(clientId: string) {
  return useQuery({
    queryKey: ['whatsapp', 'connections', clientId],
    enabled:  Boolean(clientId),
    queryFn: async () => {
      const { data } = await api.get('/api/v1/whatsapp/connections', {
        params: { clientId },
      })
      return data.content as WhatsappConnection[]
    },
  })
}

/**
 * Runs Embedded Signup, then completes the connection server-side.
 *
 * Two values arrive by different routes: the `code` in the FB.login callback,
 * and the waba_id / phone_number_id through a separate message event. Both are
 * assembled here before posting to the backend, which exchanges the code for a
 * business token — the code never persists client-side.
 */
export function useConnectWhatsapp() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!window.FB) throw new Error('Facebook SDK not ready')
      if (!CONFIG_ID) throw new Error('WhatsApp signup is not configured')

      const signup = await launchEmbeddedSignup()
      const { data } = await api.post('/api/v1/whatsapp/connect', {
        clientId,
        wabaId:        signup.wabaId,
        phoneNumberId: signup.phoneNumberId,
        code:          signup.code,
      })
      return data as WhatsappConnection
    },
    onSuccess: (_c, clientId) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections', clientId] })
    },
  })
}

export function useDisconnectWhatsapp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/whatsapp/connections/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
    },
  })
}

/**
 * Wraps the SDK's two-source result into one promise.
 *
 * The message listener captures waba_id / phone_number_id from the
 * WA_EMBEDDED_SIGNUP / FINISH event; FB.login's callback gives the code. The
 * promise resolves only when both are in hand, rejects if the user cancels.
 */
function launchEmbeddedSignup(): Promise<{
  wabaId: string
  phoneNumberId: string
  code: string
}> {
  return new Promise((resolve, reject) => {
    let signupData: { wabaId?: string; phoneNumberId?: string } = {}

    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
          signupData = {
            wabaId:        data.data.waba_id,
            phoneNumberId: data.data.phone_number_id,
          }
        }
      } catch {
        // Non-JSON messages from the SDK — ignore.
      }
    }

    window.addEventListener('message', onMessage)

        // Guarded by the caller, which throws if the SDK isn't ready (line 35).
    window.FB!.login(
      (response: FacebookLoginResponse) => {
        window.removeEventListener('message', onMessage)
        const code = response?.authResponse?.code
        if (code && signupData.wabaId && signupData.phoneNumberId) {
          resolve({
            wabaId:        signupData.wabaId,
            phoneNumberId: signupData.phoneNumberId,
            code,
          })
        } else {
          reject(new Error('Signup was cancelled or incomplete'))
        }
      },
      {
        config_id:     CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {},                 // v4: products are set in the config, not here
      }
    )
  })
}

export function useWhatsappTemplates(connectionId: string | undefined) {
  return useQuery({
    queryKey: ['whatsapp', 'templates', connectionId],
    enabled:  Boolean(connectionId),
    queryFn: async () => {
      const { data } = await api.get('/api/v1/whatsapp/templates', {
        params: { connectionId },
      })
      return data.content as WhatsappTemplate[]
    },
  })
}

/**
 * Pulls the latest templates from the WABA. Meta owns their status, so a
 * template approved since the last sync only appears after re-syncing.
 */
export function useSyncWhatsappTemplates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data } = await api.post('/api/v1/whatsapp/templates/sync', null, {
        params: { connectionId },
      })
      return data as { synced: number }
    },
    onSuccess: (_r, connectionId) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'templates', connectionId] })
    },
  })
}


export function useWhatsappConversations(clientId?: string, status?: string) {
  return useQuery({
    queryKey: ['whatsapp', 'inbox', clientId, status],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (clientId) params.clientId = clientId
      if (status)   params.status   = status
      const { data } = await api.get('/api/v1/whatsapp/inbox/conversations', { params })
      return data.content as WhatsappConversation[]
    },
  })
}

export function useReplyWhatsapp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { data } = await api.post(
        `/api/v1/whatsapp/inbox/conversations/${id}/reply`, { text })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] })
    },
  })
}

export function useSetWhatsappConversationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/api/v1/whatsapp/inbox/conversations/${id}`, { status })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] })
    },
  })
}