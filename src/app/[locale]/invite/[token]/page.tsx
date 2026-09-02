'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { Input, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { apiErrorMessage } from '@/lib/utils'
import api from '@/lib/api'
import { setAccessToken } from '@/lib/token'
import styles from '../invite.module.css'

interface InvitationPreview {
  email:      string
  clientName: string
  agencyName: string
}

/**
 * Accepting a client-workspace invitation.
 *
 * Deliberately outside the (dashboard) route group: the invitee has no account
 * yet, so this page must render without a session. Authorisation comes from
 * possession of the link, which the server checks against a stored hash.
 */
export default function AcceptInvitePage() {
  const params  = useParams<{ token: string }>()
  const router  = useRouter()
  const locale  = useLocale()
  const setUser = useAuth((s) => s.setUser)

  const token = params.token

  const [name,     setName    ] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm ] = useState('')
  const [error,    setError   ] = useState('')
  const [saving,   setSaving  ] = useState(false)

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invitation', token],
    retry:    false,
    queryFn: async () => {
      const { data } = await api.get<InvitationPreview>(`/api/v1/invitations/${token}`)
      return data
    },
  })

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post(`/api/v1/invitations/${token}/accept`, {
        name: name.trim(),
        password,
      })

      // The server signs the new account in immediately — they just proved they
      // hold the link, so a separate login step would be friction only.
      setAccessToken(data.token)
      setUser(data.user)
      router.push(`/${locale}/client`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not accept this invitation'))
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.loading}>Checking your invitation…</p>
        </div>
      </div>
    )
  }

  if (isError || !invite) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.invalidTitle}>This link is no longer valid</h1>
          <p className={styles.invalidBody}>
            Invitation links expire after 7 days and can only be used once. Ask
            your agency to send a new one.
          </p>
          <Button variant="secondary" onClick={() => router.push(`/${locale}/login`)}>
            Go to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Set up your account</h1>
        <p className={styles.intro}>
          <strong>{invite.agencyName}</strong> has invited you to review and
          approve posts for <strong>{invite.clientName}</strong>.
        </p>

        <form onSubmit={handleAccept} className={styles.form}>
          <Input label="Email" value={invite.email} readOnly disabled />

          <Input
            label="Your name"
            placeholder="Somchai Jaidee"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <Input
            label="Choose a password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" loading={saving} disabled={saving}>
            {saving ? 'Setting up…' : 'Create account'}
          </Button>
        </form>

        <p className={styles.scopeNote}>
          You will only be able to see {invite.clientName}&apos;s posts — nothing
          else in {invite.agencyName}&apos;s account.
        </p>
      </div>
    </div>
  )
}