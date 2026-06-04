'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--color-bg, #fff)',
          color: 'var(--color-text, #111)',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted, #666)' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-primary, #0070f3)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#fee',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              textAlign: 'left',
              maxWidth: '100%',
              overflow: 'auto',
            }}>
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
