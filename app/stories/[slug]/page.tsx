import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchStory } from '@/lib/api'
import NavBar from '@/components/NavBar'
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
    const desc  = [story.location, story.date].filter(Boolean).join(' · ')
    return {
      title: `${story.title} | Misty Visuals`,
      description: desc || 'Wedding photography by Misty Visuals.',
      openGraph: {
        title: story.title,
        images: story.cover_image_url ? [story.cover_image_url] : [],
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
  try {
    story = await fetchStory(slug)
  } catch {
    notFound()
  }

  return (
    <>
      <NavBar />
      <main style={{ paddingTop: 'var(--nav-h)', background: 'var(--linen)' }}>

        {/* ── Story header — Naman Verma style ──
            Full-width cover image, text BELOW it, no overlay */}
        <div style={{ padding: '3rem var(--page-x) 0' }}>

          {/* Cover image — no text on it, no overlay */}
          <div style={{
            width: '100%',
            maxHeight: '88vh',
            overflow: 'hidden',
            background: 'var(--linen-dark)',
          }}>
            {story.cover_image_url ? (
              <picture>
                {story.cover_image_mobile_url && (
                  <source media="(max-width: 767px)" srcSet={story.cover_image_mobile_url} type="image/webp" />
                )}
                <img
                  src={story.cover_image_url}
                  alt={story.title}
                  fetchPriority="high"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '88vh',
                    objectFit: 'cover',
                    objectPosition: 'center 25%',
                    display: 'block',
                  }}
                />
              </picture>
            ) : null}
          </div>

          {/* Title block — BELOW the image, not on it */}
          <div style={{
            padding: 'clamp(1.5rem, 4vh, 2.5rem) 0 clamp(2.5rem, 6vh, 4rem)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 4vw, 3.5rem)',
                fontWeight: 400,
                letterSpacing: '0.06em',
                color: 'var(--ink)',
                lineHeight: 1,
                marginBottom: '0.625rem',
              }}>
                {story.title}
              </h1>
              {story.subtitle && (
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)',
                  fontWeight: 300,
                  color: 'var(--ink-mid)',
                }}>
                  {story.subtitle}
                </p>
              )}
            </div>
            {/* Caption right — LOCATION // DATE // */}
            <p className="t-caption" style={{ textAlign: 'right' }}>
              {[story.location?.toUpperCase(), formatDate(story.date)?.toUpperCase(), story.category?.toUpperCase()]
                .filter(Boolean).join(' // ')}
              {(story.location || story.date || story.category) ? ' //' : ''}
            </p>
          </div>
        </div>

        {/* ── Gallery ── */}
        <div style={{ padding: 'clamp(1.5rem, 3vh, 2.5rem) 0' }}>
          <StoryGallery photos={story.photos} />
        </div>

        {/* ── Photo count footer ── */}
        {story.photos.length > 0 && (
          <div style={{
            padding: 'clamp(1.5rem, 3vh, 2.5rem) var(--page-x)',
            borderTop: '1px solid var(--border)',
            textAlign: 'right',
          }}>
            <span className="t-caption">{story.photos.length} photographs</span>
          </div>
        )}

        {/* ── CTA ── */}
        <InquiryCTA headline="Begin Your Story" />
      </main>
    </>
  )
}
