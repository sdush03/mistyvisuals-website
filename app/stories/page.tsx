import type { Metadata } from 'next'
import type { Story } from '@/lib/types'
import { fetchStories, fetchHomeData } from '@/lib/api'
import NavBar from '@/components/NavBar'
import Link from 'next/link'
import InquiryCTA from '@/components/InquiryCTA'
import StoriesGrid from '@/components/StoriesGrid'

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  let ogImage = ''

  try {
    const stories = await fetchStories()
    if (stories.length > 0) {
      ogImage = stories[0].grid_image_url || stories[0].cover_image_url || ''
    }
  } catch {}

  const ogUrl = ogImage ? `/api/og/stories?img=${encodeURIComponent(ogImage)}` : '/api/og/stories'

  return {
    title: 'Misty Visuals Portfolio',
    description: 'Luxury wedding photography portfolio by Misty Visuals. Discover soft editorial, candid, and emotional love stories captured across India and worldwide.',
    openGraph: {
      title: 'Misty Visuals Portfolio',
      description: 'Luxury wedding photography portfolio by Misty Visuals. Discover soft editorial, candid, and emotional love stories captured across India and worldwide.',
      type: 'website',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: 'Misty Visuals Portfolio' }],
    },
  }
}

export default async function StoriesPage() {
  let stories: Story[] = []
  let inquiryBg = undefined
  let headerBg = undefined

  try {
    stories = await fetchStories()
    const homeData = await fetchHomeData()
    const inquirySection = homeData?.sections?.find((s: any) => s.key === 'inquiry')
    const storiesSection = homeData?.sections?.find((s: any) => s.key === 'stories')
    inquiryBg = inquirySection?.content?.bgStories || inquirySection?.content?.bgImage
    headerBg = storiesSection?.content?.bgImage
  } catch {
    stories = []
  }

  const finalHeaderBg = headerBg || (stories.length > 0 ? (stories[0].grid_image_url || stories[0].cover_image_url) : null)

  return (
    <>
      <NavBar />
      <main style={{ background: 'var(--linen)' }}>



        {/* ── Cinematic Header ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '75vh',
          minHeight: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {finalHeaderBg && (
            <img
              src={finalHeaderBg}
              alt="Portfolio"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
              }}
            />
          )}

          {/* Dark Overlay for text legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
            zIndex: 1,
          }} />

          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '0 var(--page-x)',
            color: '#ffffff',
            marginTop: 'var(--nav-h)', // Push down slightly to balance with navbar
          }}>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.6rem, 1vw, 0.75rem)',
              fontWeight: 400,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              opacity: 0.85,
              marginBottom: '1.25rem',
            }}>
              Weddings by Misty Visuals
            </p>
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2.25rem, 4.5vw, 4rem)',
              fontWeight: 300,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              lineHeight: 1.05,
              color: '#fff',
            }}>
              PORTFOLIO
            </h1>
            <p style={{ 
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(0.9rem, 1.4vw, 1.1rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '0.02em',
              opacity: 0.92,
              maxWidth: '600px', 
              margin: '0 auto',
              lineHeight: 1.7,
            }}>
              Unscripted moments and intentional design. A closer look into the unique celebrations we’ve had the honor of documenting.
            </p>
          </div>
        </div>

        {/* ── Filterable Grid ── */}
        {stories.length > 0 ? (
          <StoriesGrid stories={stories} />
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '8rem var(--page-x)',
            color: 'var(--ink-light)',
          }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 300, fontStyle: 'italic' }}>
              Stories coming soon.
            </p>
          </div>
        )}

        <InquiryCTA headline="LET'S BEGIN YOUR STORY" bgImage={inquiryBg} />
      </main>
    </>
  )
}
