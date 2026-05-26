'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Film } from '@/lib/types'

interface Props {
  films: Film[]
  heading?: string
  body?: string
  showFilters?: boolean
  hideViewAll?: boolean
  columns?: 2 | 3
}

export default function FilmsSection({ 
  films, 
  heading = 'CINEMATIC STORIES', 
  body,
  showFilters = false,
  hideViewAll = false,
  columns = 3
}: Props) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')

  if (!films.length) return null

  // Generate filters dynamically
  const categoriesSet = new Set<string>()
  films.forEach(film => {
    const dbCats = (film.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
    dbCats.forEach((c: string) => categoriesSet.add(c))
  })
  const dynamicFilters = ['All', ...Array.from(categoriesSet).sort()]

  const filteredFilms = !showFilters ? films : films.filter(film => {
    if (activeFilter === 'All') return true
    const dbCategories = (film.category || '').split(',').map((c: string) => c.trim().toLowerCase())
    if (dbCategories.includes(activeFilter.toLowerCase())) return true
    const searchString = `${film.title} ${film.subtitle || ''} ${film.location || ''}`.toLowerCase()
    if (activeFilter === 'Pre-Wedding' && searchString.includes('pre-wedding')) return true
    if (activeFilter === 'Destination' && searchString.includes('destination')) return true
    if (activeFilter === 'Intimate' && searchString.includes('intimate')) return true
    if (activeFilter === 'Night' && searchString.includes('night')) return true
    return false
  })

  return (
    <section style={{
      background: 'var(--linen)',
      padding: 'clamp(2.5rem,5vh,4rem) var(--page-x) clamp(4rem,8vh,7rem)',
    }}>
      {(heading || body) && (
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vh,4rem)', maxWidth: '600px', margin: '0 auto clamp(2.5rem,5vh,4rem)' }}>
          {heading && (
            <h2 className="mv-heading" style={{
              color: 'var(--ink)',
              marginBottom: body ? '1rem' : '0',
            }}>
              {heading}
            </h2>
          )}
          {body && (
            <p className="mv-body mobile-justify">
              {body}
            </p>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .mobile-justify {
            text-align: justify !important;
            text-align-last: left !important;
          }
        }
      `}</style>

      {/* ── Filters ── */}
      {showFilters && dynamicFilters.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 'clamp(1rem, 3vw, 2.5rem)',
          flexWrap: 'wrap',
          marginBottom: 'clamp(3rem, 5vh, 4rem)',
        }}>
          {dynamicFilters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.6875rem',
                fontWeight: 400,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: activeFilter === f ? '#000' : '#888',
                paddingBottom: '0.25rem',
                borderBottom: activeFilter === f ? '1px solid #000' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {filteredFilms.length > 0 ? (
        <div 
          className={columns === 2 ? "films-grid-2" : "films-grid-3"}
          style={{
            display: 'grid',
            gridTemplateColumns: columns === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 'clamp(1rem, 2vw, 2rem) clamp(1rem, 2vw, 2rem)',
          }}
        >
          {filteredFilms.map((film, i) => (
          <article 
            key={film.id} 
            onClick={() => {
              if (film.youtube_video_id) setActiveVideoId(film.youtube_video_id)
            }}
            style={{ cursor: film.youtube_video_id ? 'pointer' : 'default' }}
          >
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
                  loading={i < 6 ? 'eager' : 'lazy'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#2a2520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <polygon points="10,7 23,14 10,21" fill="rgba(255,255,255,0.3)" />
                  </svg>
                </div>
              )}
              {/* Option B Spotlight Glass Glaze */}
              <div className="glaze-overlay"></div>
              {/* Glassmorphic Play Badge */}
              {film.youtube_video_id && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 3
                }} className="play-overlay">
                  <div style={{
                    width: '3.75rem', height: '3.75rem',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.0)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 4,
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))',
                    transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                  }} className="play-circle">
                    <svg width="12" height="14" viewBox="0 0 14 16" className="play-triangle" style={{ marginLeft: '2px' }}>
                      <path d="M0 0v16l14-8z" fill="white" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Caption below — Centered, matching StoriesGrid */}
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
                {[film.title, film.location].filter(Boolean).join(' || ')}
              </h3>
              {film.subtitle && (
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  letterSpacing: '0.03em',
                  lineHeight: '1.5',
                  textTransform: 'none',
                  color: 'var(--ink-light)',
                  whiteSpace: 'pre-line',
                  maxWidth: '480px',
                  margin: '0.35rem auto 0',
                  textAlign: 'justify',
                }}>
                  {film.subtitle}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--ink-light)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            No films found in this category.
          </p>
          <button 
            onClick={() => setActiveFilter('All')}
            style={{ 
              marginTop: '1rem', background: 'none', border: '1px solid var(--border)', 
              padding: '0.5rem 1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.625rem', 
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              color: 'var(--ink)'
            }}
          >
            View All
          </button>
        </div>
      )}

      {/* ── View all link ── */}
      {!hideViewAll && (
        <div style={{ textAlign: 'center', marginTop: 'clamp(2.5rem,5vh,4rem)' }}>
        <Link href="/films" className="featured-cta" style={{
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
          View All Films
        </Link>
      </div>
      )}

      {/* Cinematic Modal */}
      {activeVideoId && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <button 
            onClick={() => setActiveVideoId(null)}
            style={{
              position: 'absolute', top: '1.5rem', right: '2rem',
              background: 'none', border: 'none', color: '#fff',
              fontSize: '2.5rem', cursor: 'pointer', padding: '0.5rem',
              zIndex: 10000,
              lineHeight: 1, fontWeight: 300
            }}
          >
            ×
          </button>
          
          <div style={{
            width: '90%', maxWidth: '1200px',
            aspectRatio: '16/9',
            background: '#000',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&vq=hd2160&playsinline=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <style>{`
        .hover-scale { overflow: hidden; }
        .hover-scale img { transition: transform 0.5s ease; }
        .featured-cta:hover { background: #000 !important; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 900px) {
          .films-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .films-grid-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) {
          .films-grid-3 { grid-template-columns: 1fr !important; }
        }

        /* Option B Spotlight Glass Glaze Styles */
        .glaze-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 20%,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(255, 255, 255, 0.18) 30%,
            rgba(255, 255, 255, 0.05) 35%,
            rgba(255, 255, 255, 0) 40%
          );
          background-size: 300% 100%;
          background-position: 120% 0;
          z-index: 2;
          pointer-events: none;
          transition: background-position 0s;
        }

        .play-triangle path {
          transition: fill 0.4s ease, transform 0.4s ease;
          transform-origin: center;
        }

        @media (hover: hover) {
          .hover-scale:hover img { transform: scale(1.04); }
          .hover-scale:hover .glaze-overlay {
            background-position: -20% 0;
            transition: background-position 1.2s cubic-bezier(0.25, 1, 0.5, 1);
          }
        }
      `}</style>
    </section>
  )
}
