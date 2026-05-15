import Link from 'next/link'
import type { Film } from '@/lib/types'

interface Props {
  films: Film[]
  heading?: string
}

export default function FilmsSection({ films, heading = 'Films' }: Props) {
  if (!films.length) return null

  return (
    <section style={{
      background: 'var(--linen)',
      padding: 'clamp(4rem,8vh,7rem) var(--page-x)',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vh,4rem)' }}>
        <h2 className="mv-heading" style={{
          color: 'var(--ink)',
          marginBottom: '0.875rem',
        }}>
          {heading}
        </h2>
      </div>

      {/* ── Film grid — 16:9 thumbnails, NO overlay ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
        gap: 'clamp(1rem, 2vw, 1.75rem)',
      }}>
        {films.map(film => (
          <Link key={film.id} href={`/films/${film.id}`} style={{ display: 'block' }}>
            <article style={{ cursor: 'pointer' }}>
              {/* Thumbnail */}
              <div style={{
                aspectRatio: '16/9',
                background: 'var(--ink)',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                position: 'relative',
              }} className="hover-scale">
                {film.thumbnail_url ? (
                  <img
                    src={film.thumbnail_url}
                    alt={film.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#2a2520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <polygon points="10,7 23,14 10,21" fill="rgba(255,255,255,0.3)" />
                    </svg>
                  </div>
                )}
                {/* Play icon overlay — subtle */}
                {film.thumbnail_url && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }} className="film-play">
                    <div style={{
                      width: '3rem', height: '3rem', borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="rgba(255,255,255,0.9)">
                        <polygon points="0,0 10,6 0,12" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              {/* Caption */}
              <p className="t-caption">{film.title.toUpperCase()}</p>
              {film.location && (
                <p className="t-caption" style={{ marginTop: '0.15rem', color: 'var(--border)' }}>{film.location.toUpperCase()}</p>
              )}
            </article>
          </Link>
        ))}
      </div>

      <style>{`
        .hover-scale:hover .film-play { opacity: 1 !important; }
      `}</style>
    </section>
  )
}
