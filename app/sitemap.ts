import { MetadataRoute } from 'next'
import { fetchStories } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mistyvisuals.com'

  // 1. Static routes
  const staticRoutes = [
    '',
    '/contact',
    '/films',
    '/stories',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // 2. Dynamic story routes
  try {
    const stories = await fetchStories()
    const storyRoutes = stories.map((story) => ({
      url: `${SITE_URL}/stories/${story.slug}`,
      lastModified: story.date ? new Date(story.date) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
    return [...staticRoutes, ...storyRoutes]
  } catch (error) {
    console.error('Error generating sitemap dynamically:', error)
    return staticRoutes
  }
}
