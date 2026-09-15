'use client'

import { useEffect, useState } from 'react'

/**
 * Loads the Facebook JS SDK once, for WhatsApp Embedded Signup.
 *
 * The Meta page-connect flow uses a server redirect and never needs the SDK.
 * Embedded Signup is the one thing that requires it: the WABA id and
 * phone-number id come back through a postMessage event the SDK popup fires,
 * which has no redirect equivalent.
 *
 * The SDK only works on an HTTPS domain listed in the app's Allowed Domains, so
 * this does nothing useful on plain-HTTP localhost — the popup will refuse.
 */
declare global {
  interface Window {
    FB?: any
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
      window.FB.init({
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