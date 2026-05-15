import type { Metadata } from 'next'
import type { Story } from '@/lib/types'
import { fetchStories, fetchHomeData } from '@/lib/api'
import NavBar from '@/components/NavBar'
import Link from 'next/link'
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

export const metadata: Metadata = {
  title: 'Real Love Stories | Misty Visuals',
  description: 'Wedding stories by Misty Visuals — luxury photography across India and worldwide.',
}

export default async function StoriesPage() {
  let stories: Story[] = []
  let inquiryBg = undefined

  try {
    stories = await fetchStories()
    const homeData = await fetchHomeData()
    inquiryBg = homeData?.sections?.find((s: any) => s.key === 'inquiry')?.content?.bgImage
  } catch {
    stories = []
  }

  return (
    <>
      <NavBar />
      <main style={{ paddingTop: 'var(--nav-h)', background: 'var(--linen)' }}>



        {/* ── Grid ── */}
        {stories.length > 0 ? (
          <div style={{ padding: 'clamp(2.5rem,5vh,4rem) var(--page-x) clamp(4rem,8vh,7rem)' }}>
            <div
              className="all-stories-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'clamp(1rem, 2vw, 2rem) clamp(1rem, 2vw, 2rem)',
              }}
            >
              {stories.map((story, i) => (
                <Link key={story.id} href={`/stories/${story.slug}`} style={{ display: 'block' }}>
                  <article className="hover-scale">
                    {/* Cover — 3:2 landscape, NO overlay */}
                    <div style={{
                      aspectRatio: '3/2',
                      overflow: 'hidden',
                      background: 'var(--linen-dark)',
                      marginBottom: '0.75rem',
                    }}>
                      {story.cover_image_url ? (
                        <picture>
                          {story.cover_image_mobile_url && (
                            <source media="(max-width: 767px)" srcSet={story.cover_image_mobile_url} type="image/webp" />
                          )}
                          <img
                            src={story.cover_image_url}
                            alt={story.title}
                            loading={i < 6 ? 'eager' : 'lazy'}
                            decoding="async"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </picture>
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--linen-dark)' }} />
                      )}
                    </div>

                    {/* Caption below — Centered, Pixieset style */}
                    <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--ink)',
                        marginBottom: '0.5rem',
                      }}>
                        {[story.title, story.location].filter(Boolean).join(' || ')}
                      </h3>
                      {(story.subtitle || story.date) && (
                        <p style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.625rem',
                          fontWeight: 400,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-light)',
                        }}>
                          {story.subtitle || formatDate(story.date)}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
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


      <style>{`
        @media (max-width: 900px) {
          .all-stories-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .all-stories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
