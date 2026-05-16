'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StoryPhoto } from '@/lib/types'

interface Props { photos: StoryPhoto[], tabs?: string[] | null }

export default function StoryGallery({ photos, tabs }: Props) {
  const [activeTab, setActiveTab] = useState('All')
  const [lb, setLb] = useState<number | null>(null)
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth <= 640) setCols(1)
      else if (window.innerWidth <= 1024) setCols(2)
      else setCols(3)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const filteredPhotos = activeTab === 'All' ? photos : photos.filter(p => p.tab_name === activeTab)

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (lb === null) return
      if (e.key === 'Escape')       setLb(null)
      if (e.key === 'ArrowRight')   setLb(i => i !== null && i < filteredPhotos.length - 1 ? i + 1 : i)
      if (e.key === 'ArrowLeft')    setLb(i => i !== null && i > 0 ? i - 1 : i)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [lb, filteredPhotos.length])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lb !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lb])

  const prev = useCallback(() => setLb(i => i !== null && i > 0 ? i - 1 : i), [])
  const next = useCallback(() => setLb(i => i !== null && i < filteredPhotos.length - 1 ? i + 1 : i), [filteredPhotos.length])

  if (!photos.length) return null

  return (
    <>
      
      {tabs && tabs.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'flex-start', gap: '2rem', padding: '1.5rem var(--page-x) 0.5rem', flexWrap: 'wrap',
          background: '#fff', borderTop: '1px solid #f0f0f0'
        }}>
          {['All', ...tabs].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.6875rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: activeTab === tab ? '#000' : '#888',
                paddingBottom: '0.25rem',
                borderBottom: activeTab === tab ? '1px solid #000' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* ── Masonry columns ── */}
      <div
        className="story-masonry"
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px var(--page-x) 32px',
          background: '#fff',
        }}
      >
        {Array.from({ length: cols }).map((_, colIdx) => {
          const colPhotos = filteredPhotos.filter((_, i) => i % cols === colIdx);
          return (
            <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colPhotos.map((photo) => {
                const globalIdx = filteredPhotos.indexOf(photo);
                return (
                  <div
                    key={photo.id}
                    onClick={() => setLb(globalIdx)}
                    style={{
                      cursor: 'pointer',
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
                      loading={globalIdx < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        background: photo.blur_data_url ? `url(${photo.blur_data_url}) no-repeat center/cover` : 'var(--linen-dark)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
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
            src={filteredPhotos[lb].file_url}
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
          {lb < filteredPhotos.length - 1 && (
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
            {lb + 1} &nbsp;/&nbsp; {filteredPhotos.length}
          </div>
        </div>
      )}

      <style>{`
        @media (hover: hover) {
          .gallery-item:hover img { opacity: 0.88; transition: opacity 0.35s ease; }
        }
        @media (max-width: 640px) {
          .story-masonry { columns: 2 160px !important; padding: 8px 12px 24px !important; column-gap: 8px !important; }
        }
      `}</style>
    </>
  )
}
