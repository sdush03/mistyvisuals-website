import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchStory, fetchHomeData } from '@/lib/api'
import Link from 'next/link'
import StoryGallery from '@/components/StoryGallery'
import InquiryCTA from '@/components/InquiryCTA'

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

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const story = await fetchStory(slug)
    const formattedDate = story.date ? formatDate(story.date) : null
    const desc  = [story.subtitle, story.location, formattedDate].filter(Boolean).join(' · ')
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
    const absImageUrl = story.cover_image_url 
      ? (story.cover_image_url.startsWith('http') ? story.cover_image_url : `${API_BASE}${story.cover_image_url}`)
      : null

    return {
      title: story.title,
      description: desc || 'Wedding photography by Misty Visuals.',
      openGraph: {
        title: story.title,
        description: desc || 'Wedding photography by Misty Visuals.',
        images: absImageUrl ? [absImageUrl] : [],
        type: 'article',
      },
    }
  } catch {
    return { title: 'Story | Misty Visuals' }
  }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  let story: Awaited<ReturnType<typeof fetchStory>>
  let inquiryBg = undefined
  try {
    story = await fetchStory(slug)
    const homeData = await fetchHomeData()
    const inquirySection = homeData?.sections?.find((s: any) => s.key === 'inquiry')
    inquiryBg = inquirySection?.content?.bgImage
  } catch {
    notFound()
  }

  const meta = story.date ? formatDate(story.date) : null

  return (
    <>
      <main style={{ background: '#fff' }}>

        {/* ── Full-bleed Cover ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100svh',
          minHeight: '560px',
          overflow: 'hidden',
          background: '#111',
        }}>
          {story.cover_image_url && (
            <picture>
              {story.cover_image_mobile_url && (
                <source media="(max-width: 767px)" srcSet={story.cover_image_mobile_url} type="image/webp" />
              )}
              <img
                src={story.cover_image_url}
                alt={story.title}
                fetchPriority="high"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 30%',
                }}
              />
            </picture>
          )}

          {/* Gradient overlay — bottom-heavy for legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.65) 100%)',
          }} />

          {/* Back arrow — top left */}
          <Link href="/stories" style={{
            position: 'absolute', top: '2.5rem', left: 'var(--page-x)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-sans)', fontSize: '0.5625rem',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: '#fff', textDecoration: 'none',
            fontWeight: 500, opacity: 1,
            transition: 'color 0.2s',
            zIndex: 10,
          }} className="back-link">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <polyline points="5,1 1,5 5,9" /><line x1="1" y1="5" x2="11" y2="5" />
            </svg>
            Portfolio
          </Link>

          {/* Centred title block */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            paddingLeft: 'var(--page-x)',
            paddingRight: 'var(--page-x)',
          }}>
            <h1 style={{
              fontFamily: '"Futura", "Trebuchet MS", Arial, sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 3.5rem)',
              fontWeight: 400,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 1.1,
              marginBottom: '1rem',
            }}>
              {story.title}
            </h1>
            {meta && (
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(0.7rem, 1.1vw, 0.875rem)',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#fff',
                marginBottom: '2.5rem',
              }}>
                {meta}
              </p>
            )}

            {/* Scroll CTA */}
            <a
              href="#gallery"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.5625rem',
                fontWeight: 500,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#fff',
                border: '1px solid #fff',
                padding: '0.9rem 2.25rem',
                textDecoration: 'none',
                transition: 'background 0.3s, border-color 0.3s',
              }}
              className="cover-cta"
            >
              View Gallery
            </a>
          </div>

          {/* Photo count — bottom left */}
          {story.photos.length > 0 && (
            <div style={{
              position: 'absolute', bottom: '1.75rem', left: 'var(--page-x)',
              fontFamily: 'var(--font-sans)', fontSize: '0.5rem',
              letterSpacing: '0.2em', color: '#fff',
              textTransform: 'uppercase',
            }}>
              {story.photos.length} photographs
            </div>
          )}

          {/* Logo — static, centred, slightly above the arrow */}
          <img
            src="/logo-white.png"
            alt="Misty Visuals"
            style={{
              position: 'absolute', bottom: '4rem', left: '50%',
              transform: 'translateX(-50%)',
              width: '112px', opacity: 1,
            }}
          />

          {/* Arrow — bounces at original position */}
          <div className="scroll-chevron" style={{
            position: 'absolute', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)',
          }}>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round">
              <polyline points="1,1 7,7 13,1" />
            </svg>
          </div>
        </div>

        {/* ── Couple Details ── */}
        <div id="details" style={{ 
          background: '#fff', 
          padding: 'clamp(2rem, 4vh, 4rem) var(--page-x)',
          textAlign: 'left',
          maxWidth: '800px',
          margin: '0'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
            fontWeight: 400,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            marginBottom: '0.5rem'
          }}>
            {story.title}
          </h2>
          
          {story.subtitle && (
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.625rem',
              fontWeight: 500,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--ink-mid)',
              marginBottom: '0.5rem'
            }}>
              {story.subtitle}
            </p>
          )}

          {(story.location || story.date) && (
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.625rem',
              fontWeight: 500,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--ink-mid)',
              marginBottom: '0'
            }}>
              {[story.location, formatDate(story.date)].filter(Boolean).join('  //  ')}
            </p>
          )}
        </div>

        {/* ── Gallery ── */}
        <div id="gallery" style={{ background: '#fff', paddingTop: '3px' }}>
          <StoryGallery photos={story.photos} tabs={story.tabs} />
        </div>

        {/* ── CTA ── */}
        <InquiryCTA headline="Begin Your Story" bgImage={inquiryBg} />

        <style>{`
          .cover-cta:hover {
            background: #fff !important;
            border-color: #fff !important;
            color: #000 !important;
          }
          .back-link:hover { color: #fff !important; opacity: 1 !important; }
          .scroll-chevron {
            animation: bounce 2.2s ease-in-out infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(5px); }
          }
        `}</style>
      </main>
    </>
  )
}
