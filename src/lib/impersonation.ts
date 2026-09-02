import api from '@/lib/api'
import { setAccessToken, isImpersonating as tokenIsImpersonating, impersonatorName } from '@/lib/token'

/**
 * Read-only support sessions.
 *
 * Previously this swapped tokens in localStorage and forced a page reload.
 * Now the server issues a separate refresh family for the support session,
 * so it is recorded, revocable, expires in an hour, and every write is
 * rejected server-side.
 *
 * Starting a session replaces the admin's own; there is no stashing and
 * restoring. Two simultaneously valid sessions for one person is exactly what
 * refresh-token reuse detection exists to prevent.
 */

export interface ImpersonationResult {
  token:      string
  agencyName: string
  ownerName:  string
  readOnly:   boolean
}

export async function startImpersonation(agencyId: string): Promise<ImpersonationResult> {
  const { data } = await api.post<ImpersonationResult>(
    `/api/v1/admin/agencies/${agencyId}/impersonate`
  )

  // The response also set an impersonation refresh cookie, replacing the
  // admin's. From here every request is the support session.
  setAccessToken(data.token)
  return data
}

export async function exitImpersonation(): Promise<void> {
  try {
    await api.post('/api/v1/auth/impersonate/exit')
  } finally {
    // Clear locally whatever the server said — a failed exit must not leave
    // someone stuck in a support session.
    setAccessToken(null)
  }
}

/** True when the current token is a support session. */
export function isImpersonating(): boolean {
  return tokenIsImpersonating()
}

/** The admin running the support session, for the banner. */
export function getImpersonator(): string | null {
  return impersonatorName()
}