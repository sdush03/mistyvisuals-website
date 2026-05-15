// Shared TypeScript types for the public website

export interface Hero {
  id: number
  media_type: 'image' | 'video'
  media_url: string
  mobile_url: string | null
  poster_url: string | null
  headline: string | null
  subline: string | null
}

export interface Story {
  id: number
  slug: string
  title: string
  subtitle: string | null
  location: string | null
  date: string | null
  category: string | null
  cover_image_url: string | null
  cover_image_mobile_url: string | null
  cover_blur_data_url: string | null
  is_featured: boolean
  display_order: number
  is_published?: boolean
  photo_count?: number
}

export interface StoryPhoto {
  id: number
  story_id: number
  file_url: string
  file_url_mobile: string | null
  file_url_thumb: string | null
  blur_data_url: string | null
  is_cover: boolean
  display_order: number
}

export interface Film {
  id: number
  title: string
  subtitle: string | null
  location: string | null
  year: number | null
  thumbnail_url: string | null
  thumbnail_blur: string | null
  hls_url: string | null
  transcode_status: 'pending' | 'processing' | 'ready' | 'error'
  is_featured: boolean
  is_published: boolean
  display_order: number
}

export interface Testimonial {
  id: number
  quote: string
  client_name: string
  location: string | null
  year: number | null
}

export interface Section {
  key: string
  label: string
  is_visible: boolean
  display_order: number
  content: Record<string, string>
}

export interface HomeData {
  hero: Hero | null
  stories: Story[]
  films: Film[]
  testimonials: Testimonial[]
  sections: Section[]
}
