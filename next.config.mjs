import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Clean URLs for the static marketing and legal pages in /public. The legal
  // addresses are registered with Meta, so they must not change.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/movio.html' },
        { source: '/privacy', destination: '/privacy.html' },
        { source: '/terms', destination: '/terms.html' },
        { source: '/data-deletion', destination: '/data-deletion.html' },
      ],
    }
  },
}
export default withNextIntl(nextConfig)