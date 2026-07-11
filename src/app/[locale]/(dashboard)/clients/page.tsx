'use client'

import { useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import styles from './clients.module.css'

interface ClientUser {
  id: string
  name: string
  email: string
}

interface ClientRow {
  id: string
  name: string
  status: string
  platforms: string[]
  workspaceEnabled: boolean
  users: ClientUser[]
}

const MOCK_CLIENTS: ClientRow[] = [
  { id: 'c1', name: 'Somjai Coffee', status: 'ACTIVE', platforms: ['FACEBOOK', 'INSTAGRAM'], workspaceEnabled: true,
    users: [{ id: 'u1', name: 'Somjai Owner', email: 'owner@somjai.co.th' }] },
  { id: 'c2', name: 'BKK Fitness', status: 'ACTIVE', platforms: ['FACEBOOK', 'LINE'], workspaceEnabled: false, users: [] },
  { id: 'c3', name: 'Mango Resort', status: 'ACTIVE', platforms: ['FACEBOOK', 'INSTAGRAM', 'LINE'], workspaceEnabled: false, users: [] },
]

const PLAN_LIMIT = 10 // mock: Agency plan allows 10 workspaces

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>(MOCK_CLIENTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = clients.find((c) => c.id === selectedId) ?? null
  const usedWorkspaces = clients.filter((c) => c.workspaceEnabled).length

  const updateClient = (id: string, patch: Partial<ClientRow>) => {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Clients</div>
          <div className={styles.subtitle}>Manage your clients and their workspace access</div>
        </div>
        <div className={styles.workspaceCounter}>
          <div className={styles.counterValue}>{usedWorkspaces} / {PLAN_LIMIT}</div>
          <div className={styles.counterLabel}>workspaces used</div>
        </div>
      </div>

      <div className={styles.list}>
        {clients.map((c) => (
          <div key={c.id} className={styles.clientCard}>
            <div className={styles.clientInfo}>
              <div className={styles.clientAvatar}>{getInitials(c.name)}</div>
              <div className={styles.clientMain}>
                <div className={styles.clientName}>{c.name}</div>
                <div className={styles.clientSub}>{c.platforms.join(' · ')}</div>
              </div>
            </div>
            <div className={styles.clientActions}>
              <div className={styles.workspaceStatus}>
                <span className={`${styles.statusDot} ${c.workspaceEnabled ? styles.statusDotActive : ''}`} />
                {c.workspaceEnabled ? 'Workspace on' : 'Workspace off'}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedId(c.id)}>
                Manage
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ClientDrawer
          client={selected}
          usedWorkspaces={usedWorkspaces}
          planLimit={PLAN_LIMIT}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateClient(selected.id, patch)}
        />
      )}
    </div>
  )
}

function ClientDrawer({
  client,
  usedWorkspaces,
  planLimit,
  onClose,
  onUpdate,
}: {
  client: ClientRow
  usedWorkspaces: number
  planLimit: number
  onClose: () => void
  onUpdate: (patch: Partial<ClientRow>) => void
}) {
  const toast = useToast()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [lastTempPw, setLastTempPw] = useState<string | null>(null)

  const atLimit = usedWorkspaces >= planLimit && !client.workspaceEnabled

  const toggleWorkspace = () => {
    if (atLimit) {
      toast.show(`You've reached your plan limit of ${planLimit} workspaces`, 'warning')
      return
    }
    onUpdate({ workspaceEnabled: !client.workspaceEnabled })
    toast.show(client.workspaceEnabled ? 'Workspace disabled' : 'Workspace enabled', 'success')
  }

  const invite = () => {
    if (!inviteEmail.trim()) { toast.show('Enter an email', 'warning'); return }
    const tempPw = 'Temp-' + Math.random().toString(36).slice(2, 10)
    const newUser: ClientUser = {
      id: `cu-${Date.now()}`,
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
    }
    onUpdate({ users: [...client.users, newUser] })
    setLastTempPw(tempPw)
    setInviteName('')
    setInviteEmail('')
    toast.show('Client user invited', 'success')
  }

  const removeUser = (id: string) => {
    onUpdate({ users: client.users.filter((u) => u.id !== id) })
    toast.show('Client user removed', 'info')
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerTitle}>{client.name}</div>
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>{client.status}</Badge>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.drawerSection}>
          <div className={styles.drawerSectionTitle}>Client Workspace</div>
          <div className={styles.workspaceToggle}>
            <div>
              <div className={styles.toggleInfo}>
                {client.workspaceEnabled ? 'Workspace is enabled' : 'Workspace is disabled'}
              </div>
              <div className={styles.toggleHint}>
                {client.workspaceEnabled
                  ? 'This client can log in to review posts and see reports.'
                  : 'Enable to let this client review posts and see reports.'}
              </div>
            </div>
            <Button
              variant={client.workspaceEnabled ? 'secondary' : 'primary'}
              size="sm"
              onClick={toggleWorkspace}
            >
              {client.workspaceEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {client.workspaceEnabled && (
          <div className={styles.drawerSection}>
            <div className={styles.drawerSectionTitle}>Client Users ({client.users.length})</div>

            {client.users.length === 0 && (
              <div className={styles.emptyUsers}>No client users yet. Invite one below.</div>
            )}
            {client.users.map((u) => (
              <div key={u.id} className={styles.userRow}>
                <div className={styles.userMain}>
                  <span className={styles.userNameText}>{u.name}</span>
                  <span className={styles.userEmailText}>{u.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeUser(u.id)}>Remove</Button>
              </div>
            ))}

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className={styles.userEmailText}
                style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                placeholder="Name (optional)"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  placeholder="client@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button variant="primary" size="sm" onClick={invite}>Invite</Button>
              </div>
            </div>

            {lastTempPw && (
              <div className={styles.tempPwBox}>
                Temporary password: <span className={styles.tempPwValue}>{lastTempPw}</span>
                <div style={{ marginTop: 4, color: 'var(--color-muted)' }}>
                  Share this with the client so they can log in.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}