import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n'

const intl = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

/**
 * Marketing and legal pages, served from /public by the rewrites in
 * next.config.mjs. The middleware only has to stay out of their way:
 * rewriting here made Next.js proxy to https://localhost behind the tunnel.
 */
const PUBLIC_PAGES = new Set(['/', '/privacy', '/terms', '/data-deletion'])

export default function middleware(request: NextRequest) {
  if (PUBLIC_PAGES.has(request.nextUrl.pathname)) {
    return NextResponse.next()
  }
  return intl(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}