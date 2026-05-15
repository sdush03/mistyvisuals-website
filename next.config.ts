import type { NextConfig } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*',   destination: `${API_URL}/api/:path*` },
      { source: '/media/:path*', destination: `${API_URL}/media/:path*` },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'mistyvisuals.com' },
      { protocol: 'https', hostname: '*.mistyvisuals.com' },
    ],
    formats: ['image/webp'],
  },
}

export default nextConfig
