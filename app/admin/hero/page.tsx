'use client'

import { useEffect, useState, useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

type Status = 'idle' | 'uploading' | 'done' | 'error'

export default function AdminHeroPage() {
  const [hero, setHero] = useState<any>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [headline, setHeadline] = useState('')
  const [subline, setSubline] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    apiFetch(`/api/website/home?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.hero) {
        setHero(d.hero)
        setHeadline(d.hero.headline || '')
        setSubline(d.hero.subline || '')
        setMediaType(d.hero.media_type || 'image')
      }
    }).catch(() => null)
  }, [])

  const handleFile = (f: File) => {
    setPreview(URL.createObjectURL(f))
    setMediaType(f.type.startsWith('video/') ? 'video' : 'image')
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file && !headline && !subline) return setError('Please select a file or update text.')
    setStatus('uploading')
    setError('')
    setProgress(0)
    try {
      const form = new FormData()
      if (file) form.append('file', file)
      form.append('headline', headline)
      form.append('subline', subline)
      form.append('mediaType', mediaType)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = e => e.lengthComputable && setProgress(Math.round(e.loaded / e.total * 100))
        xhr.onload = () => {
          if (xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText)
              if (res) {
                setHero(res)
                setHeadline(res.headline || '')
                setSubline(res.subline || '')
                setMediaType(res.media_type || 'image')
              }
            } catch {}
            resolve()
          } else {
            reject(new Error(xhr.responseText))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', `${API}/api/website/hero`)
        xhr.withCredentials = true
        xhr.send(form)
      })

      setStatus('done')
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e: any) {
      setStatus('error')
      setError(e.message || 'Upload failed')
    }
  }

  const card = { background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee' }

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>Hero Media</h1>
      <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '2rem' }}>Upload the fullscreen hero image or video for the homepage.</p>

      {/* Current hero preview */}
      {hero?.media_url && (
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.75rem' }}>Current Hero</p>
          {hero.media_type === 'video' ? (
            <video src={hero.media_url} muted style={{ width: '100%', borderRadius: '6px', maxHeight: '240px', objectFit: 'cover' }} />
          ) : (
            <img src={hero.media_url} alt="Hero" style={{ width: '100%', borderRadius: '6px', maxHeight: '240px', objectFit: 'cover' }} />
          )}
        </div>
      )}

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* File drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed #e0e0e0', borderRadius: '8px',
            padding: '2.5rem', textAlign: 'center',
            cursor: 'pointer', background: '#fafafa',
            transition: 'border-color 0.2s',
          }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { handleFile(f); if (fileRef.current) { const dt = new DataTransfer(); dt.items.add(f); fileRef.current.files = dt.files } } }}
        >
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {preview ? (
            mediaType === 'video' ? (
              <video src={preview} muted style={{ maxHeight: '180px', borderRadius: '6px', margin: '0 auto' }} />
            ) : (
              <img src={preview} alt="" style={{ maxHeight: '180px', borderRadius: '6px', margin: '0 auto', objectFit: 'cover' }} />
            )
          ) : (
            <div>
              <p style={{ fontSize: '0.9375rem', color: '#555', marginBottom: '0.25rem' }}>Drop image or video here</p>
              <p style={{ fontSize: '0.75rem', color: '#bbb' }}>JPEG, WebP, PNG, MP4 · Max 500MB</p>
            </div>
          )}
        </div>

        {/* Text fields */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
            Headline
          </label>
          <input value={headline} onChange={e => setHeadline(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.9375rem' }}
            placeholder="Misty Visuals" />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
            Subline
          </label>
          <input value={subline} onChange={e => setSubline(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.9375rem' }}
            placeholder="Luxury Wedding Photography & Films" />
        </div>

        {/* Upload button */}
        {status === 'uploading' && (
          <div style={{ background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden', height: '6px' }}>
            <div style={{ height: '100%', background: '#1a1512', width: `${progress}%`, transition: 'width 0.2s' }} />
          </div>
        )}
        {error && <p style={{ color: '#e53e3e', fontSize: '0.875rem' }}>{error}</p>}
        <button onClick={handleUpload} disabled={status === 'uploading'} style={{
          background: status === 'done' ? '#22c55e' : '#1a1512',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '0.75rem 1.5rem', fontSize: '0.875rem',
          cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
          fontWeight: 500, letterSpacing: '0.03em',
        }}>
          {status === 'uploading' ? `Uploading ${progress}%…` : status === 'done' ? '✓ Saved' : 'Save Hero'}
        </button>
      </div>
    </div>
  )
}
