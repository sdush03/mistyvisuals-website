import Link from 'next/link'
import type { Story } from '@/lib/types'

interface Props {
  stories: Story[]
  heading?: string
  body?: string
}

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

export default function FeaturedStories({ 
  stories, 
  heading = 'FEATURED STORIES',
  body = 'An editorial archive of modern romance. From intimate celebrations to luxury destination weddings, explore how we capture real love stories across India and worldwide.'
}: Props) {
  if (!stories.length) return null

  return (
    <section style={{ background: 'var(--linen)', padding: 'clamp(4rem,8vh,7rem) var(--page-x)' }}>

      {/* ── Section heading ── */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vh,5rem)', maxWidth: '600px', margin: '0 auto clamp(3rem,6vh,5rem)' }}>
        <h2 className="mv-heading" style={{
          color: 'var(--ink)',
          marginBottom: '0.875rem',
        }}>
          {heading}
        </h2>
        {body && (
          <p className="mv-body mobile-justify">
            {body}
          </p>
        )}
      </div>

      <style>{`
        @media (max-width: 960px) {
          .mobile-justify {
            text-align: justify !important;
            text-align-last: left !important;
          }
        }
      `}</style>

      {/* ── 3-column grid, NO overlays ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'clamp(1rem, 2vw, 2rem)',
      }}
        className="stories-grid"
      >
        {stories.map((story, i) => (
          <StoryCard key={story.id} story={story} priority={i < 3} />
        ))}
      </div>

      {/* ── View all link ── */}
      <div style={{ textAlign: 'center', marginTop: 'clamp(2.5rem,5vh,4rem)' }}>
        <Link href="/stories" className="featured-cta" style={{
          display: 'inline-block',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.6875rem',
          fontWeight: 400,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#ffffff',
          background: '#222',
          padding: '1.25rem 2rem',
          transition: 'background 0.3s ease',
        }}>
          View All
        </Link>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stories-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .stories-grid { grid-template-columns: 1fr !important; }
        }
        .featured-cta:hover { background: #000 !important; }
      `}</style>
    </section>
  )
}

function StoryCard({ story, priority }: { story: Story; priority: boolean }) {
  return (
    <Link href={`/stories/${story.slug}`} style={{ display: 'block' }}>
      <article className="hover-scale" style={{ cursor: 'pointer' }}>

        {/* ── Photo — NO overlay, NO gradient ── */}
        <div style={{
          overflow: 'hidden',
          aspectRatio: '3/2',
          background: 'var(--linen-dark)',
          marginBottom: '0.875rem',
        }}>
          {story.grid_image_url || story.cover_image_url ? (
            <img
              src={story.grid_image_url || story.cover_image_url || ''}
              alt={story.title}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--linen-dark)' }} />
          )}
        </div>

        {/* ── Caption below — Centered, Pixieset style ── */}
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
  )
}
