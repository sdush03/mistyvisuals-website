import type { HomeData, Story, Film } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const isDev    = process.env.NODE_ENV === 'development'

// ISR caching — pages revalidate in the background, Googlebot always gets fast HTML
function nextOpts(revalidateSeconds = 300): RequestInit {
  return { next: { revalidate: revalidateSeconds } }
}

export async function fetchHomeData(): Promise<HomeData> {
  const res = await fetch(`${API_BASE}/api/website/home`, nextOpts(300)) // 5 min cache
  if (!res.ok) throw new Error('Failed to fetch homepage data')
  return res.json()
}

export async function fetchStories(): Promise<Story[]> {
  const res = await fetch(`${API_BASE}/api/website/stories`, nextOpts(3600)) // 1 hr cache
  if (!res.ok) throw new Error('Failed to fetch stories')
  return res.json()
}

export async function fetchStory(slug: string): Promise<Story & { photos: import('./types').StoryPhoto[], films: import('./types').Film[], reels: import('./types').Reel[] }> {
  const res = await fetch(`${API_BASE}/api/website/stories/${slug}`, nextOpts(3600)) // 1 hr cache
  if (!res.ok) throw new Error('Story not found')
  return res.json()
}

export async function fetchFilms(): Promise<Film[]> {
  const res = await fetch(`${API_BASE}/api/website/films`, nextOpts(3600)) // 1 hr cache
  if (!res.ok) throw new Error('Failed to fetch films')
  return res.json()
}

// Admin fetch helpers — always fresh, sends cookies
export async function adminFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, { credentials: 'include', ...init })
}
