'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface AuthedImageProps {
  /** API path that streams the bytes, e.g. /api/media/{id}/content */
  src:       string
  /** Direct URL when storage serves publicly. Used in preference to src. */
  publicUrl?: string | null
  alt:       string
  className?: string
}

/**
 * Renders an image from an authenticated endpoint.
 *
 * A plain <img src> is a bare browser request with no Authorization header, so
 * anything behind auth returns 403. The bytes are fetched through the axios
 * instance (which attaches the JWT) and turned into an object URL.
 *
 * When storage can serve publicly — R2 with a public bucket — publicUrl is
 * used directly and none of this runs.
 */
export function AuthedImage({ src, publicUrl, alt, className }: AuthedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (publicUrl) return

    let cancelled = false
    let created: string | null = null

    const load = async () => {
      try {
        const response = await api.get(src, { responseType: 'blob' })
        if (cancelled) return
        created = URL.createObjectURL(response.data)
        setObjectUrl(created)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    load()

    return () => {
      cancelled = true
      // Object URLs are held until revoked; skipping this leaks memory as the
      // user scrolls a library.
      if (created) URL.revokeObjectURL(created)
    }
  }, [src, publicUrl])

  const resolved = publicUrl ?? objectUrl

  if (failed) {
    return (
      <div
        className={className}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-bg-subtle, #f4f4f4)',
          color: 'var(--color-muted, #888)', fontSize: 11,
        }}
      >
        Unavailable
      </div>
    )
  }

  if (!resolved) {
    return (
      <div
        className={className}
        style={{ background: 'var(--color-bg-subtle, #f0f0f0)' }}
        aria-busy="true"
      />
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} alt={alt} className={className} />
}