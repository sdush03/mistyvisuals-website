import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mistyvisuals.com'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
