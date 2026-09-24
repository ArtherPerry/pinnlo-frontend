import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained build for the server: runs with `node server.js`, no
  // node_modules install needed there.
  output: 'standalone',
}
export default withNextIntl(nextConfig)