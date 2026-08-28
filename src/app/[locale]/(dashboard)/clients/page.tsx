'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import { useClients, type Client } from '@/hooks/useClients'
import { useToast } from '@/hooks/useToast'
import { ConnectedPlatforms } from '@/components/features/ConnectedPlatforms'
import { ClientUsers } from '@/components/features/ClientUsers'
import { MetaPagePicker } from '@/components/features/MetaPagePicker'
import styles from './clients.module.css'

const PLAN_LIMIT = 10 // TODO: read from the agency plan once the endpoint exists

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const META_ERRORS: Record<string, string> = {
  declined:        'Facebook connection was cancelled.',
  expired:         'That connection link expired. Please try again.',
  invalid_request: 'Facebook returned an invalid response. Please try again.',
  failed:          'Could not complete the Facebook connection. Please try again.',
}

export default function ClientsPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const toast        = useToast()

  const { data: clients, isLoading, isError } = useClients()

  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [pickerNonce, setPickerNonce] = useState<string | null>(null)

  // Returning from the Meta OAuth round trip: reopen the client's drawer and
  // show the page picker. Params are stripped so a refresh doesn't re-trigger.
  useEffect(() => {
    const clientId = searchParams.get('client')
    const session  = searchParams.get('metaSession')
    const error    = searchParams.get('metaError')

    if (!clientId && !session && !error) return

    if (clientId) setSelectedId(clientId)
    if (session)  setPickerNonce(session)
    if (error)    toast.show(META_ERRORS[error] ?? META_ERRORS.failed, 'error')

    router.replace(pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const selected = clients?.find((c) => c.id === selectedId) ?? null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Clients</div>
          <div className={styles.subtitle}>
            Manage your clients, their connected platforms and workspace access
          </div>
        </div>
        <div className={styles.workspaceCounter}>
          <div className={styles.counterValue}>
            {clients?.length ?? 0} / {PLAN_LIMIT}
          </div>
          <div className={styles.counterLabel}>clients used</div>
        </div>
      </div>

      {isLoading && <div className={styles.list}>Loading clients...</div>}

      {isError && (
        <div className={styles.list}>
          Could not load clients. Check that the API is running.
        </div>
      )}

      {clients && clients.length === 0 && (
        <div className={styles.list}>No clients yet.</div>
      )}

      {clients && clients.length > 0 && (
        <div className={styles.list}>
          {clients.map((c) => (
            <div key={c.id} className={styles.clientCard}>
              <div className={styles.clientInfo}>
                <div className={styles.clientAvatar}>{getInitials(c.name)}</div>
                <div className={styles.clientMain}>
                  <div className={styles.clientName}>{c.name}</div>
                  <div className={styles.clientSub}>
                    {c.platforms.length > 0
                      ? c.platforms.join(' - ')
                      : 'No platforms connected'}
                  </div>
                </div>
              </div>
              <div className={styles.clientActions}>
                <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {c.status}
                </Badge>
                <Button variant="secondary" size="sm" onClick={() => setSelectedId(c.id)}>
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <ClientDrawer client={selected} onClose={() => setSelectedId(null)} />
      )}

      {pickerNonce && (
        <MetaPagePicker
          nonce={pickerNonce}
          onClose={() => setPickerNonce(null)}
          onComplete={(clientId) => {
            setPickerNonce(null)
            setSelectedId(clientId)
          }}
        />
      )}
    </div>
  )
}

function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerTitle}>{client.name}</div>
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {client.status}
            </Badge>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <ConnectedPlatforms clientId={client.id} clientName={client.name} />

        <ClientUsers clientId={client.id} clientName={client.name} />
      </div>
    </div>
  )
}