'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Button, Input, Badge } from '@/components/ui'
import {
  useClientUsers,
  useClientInvitations,
  useInviteClientUser,
  useRevokeInvitation,
  useRevokeClientAccess,
  type ClientInvitation,
} from '@/hooks/useClientUsers'
import { useToast } from '@/hooks/useToast'
import { apiErrorMessage, formatDate } from '@/lib/utils'
import { Copy, Check, Info, UserPlus } from 'lucide-react'
import styles from './ClientUsers.module.css'

const STATUS_VARIANT: Record<ClientInvitation['status'], 'success' | 'warning' | 'neutral'> = {
  ACCEPTED: 'success',
  PENDING:  'warning',
  REVOKED:  'neutral',
  EXPIRED:  'neutral',
}

interface Props {
  clientId:   string
  clientName: string
}

export function ClientUsers({ clientId, clientName }: Props) {
  const locale = useLocale()
  const toast  = useToast()

  const { data: users }       = useClientUsers(clientId)
  const { data: invitations } = useClientInvitations(clientId)
  const invite        = useInviteClientUser()
  const revokeInvite  = useRevokeInvitation()
  const revokeAccess  = useRevokeClientAccess()

  const [email, setEmail] = useState('')
  const [name,  setName ] = useState('')
  const [copied, setCopied] = useState(false)

  /**
   * The link is shown once and never returned again — the server keeps only a
   * hash. It stays on screen until dismissed rather than disappearing on the
   * next render, because losing it means revoking and reissuing.
   */
  const [issuedLink, setIssuedLink] = useState<{ url: string; email: string } | null>(null)

  const pending = invitations?.filter((i) => i.status === 'PENDING') ?? []
  const past    = invitations?.filter((i) => i.status !== 'PENDING') ?? []

  const handleInvite = async () => {
    if (!email.trim()) return
    try {
      const created = await invite.mutateAsync({
        clientId,
        email: email.trim(),
        name:  name.trim() || undefined,
      })
      if (created.inviteUrl) {
        setIssuedLink({ url: created.inviteUrl, email: created.email })
      }
      setEmail('')
      setName('')
      setCopied(false)
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not create the invitation'), 'error')
    }
  }

  const copyLink = async () => {
    if (!issuedLink) return
    try {
      await navigator.clipboard.writeText(issuedLink.url)
      setCopied(true)
      toast.show('Link copied', 'success')
    } catch {
      toast.show('Could not copy — select the link and copy manually', 'error')
    }
  }

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      await revokeInvite.mutateAsync({ clientId, invitationId })
      toast.show('Invitation revoked', 'success')
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not revoke'), 'error')
    }
  }

  const handleRevokeAccess = async (userId: string, userEmail: string) => {
    if (!confirm(`Remove ${userEmail}'s access to ${clientName}?`)) return
    try {
      await revokeAccess.mutateAsync({ clientId, userId })
      toast.show('Access removed', 'success')
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not remove access'), 'error')
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Client access</div>
      <p className={styles.intro}>
        People at {clientName} who can sign in to review, comment on and approve
        posts. They cannot see anything else in your agency.
      </p>

      {/* People with access */}
      {users && users.length > 0 && (
        <div className={styles.list}>
          {users.map((user) => (
            <div key={user.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowName}>{user.name}</div>
                <div className={styles.rowMeta}>{user.email}</div>
              </div>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {user.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeAccess(user.id, user.email)}
                disabled={revokeAccess.isPending}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className={styles.list}>
          {pending.map((inv) => (
            <div key={inv.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowName}>{inv.name || inv.email}</div>
                <div className={styles.rowMeta}>
                  Invited · expires {formatDate(inv.expiresAt, locale, { dateStyle: 'medium' })}
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeInvite(inv.id)}
                disabled={revokeInvite.isPending}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* The one-time link */}
      {issuedLink && (
        <div className={styles.linkPanel}>
          <div className={styles.linkHead}>
            <Info size={15} />
            <span>
              Send this link to <strong>{issuedLink.email}</strong>. It is shown
              once and expires in 7 days.
            </span>
          </div>

          <div className={styles.linkRow}>
            <input
              className={styles.linkInput}
              value={issuedLink.url}
              readOnly
              onFocus={(e) => e.target.select()}
              aria-label="Invitation link"
            />
            <Button variant="primary" size="sm" onClick={copyLink}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </Button>
          </div>

          <button
            type="button"
            className={styles.dismiss}
            onClick={() => setIssuedLink(null)}
          >
            {copied ? 'Done' : "I've saved it — dismiss"}
          </button>
        </div>
      )}

      {/* Invite form */}
      <div className={styles.inviteForm}>
        <Input
          label="Name (optional)"
          placeholder="Somchai"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="owner@company.co.th"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInvite() } }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleInvite}
          disabled={!email.trim() || invite.isPending}
        >
          <UserPlus size={14} /> {invite.isPending ? 'Creating…' : 'Create invite'}
        </Button>
      </div>

      {/* Past invitations, collapsed by default weight */}
      {past.length > 0 && (
        <details className={styles.past}>
          <summary>Past invitations ({past.length})</summary>
          {past.map((inv) => (
            <div key={inv.id} className={styles.pastRow}>
              <span>{inv.email}</span>
              <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
            </div>
          ))}
        </details>
      )}
    </div>
  )
}