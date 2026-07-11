export function startImpersonation(impersonationToken: string) {
  const currentToken = localStorage.getItem('pinnlo-token')
  const currentAuth = localStorage.getItem('pinnlo-auth')

  if (currentToken) localStorage.setItem('pinnlo-admin-token', currentToken)
  if (currentAuth) localStorage.setItem('pinnlo-admin-auth', currentAuth)

  localStorage.setItem('pinnlo-token', impersonationToken)
  localStorage.removeItem('pinnlo-auth')
  localStorage.setItem('pinnlo-impersonating', 'true')

  window.location.href = '/en/dashboard'
}

export function exitImpersonation() {
  const adminToken = localStorage.getItem('pinnlo-admin-token')
  const adminAuth = localStorage.getItem('pinnlo-admin-auth')

  if (adminToken) localStorage.setItem('pinnlo-token', adminToken)
  if (adminAuth) localStorage.setItem('pinnlo-auth', adminAuth)

  localStorage.removeItem('pinnlo-admin-token')
  localStorage.removeItem('pinnlo-admin-auth')
  localStorage.removeItem('pinnlo-impersonating')

  window.location.href = '/en/admin'
}

export function isImpersonating(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('pinnlo-impersonating') === 'true'
}