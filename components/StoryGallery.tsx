'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StoryPhoto, Film, Reel } from '@/lib/types'

interface Props { photos: StoryPhoto[], tabs?: string[] | null, films?: Film[], reels?: Reel[] }

export default function StoryGallery({ photos, tabs, films = [], reels = [] }: Props) {
  const [activeTab, setActiveTab] = useState('All')
  const [lb, setLb] = useState<number | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [isReelActive, setIsReelActive] = useState(false)
  const [cols, setCols] = useState(3)
  const [aspects, setAspects] = useState<Record<number, number>>({})

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

  const hasVideos = (films && films.length > 0) || (reels && reels.length > 0)
  const tabList = tabs && tabs.length > 0
    ? (hasVideos ? [...tabs, 'Cinema'] : tabs)
    : (hasVideos ? ['Cinema'] : [])

  if (!photos.length) return null

  return (
    <>
      
      {tabList.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'flex-start', gap: '2rem', padding: '1.5rem var(--page-x) 0.5rem', flexWrap: 'wrap',
          background: '#fff', borderTop: '1px solid #f0f0f0'
        }}>
          {['All', ...tabList].map(tab => (
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

      {activeTab === 'Cinema' && hasVideos ? (
        <div style={{ padding: '2rem var(--page-x) 4rem', background: '#fff' }}>
          {(() => {
            const widescreenFilms = films
            const verticalReels = reels
            
            return (
              <>
                {widescreenFilms.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginBottom: verticalReels.length > 0 ? '5rem' : '0', marginTop: '1rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-light)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      ✦ Features & Films
                    </h4>
                    {widescreenFilms.map((film, index) => {
                      const isLeft = index % 2 === 0
                      
                      return (
                        <article 
                          key={film.id} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '2rem'
                          }}
                        >
                          <div className="cinema-spread" style={{ display: 'grid', gap: '2.5rem', alignItems: 'center' }}>
                            {/* Widescreen Video Card */}
                            <div 
                              className="hover-scale"
                              onClick={() => {
                                if (film.youtube_video_id) {
                                  setActiveVideoId(film.youtube_video_id)
                                  setIsReelActive(false)
                                }
                              }}
                              style={{ 
                                aspectRatio: '16/9', 
                                background: '#111', 
                                overflow: 'hidden', 
                                position: 'relative',
                                cursor: 'pointer',
                                order: isLeft ? 1 : 2
                              }}
                            >
                              {film.thumbnail_url ? (
                                <img
                                  src={film.thumbnail_url}
                                  alt={film.title}
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
                              <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 3
                              }} className="play-overlay">
                                <div style={{
                                  width: '4rem', height: '4rem',
                                  borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.0)',
                                  border: '1px solid rgba(255,255,255,0.35)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  zIndex: 4,
                                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))',
                                  transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                                }} className="play-circle">
                                  <svg width="14" height="16" viewBox="0 0 14 16" className="play-triangle" style={{ marginLeft: '3px' }}>
                                    <path d="M0 0v16l14-8z" fill="white" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Editorial Text Block */}
                            <div style={{ 
                              order: isLeft ? 2 : 1,
                              textAlign: 'left',
                              padding: '0.5rem 0'
                            }} className="cinema-text">
                              <h3 style={{ 
                                fontFamily: 'var(--font-sans)', 
                                fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
                                fontWeight: 500, 
                                letterSpacing: '0.1em', 
                                textTransform: 'uppercase', 
                                color: 'var(--ink)', 
                                marginBottom: '0.75rem' 
                              }}>
                                {film.title}
                              </h3>
                              {film.subtitle && (
                                <p style={{ 
                                  fontFamily: 'var(--font-serif)', 
                                  fontSize: '0.9rem', 
                                  fontStyle: 'italic',
                                  lineHeight: '1.7', 
                                  color: 'var(--ink-mid)', 
                                  marginBottom: '1.25rem',
                                  maxWidth: '480px',
                                }}>
                                  {film.subtitle}
                                </p>
                              )}
                              <p style={{ 
                                fontFamily: 'var(--font-sans)', 
                                fontSize: '0.625rem', 
                                fontWeight: 500, 
                                letterSpacing: '0.2em', 
                                color: 'var(--ink-light)', 
                                textTransform: 'uppercase' 
                              }}>
                                {[film.location, film.year].filter(Boolean).join(' // ')}
                              </p>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}

                {/* Vertical Reels (2-Column Mobile, 3-Column Desktop) */}
                {verticalReels.length > 0 && (
                  <div style={{ marginTop: '3rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-light)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
                      ✦ Reels & Stories
                    </h4>
                    <div 
                      className="reels-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '24px',
                      }}
                    >
                      {verticalReels.map((reel) => (
                        <article 
                          key={reel.id}
                          onClick={() => {
                            if (reel.youtube_video_id) {
                              setActiveVideoId(reel.youtube_video_id)
                              setIsReelActive(true)
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div 
                            className="hover-scale"
                            style={{ 
                              aspectRatio: '9/16', 
                              background: '#111', 
                              overflow: 'hidden', 
                              position: 'relative',
                              marginBottom: '0.75rem'
                            }}
                          >
                            {reel.thumbnail_url ? (
                              <img
                                src={reel.thumbnail_url}
                                alt={reel.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#2a2520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </div>
                            )}
                            {/* Option B Spotlight Glass Glaze */}
                            <div className="glaze-overlay"></div>
                            {/* Reel Play Button */}
                            <div style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 3
                            }} className="play-overlay">
                              <div style={{
                                width: '2.75rem', height: '2.75rem',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.0)',
                                border: '1px solid rgba(255,255,255,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 4,
                                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                                transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                              }} className="play-circle">
                                <svg width="10" height="12" viewBox="0 0 10 12" className="play-triangle" style={{ marginLeft: '1px' }}>
                                  <path d="M0 0v12l10-6z" fill="white" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ 
                              fontFamily: 'var(--font-sans)', 
                              fontSize: '0.6875rem', 
                              fontWeight: 600, 
                              letterSpacing: '0.12em', 
                              textTransform: 'uppercase', 
                              color: 'var(--ink)' 
                            }}>
                              {reel.title}
                            </h5>
                          </div>
                        </article>
                      ))}
                      
                      {verticalReels.length === 4 && (
                        <div 
                          className="reel-editorial-card"
                          style={{
                            gridColumn: 'span 2',
                            border: '1px dashed var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem',
                            textAlign: 'center',
                            background: 'var(--linen-light)'
                          }}
                        >
                          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontStyle: 'italic', color: 'var(--ink-mid)', maxWidth: '320px', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                            "Every look, every touch, every tear. Capturing the brief fragments of a memory, preserved in real-time."
                          </p>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>
                            Misty Visuals Cinema
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      ) : (
        /* ── Masonry columns (True Height-Balanced Flex Masonry) ── */
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
                        sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
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
      )}

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
        .cinema-spread { grid-template-columns: 1.2fr 0.8fr; }
        @media (max-width: 960px) {
          .cinema-spread { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .cinema-text { text-align: center !important; }
          .cinema-text p { margin: 0.5rem auto 1rem !important; }
        }
        @media (max-width: 640px) {
          .story-masonry { columns: 2 160px !important; padding: 8px 12px 24px !important; column-gap: 8px !important; }
          .reels-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .reel-editorial-card { display: none !important; }
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

      {/* ── Cinematic Video Lightbox ── */}
      {activeVideoId && (
        <div 
          role="dialog"
          aria-modal
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,8,6,0.96)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} 
          onClick={() => { setActiveVideoId(null); setIsReelActive(false); }}
        >
          {/* Close button */}
          <button 
            onClick={() => { setActiveVideoId(null); setIsReelActive(false); }}
            style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '2.5rem', height: '2.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10000, backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13"/>
              <line x1="13" y1="1" x2="1" y2="13"/>
            </svg>
          </button>
          
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: isReelActive ? 'min(90vw, 360px)' : '90%', 
              maxWidth: isReelActive ? '360px' : '1120px',
              aspectRatio: isReelActive ? '9/16' : '16/9',
              background: '#000',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
          >
            {isReelActive && (
              <div style={{
                position: 'absolute', inset: '-40px',
                background: `radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)`,
                zIndex: -1,
                pointerEvents: 'none'
              }} />
            )}
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&vq=hd2160&playsinline=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: 'block', width: '100%', height: '100%' }}
            ></iframe>
          </div>
        </div>
      )}
    </>
  )
}
