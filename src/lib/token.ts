/**
 * The access token, held in memory.
 *
 * Not localStorage: anything readable by JavaScript is readable by an injected
 * script, and an access token is a bearer credential — whoever holds it is the
 * user. Keeping it in a module variable means an XSS bug can steal a token
 * that expires in 15 minutes rather than one that lasts a day, and cannot
 * exfiltrate a session that survives the tab closing.
 *
 * The refresh token lives in an HttpOnly cookie that no script can read, which
 * is what keeps the session alive across reloads.
 */

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = null
}

/**
 * True when the current session is a read-only support session.
 *
 * Read from the token rather than tracked separately, so it cannot drift out
 * of step with what the server will actually allow.
 */
export function isImpersonating(): boolean {
  const claims = decodeClaims()
  return claims?.impersonation === true
}

export function impersonatorName(): string | null {
  return decodeClaims()?.impersonatedBy ?? null
}

interface TokenClaims {
  impersonation?: boolean
  impersonatedBy?: string
  exp?: number
}

/**
 * Reads the payload without verifying the signature.
 *
 * Safe here because nothing security-relevant depends on it: the server
 * verifies every request. This is only for deciding what to show.
 */
function decodeClaims(): TokenClaims | null {
  if (!accessToken) return null
  try {
    const payload = accessToken.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}