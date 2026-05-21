'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StoryPhoto } from '@/lib/types'

interface Props { photos: StoryPhoto[], tabs?: string[] | null }

export default function StoryGallery({ photos, tabs }: Props) {
  const [activeTab, setActiveTab] = useState('All')
  const [lb, setLb] = useState<number | null>(null)
  const [cols, setCols] = useState(4)
  const [aspects, setAspects] = useState<Record<number, number>>({})

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth <= 640) setCols(1)
      else if (window.innerWidth <= 1024) setCols(2)
      else if (window.innerWidth <= 1280) setCols(3)
      else setCols(4)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const filteredPhotos = activeTab === 'All' ? photos : photos.filter(p => p.tab_name === activeTab)

  // Track aspect ratios of images as they are loaded by the browser (very fast, layout shifts are minimal)
  useEffect(() => {
    filteredPhotos.forEach(photo => {
      if (aspects[photo.id]) return
      const img = new Image()
      img.src = photo.file_url_thumb || photo.file_url
      img.onload = () => {
        setAspects(prev => {
          if (prev[photo.id] === img.naturalWidth / img.naturalHeight) return prev
          return { ...prev, [photo.id]: img.naturalWidth / img.naturalHeight }
        })
      }
    })
  }, [filteredPhotos, aspects])

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

  // Dynamically calculate balanced columns based on cropped image aspect ratios to prevent uneven heights and white spaces
  const getBalancedColumns = () => {
    const columns: typeof filteredPhotos[] = Array.from({ length: cols }, () => [])
    const colHeights = Array(cols).fill(0)

    filteredPhotos.forEach((photo, index) => {
      const isLandscape = aspects[photo.id] ? aspects[photo.id] > 1.1 : false

      // Determine aspect ratio for grid crop
      let gridAspect = '2/3'
      if (isLandscape) {
        gridAspect = '3/2'
      } else {
        // Stagger portrait images dynamically using 2x3, 3x4, and 4:5 ratios
        const cycle = index % 3
        if (cycle === 0) gridAspect = '2/3'
        else if (cycle === 1) gridAspect = '3/4'
        else gridAspect = '4/5'
      }

      // Convert grid aspect string to numerical ratio for height contribution
      const numAspect = isLandscape ? 1.5 : (gridAspect === '2/3' ? 2/3 : (gridAspect === '3/4' ? 3/4 : 4/5))
      const heightContribution = 1 / numAspect

      // Find the column with the shortest height
      let shortestIdx = 0
      let minHeight = colHeights[0]
      for (let i = 1; i < cols; i++) {
        if (colHeights[i] < minHeight) {
          minHeight = colHeights[i]
          shortestIdx = i
        }
      }

      columns[shortestIdx].push({
        ...photo,
        _gridAspect: gridAspect
      } as any)
      
      colHeights[shortestIdx] += heightContribution
    })

    return columns
  }

  const columnsData = getBalancedColumns()

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

      {/* ── Masonry columns (True Height-Balanced Flex Masonry) ── */}
      <div
        className="story-masonry"
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px var(--page-x) 32px',
          background: '#fff',
        }}
      >
        {columnsData.map((colPhotos, colIdx) => {
          return (
            <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colPhotos.map((photo: any) => {
                const globalIdx = filteredPhotos.findIndex(p => p.id === photo.id)
                return (
                  <div
                    key={photo.id}
                    onClick={() => setLb(globalIdx)}
                    style={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      lineHeight: 0,
                      aspectRatio: photo._gridAspect || '2/3',
                      position: 'relative',
                    }}
                    className="gallery-item"
                  >
                    <img
                      src={photo.file_url_thumb || photo.file_url}
                      srcSet={`${photo.file_url_thumb || photo.file_url} 600w, ${photo.file_url} 1920w`}
                      sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 25vw"
                      alt=""
                      loading={globalIdx < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        background: photo.blur_data_url ? `url(${photo.blur_data_url}) no-repeat center/cover` : 'var(--linen-dark)',
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )
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
        .gallery-item { overflow: hidden; }
        .gallery-item img { transition: transform 0.5s ease; }
        @media (hover: hover) {
          .gallery-item:hover img { transform: scale(1.04); }
        }
        @media (max-width: 640px) {
          .story-masonry { columns: 2 160px !important; padding: 8px 12px 24px !important; column-gap: 8px !important; }
        }
      `}</style>
    </>
  )
}
