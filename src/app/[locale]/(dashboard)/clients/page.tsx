'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button, Badge,Input } from '@/components/ui'
import { useClients, useClient, useDeleteClient, type Client } from '@/hooks/useClients'
import { useToast } from '@/hooks/useToast'
import { ConnectedPlatforms } from '@/components/features/ConnectedPlatforms'
import { ClientUsers } from '@/components/features/ClientUsers'
import { MetaPagePicker } from '@/components/features/MetaPagePicker'
import { ClientFormModal } from '@/components/features/ClientFormModal'
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
  const [showForm,    setShowForm]    = useState(false)
  const [editClient,  setEditClient]  = useState<Client | null>(null)

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
        <div className={styles.headerActions}>
          <Button onClick={() => setShowForm(true)}>Add client</Button>
          <div className={styles.workspaceCounter}>
            <div className={styles.counterValue}>
              {clients?.length ?? 0} / {PLAN_LIMIT}
            </div>
            <div className={styles.counterLabel}>clients used</div>
          </div>
        </div>
      </div>

      {isLoading && <div className={styles.list}>Loading clients...</div>}

      {isError && (
        <div className={styles.list}>
          Could not load clients. Check that the API is running.
        </div>
      )}

      {clients && clients.length === 0 && (
        <div className={styles.emptyState}>
          <p>No clients yet. Add your first one to start scheduling posts.</p>
          <Button onClick={() => setShowForm(true)}>Add client</Button>
        </div>
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
        <ClientDrawer
          client={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setEditClient(selected)
            setSelectedId(null)
          }}
        />
      )}

      {(showForm || editClient) && (
        <ClientFormModal
          client={editClient ?? undefined}
          onClose={() => {
            setShowForm(false)
            setEditClient(null)
          }}
        />
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

function ClientDrawer({
  client,
  onClose,
  onEdit,
}: {
  client: Client
  onClose: () => void
  onEdit: () => void
}) {
  const toast = useToast()
  const [confirmText, setConfirmText] = useState('')
  const [showDelete,  setShowDelete]  = useState(false)

  // The list's copy seeds this, then the fetch corrects it.
  const { data: fresh } = useClient(client.id, client)
  const shown = fresh ?? client

  const deleteClient = useDeleteClient()

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id)
      toast.show(`${shown.name} deleted`, 'success')
      onClose()
    } catch {
      toast.show('Failed to delete client', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerTitle}>{shown.name}</div>
            <Badge variant={shown.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {shown.status}
            </Badge>
          </div>
          <div className={styles.drawerActions}>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              &times;
            </button>
          </div>
        </div>

        <ConnectedPlatforms clientId={shown.id} clientName={shown.name} />

        <ClientUsers clientId={shown.id} clientName={shown.name} />

        {/* Deletion is irreversible and takes everything with it, so it asks
            for the name to be typed rather than a click-through confirm. */}
        <div className={styles.dangerZone}>
          {!showDelete ? (
            <button className={styles.dangerLink} onClick={() => setShowDelete(true)}>
              Delete this client
            </button>
          ) : (
            <>
              <div className={styles.dangerTitle}>Delete {shown.name}</div>
              <p className={styles.dangerBody}>
                This removes every post, contact, uploaded file, connected page and
                workspace login belonging to this client. Published posts already on
                Facebook or Instagram stay there. Nothing here can be recovered.
                To keep the history, set the status to Archived instead.
              </p>
              <Input
                label={`Type "${shown.name}" to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={shown.name}
              />
              <div className={styles.dangerActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowDelete(false); setConfirmText('') }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={confirmText !== shown.name || deleteClient.isPending}
                  onClick={handleDelete}
                >
                  {deleteClient.isPending ? 'Deleting…' : 'Delete permanently'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}