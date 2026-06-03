'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { Input, Button } from '@/components/ui'
import api from '@/lib/api'

export default function LoginPage() {
  const [email,    setEmail   ] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError   ] = useState('')
  const [loading,  setLoading ] = useState(false)

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
      // MSW intercepts this — returns mock user + token
      const { data } = await api.post('/api/v1/auth/login', { email, password })

      // Store token for Axios interceptor
      if (typeof window !== 'undefined') {
        localStorage.setItem('pinnlo-token', data.token)
      }

      setUser(data.user)
      router.push(`/${data.user.locale ?? locale}/dashboard`)
    } catch (err) {
  const status = (err as { response?: { status?: number } })?.response?.status
  setError(
    status === 401
      ? 'Invalid email or password'
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
            Pinnlo
          </div>
          <div style={{
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
          }}>
            Social media management for Southeast Asia
          </div>
        </div>

        {/* Form */}
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
            Email: <code>nattawut@agency.com</code><br/>
            Password: <code>pinnlo2026</code>
          </div>
        )}

      </div>
    </div>
  )
}