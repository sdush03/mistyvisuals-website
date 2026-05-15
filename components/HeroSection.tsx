'use client'

import { useEffect, useRef, useState } from 'react'
import type { Hero } from '@/lib/types'

// Treat empty string same as null
const truthy = (s: string | null | undefined) => s && s.trim() ? s : null

interface Props {
  hero: Hero | null
  headline?: string
  subline?: string
}

export default function HeroSection({ hero, headline, subline }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef   = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => null)
    }
    if (imgRef.current?.complete) {
      setLoaded(true)
    }
  }, [])

  const [imgError, setImgError] = useState(false)
  const title = truthy(headline) || truthy(hero?.headline) || 'Misty Visuals'
  const sub   = truthy(subline)  || truthy(hero?.subline)  || 'WEDDING PHOTOGRAPHY & FILMS'

  return (
    <section style={{
      position: 'relative',
      height: '100dvh',
      minHeight: '600px',
      overflow: 'hidden',
      background: '#1c1a18',
    }}>
      {/* ── Media ── */}
      {hero?.media_type === 'video' && hero.media_url ? (
        <video
          ref={videoRef}
          src={hero.media_url}
          autoPlay muted loop playsInline
          poster={hero.poster_url || undefined}
          onCanPlay={() => setLoaded(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
            opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease',
          }}
        />
      ) : hero?.media_url && !imgError ? (
        <>
          {/* Blur placeholder */}
          {hero.poster_url && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${hero.poster_url})`,
              backgroundSize: 'cover', backgroundPosition: 'center 30%',
              filter: 'blur(24px)', transform: 'scale(1.05)',
              opacity: loaded ? 0 : 1, transition: 'opacity 0.6s ease',
            }} />
          )}
          <picture>
            {hero.mobile_url && (
              <source media="(max-width: 767px)" srcSet={hero.mobile_url} type="image/webp" />
            )}
            <img
              key={hero.id}
              ref={imgRef}
              src={hero.media_url}
              alt=""
              fetchPriority="high"
              onLoad={() => setLoaded(true)}
              onError={() => { setImgError(true); setLoaded(true) }}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 30%',
                opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease',
              }}
            />
          </picture>
        </>
      ) : (
        /* No media yet — elegant gradient placeholder */
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #2a2520 0%, #1c1a18 100%)',
        }} />
      )}

      {/* ── Very light scrim — just enough to read text, not dark ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(10,8,6,0.38) 0%, rgba(10,8,6,0.04) 55%, rgba(10,8,6,0.15) 100%)',
      }} />

      {/* ── Text — Centered in the middle ── */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        width: '100%',
        padding: '0 var(--page-x)',
      }}>
        <h1 className="mv-title-hero" style={{
          color: '#fff',
          marginBottom: '1rem',
        }}>
          {title}
        </h1>
        <p className="mv-label" style={{
          color: '#ffffff', // Changed from translucent white to solid white
        }}>
          {sub}
        </p>
      </div>
    </section>
  )
}
