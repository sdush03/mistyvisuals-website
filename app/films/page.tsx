import type { Metadata } from 'next'
import type { Film } from '@/lib/types'
import { fetchFilms, fetchHomeData } from '@/lib/api'
import NavBar from '@/components/NavBar'
import InquiryCTA from '@/components/InquiryCTA'
import FilmsSection from '@/components/FilmsSection'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  let ogImage = ''

  try {
    const homeData = await fetchHomeData()
    const hero = homeData?.hero
    if (hero) {
      ogImage = hero.media_type === 'image' ? hero.media_url : hero.poster_url || ''
    }
  } catch {}

  const ogUrl = ogImage ? `/api/og/films?img=${encodeURIComponent(ogImage)}` : '/api/og/films'

  return {
    title: 'Films by Misty Visuals',
    description: 'Luxury wedding films by Misty Visuals. Discover emotional, timeless, and immersive cinematic wedding stories captured worldwide.',
    openGraph: {
      title: 'Films by Misty Visuals',
      description: 'Luxury wedding films by Misty Visuals. Discover emotional, timeless, and immersive cinematic wedding stories captured worldwide.',
      type: 'website',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: 'Films by Misty Visuals' }],
    },
  }
}

export default async function FilmsPage() {
  let films: Film[] = []
  let inquiryBg = undefined

  let filmsBg = undefined

  try {
    films = await fetchFilms()
    const homeData = await fetchHomeData()
    const inquirySection = homeData?.sections?.find((s: any) => s.key === 'inquiry')
    inquiryBg = inquirySection?.content?.bgFilms || inquirySection?.content?.bgImage
    filmsBg = homeData?.sections?.find((s: any) => s.key === 'films')?.content?.bgImage
  } catch (e) {
    console.error(e)
  }

  // Cinematic placeholder for the half-page header
  const headerBgUrl = filmsBg || (films.length > 0 ? films[0].thumbnail_url : null) || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80'
  const isVideo = filmsBg ? /\.(mp4|webm|ogg|mov)$/i.test(filmsBg) : false

  return (
    <>
      <NavBar />
      <main style={{ background: 'var(--linen)' }}>
        
        {/* Half-page Full Bleed Header */}
        <section style={{
          position: 'relative',
          width: '100%',
          height: '75vh',
          minHeight: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* Background — image or video */}
          {isVideo ? (
            <video
              src={headerBgUrl}
              autoPlay muted loop playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', zIndex: 0,
              }}
            />
          ) : (
            headerBgUrl && (
              <img
                src={headerBgUrl}
                alt="Cinematic Films"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                }}
              />
            )
          )}
          
          {/* Dark Overlay for text legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
            zIndex: 1,
          }} />

          {/* Header Content */}
          <div style={{
            position: 'relative', zIndex: 2,
            textAlign: 'center', color: '#fff',
            padding: '0 var(--page-x)',
            marginTop: 'var(--nav-h)' // Push down slightly to balance with navbar
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
              Films by Misty Visuals
            </p>
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2.25rem, 4.5vw, 4rem)',
              fontWeight: 300,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              lineHeight: 1.05,
            }}>
              Love in Motion
            </h1>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(0.9rem, 1.4vw, 1.1rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '0.02em',
              opacity: 0.92,
              maxWidth: '520px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}>
              We go beyond documenting moments. We create films that breathe — immersive, emotional, and entirely yours.
            </p>
          </div>
        </section>

        {films.length > 0 ? (
          <FilmsSection films={films} heading="" showFilters={true} hideViewAll={true} columns={3} />
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '8rem var(--page-x)',
            color: 'var(--ink-light)',
          }}>
            <h2 className="mv-heading" style={{ color: 'var(--ink)', marginBottom: '1rem' }}>Cinematic Films</h2>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 300, fontStyle: 'italic' }}>
              Films coming soon.
            </p>
          </div>
        )}

        <InquiryCTA headline="LET'S BEGIN YOUR STORY" bgImage={inquiryBg} />
      </main>
    </>
  )
}
