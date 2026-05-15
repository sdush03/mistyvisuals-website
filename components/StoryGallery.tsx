'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StoryPhoto } from '@/lib/types'

interface Props { photos: StoryPhoto[] }

export default function StoryGallery({ photos }: Props) {
  const [lb, setLb] = useState<number | null>(null)

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (lb === null) return
      if (e.key === 'Escape')       setLb(null)
      if (e.key === 'ArrowRight')   setLb(i => i !== null && i < photos.length - 1 ? i + 1 : i)
      if (e.key === 'ArrowLeft')    setLb(i => i !== null && i > 0 ? i - 1 : i)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [lb, photos.length])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lb !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lb])

  const prev = useCallback(() => setLb(i => i !== null && i > 0 ? i - 1 : i), [])
  const next = useCallback(() => setLb(i => i !== null && i < photos.length - 1 ? i + 1 : i), [photos.length])

  if (!photos.length) return null

  return (
    <>
      {/* ── Masonry columns ── */}
      <div
        className="story-masonry"
        style={{
          columns: '3 300px',
          columnGap: '6px',
          padding: '0 var(--page-x)',
        }}
      >
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            onClick={() => setLb(i)}
            style={{
              marginBottom: '6px',
              breakInside: 'avoid',
              cursor: 'zoom-in',
              overflow: 'hidden',
              lineHeight: 0,
            }}
            className="gallery-item"
          >
            <img
              src={photo.file_url_thumb || photo.file_url}
              srcSet={`${photo.file_url_thumb || photo.file_url} 600w, ${photo.file_url} 1920w`}
              sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
              alt=""
              loading={i < 4 ? 'eager' : 'lazy'}
              decoding="async"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                background: photo.blur_data_url ? `url(${photo.blur_data_url}) no-repeat center/cover` : 'var(--linen-dark)',
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {lb !== null && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(10,8,6,0.97)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setLb(null)}
        >
          {/* Image */}
          <img
            src={photos[lb].file_url}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '96vw', maxHeight: '94vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />

          {/* Prev */}
          {lb > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous"
              style={{
                position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '1rem', color: 'rgba(255,255,255,0.5)',
              }}
            >
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"><polyline points="9,1 1,9 9,17"/></svg>
            </button>
          )}

          {/* Next */}
          {lb < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next"
              style={{
                position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '1rem', color: 'rgba(255,255,255,0.5)',
              }}
            >
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"><polyline points="1,1 9,9 1,17"/></svg>
            </button>
          )}

          {/* Close */}
          <button
            onClick={() => setLb(null)}
            aria-label="Close"
            style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', padding: '0.5rem',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
            </svg>
          </button>

          {/* Counter */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-sans)', fontSize: '0.5rem', letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            {lb + 1} &nbsp;/&nbsp; {photos.length}
          </div>
        </div>
      )}

      <style>{`
        @media (hover: hover) {
          .gallery-item:hover img { opacity: 0.9; transition: opacity 0.3s ease; }
        }
        @media (max-width: 560px) {
          .story-masonry { columns: 2 140px !important; padding: 0 0.75rem !important; column-gap: 4px !important; }
        }
      `}</style>
    </>
  )
}
