'use client'

import { useEffect, useState } from 'react'

/** The parts of Meta's JavaScript SDK this app uses. */
export interface FacebookLoginResponse {
  status?: string
  authResponse?: { code?: string; accessToken?: string } | null
}

interface FacebookSdk {
  init: (options: Record<string, unknown>) => void
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options?: Record<string, unknown>,
  ) => void
}

declare global {
  interface Window {
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID

export function useFacebookSdk() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!APP_ID) return
    if (window.FB) { setReady(true); return }

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId:   APP_ID,
        cookie:  true,
        xfbml:   false,
        version: 'v23.0',
      })
      setReady(true)
    }

    if (!document.getElementById('facebook-jssdk')) {
      const s = document.createElement('script')
      s.id = 'facebook-jssdk'
      s.src = 'https://connect.facebook.net/en_US/sdk.js'
      s.async = true
      s.defer = true
      document.body.appendChild(s)
    }
  }, [])

  return ready
}