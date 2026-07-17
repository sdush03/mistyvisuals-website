import type { NextConfig } from 'next'

// Public URL for client-side fetches (browser)
// Internal URL for server-side rewrites (avoids DNS/SSL overhead)
const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*',   destination: `${INTERNAL_API}/api/:path*` },
      { source: '/media/:path*', destination: `${INTERNAL_API}/media/:path*` },
    ]
  },
  async redirects() {
    return [
      {
        source: '/wa',
        destination: '/?utm_source=whatsapp&utm_medium=chat',
        permanent: false,
      },
      {
        source: '/chat',
        destination: '/?utm_source=whatsapp&utm_medium=chat',
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'mistyvisuals.com' },
      { protocol: 'https', hostname: '*.mistyvisuals.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
    formats: ['image/webp'],
  },
}

export default nextConfig
