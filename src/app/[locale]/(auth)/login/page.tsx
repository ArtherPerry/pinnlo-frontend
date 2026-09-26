'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { Input, Button } from '@/components/ui'
import api from '@/lib/api'
import { setAccessToken } from '@/lib/token'

export default function LoginPage() {
  const [email,    setEmail   ] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError   ] = useState('')
  const [loading,  setLoading ] = useState(false)
  const [notice, setNotice] = useState('')

  // Sent here with a reason when an account was blocked mid-session. Read from
  // window.location rather than useSearchParams, which would need this page
  // restructured around a Suspense boundary.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason')
    const notices: Record<string, string> = {
      AGENCY_SUSPENDED:      "Your agency's account is suspended. Please contact Movio to restore access.",
      WORKSPACE_UNAVAILABLE: 'This workspace is temporarily unavailable. Please contact your agency.',
      AGENCY_PENDING:        'Your agency is still awaiting approval.',
      USER_INACTIVE:         "Your account is not active. Please contact your agency's owner.",
    }
    if (reason && notices[reason]) setNotice(notices[reason])
  }, [])

  const { setUser } = useAuth()
  const router      = useRouter()
  const locale      = useLocale()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
           const { data } = await api.post('/api/v1/auth/login', { email, password })

      // Store token for Axios interceptor
      if (typeof window !== 'undefined') {
        setAccessToken(data.token)
      }

            setUser(data.user)

      // Client users have no access to the agency dashboard — every call there
      // would 403. Send them to their own workspace.
      const destination = data.user.role === 'CLIENT' ? 'client' : 'dashboard'
      router.push(`/${data.user.locale ?? locale}/${destination}`)
        } catch (err) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response
      // 403 means the account exists but cannot be used right now — suspended,
      // or awaiting approval — and the server says which. Showing a generic
      // failure left people retrying a password that was never the problem.
      setError(
        response?.status === 401
          ? 'Invalid email or password'
          : response?.status === 403 && response.data?.message
            ? response.data.message
            : 'Login failed — please try again'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--color-white)',
        border: '0.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        width: '100%',
        maxWidth: 400,
        boxShadow: 'var(--shadow-md)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: 24, fontWeight: 700,
            color: 'var(--color-teal-600)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            Movio
          </div>
          <div style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
          }}>
            Social media management for Southeast Asia
          </div>
        </div>

        {/* Form */}
                {notice && (
          <div role="alert" style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: '#fff4e0',
            color: '#9a5b00',
            fontSize: 'var(--text-small)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-4)',
          }}>
            {notice}
          </div>
        )}
        <form onSubmit={handleLogin} style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
        }}>
          <Input
            label="Email address"
            type="email"
            placeholder="you@agency.co.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <div style={{
              padding: 'var(--space-3)',
              background: 'var(--color-danger-light)',
              border: '0.5px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-small)',
              color: 'var(--color-danger)',
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
          >
            Sign in
          </Button>
        </form>

        {/* Dev hint */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-3)',
            background: 'var(--color-bg-2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            color: 'var(--color-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--color-ink)' }}>Dev mode</strong><br/>
            Email: <code>sithu@area29labs.com</code><br/>
            Password: <code>test1234</code>
          </div>
        )}

      </div>
    </div>
  )
}