'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Film } from '@/lib/types'

interface Props {
  film: Film
  onClose: () => void
}

type Quality = 'auto' | '4k' | '1080p' | '720p'

export default function VideoPlayer({ film, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [quality, setQuality] = useState<Quality>('auto')
  const [levels, setLevels] = useState<string[]>([])
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !film.hls_url) return

    const hlsUrl = film.hls_url.startsWith('http') ? film.hls_url : film.hls_url

    async function initHls() {
      const Hls = (await import('hls.js')).default
      if (Hls.isSupported()) {
        const hls = new Hls({ startLevel: -1 })
        hlsRef.current = hls
        hls.loadSource(hlsUrl)
        hls.attachMedia(video!)
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const names = data.levels.map((l: any) => {
            if (l.height >= 2160) return '4k'
            if (l.height >= 1080) return '1080p'
            return '720p'
          })
          setLevels(['auto', ...names])
          if (video) { video.play().catch(() => null) }
          setPlaying(true)
        })
      } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
        if (video) {
          video.src = hlsUrl
          video.play().catch(() => null)
          setPlaying(true)
        }
        setLevels(['auto'])
      }
    }
    initHls()

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [film.hls_url])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime  = () => setProgress((video.currentTime / video.duration) * 100 || 0)
    const onMeta  = () => setDuration(video.duration)
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  const setQualityLevel = (q: Quality) => {
    setQuality(q)
    const hls = hlsRef.current
    if (!hls) return
    if (q === 'auto') { hls.currentLevel = -1; return }
    const idx = hls.levels.findIndex((l: any) => {
      if (q === '4k')    return l.height >= 2160
      if (q === '1080p') return l.height >= 1080
      return l.height < 1080
    })
    if (idx >= 0) hls.currentLevel = idx
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* Video */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        style={{ flex: 1, width: '100%', objectFit: 'contain', cursor: 'pointer' }}
        playsInline
      />

      {/* Controls overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        padding: '2rem 1.5rem 1.5rem',
        transition: 'opacity 0.3s ease',
        opacity: showControls ? 1 : 0,
      }}>
        {/* Progress */}
        <div
          onClick={seek}
          style={{
            height: '3px', background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px', marginBottom: '1rem', cursor: 'pointer', position: 'relative',
          }}
        >
          <div style={{
            height: '100%', background: '#fff', borderRadius: '2px',
            width: `${progress}%`, transition: 'width 0.1s linear',
          }} />
        </div>

        {/* Control bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Play/Pause */}
          <button onClick={togglePlay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                <rect x="3" y="2" width="5" height="16" rx="1"/>
                <rect x="12" y="2" width="5" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                <path d="M3 2L17 10L3 18V2Z"/>
              </svg>
            )}
          </button>

          {/* Time */}
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
            {fmt(videoRef.current?.currentTime || 0)} / {fmt(duration)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Quality selector */}
          {levels.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {levels.map(q => (
                <button key={q} onClick={() => setQualityLevel(q as Quality)} style={{
                  background: quality === q ? 'rgba(255,255,255,0.2)' : 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                  color: '#fff', cursor: 'pointer',
                  fontSize: '0.625rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.5rem',
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Close */}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="17" y2="17"/>
              <line x1="17" y1="1" x2="1" y2="17"/>
            </svg>
          </button>
        </div>

        {/* Film title */}
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)' }}>
            {film.title}
            {film.location && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '0.75rem', fontSize: '0.8125rem' }}>
              {film.location}{film.year ? ` · ${film.year}` : ''}
            </span>}
          </p>
        </div>
      </div>

      {/* Top close (always visible) */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '1.25rem', right: '1.25rem',
        background: 'rgba(255,255,255,0.1)', border: 'none',
        borderRadius: '50%', width: '2.5rem', height: '2.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', backdropFilter: 'blur(8px)',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <line x1="1" y1="1" x2="13" y2="13"/>
          <line x1="13" y1="1" x2="1" y2="13"/>
        </svg>
      </button>
    </div>
  )
}
