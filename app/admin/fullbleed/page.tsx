'use client'

import { useEffect, useState, useRef } from 'react'
import { compressImage } from '@/lib/compressImage'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

type Status = 'idle' | 'uploading' | 'done' | 'error'

export default function AdminFullBleedPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [currentType, setCurrentType] = useState<'video' | 'image'>('video')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'video' | 'image'>('video')
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch('/api/website/sections')
      .then(r => r.json())
      .then(sections => {
        const fb = sections.find((s: any) => s.key === 'full_bleed_video')
        if (fb?.content?.videoUrl) {
          setCurrentUrl(fb.content.videoUrl)
          setCurrentType(fb.content.mediaType || 'video')
        }
      })
  }, [])

  const handleFile = (f: File) => {
    const isVid = f.type.startsWith('video/')
    setPreviewType(isVid ? 'video' : 'image')
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return setError('Please select a file.')

    setStatus('uploading')
    setError('')
    setProgress(0)

    const isVideo = file.type.startsWith('video/')

    const form = new FormData()
    if (isVideo) {
      // Stream raw — no compression
      form.append('file', file)
    } else {
      try {
        const compressed = await compressImage(file, { maxWidth: 2560, maxHeight: 1600, quality: 0.85 })
        form.append('file', compressed)
      } catch {
        form.append('file', file)
      }
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => e.lengthComputable && setProgress(Math.round(e.loaded / e.total * 100))
      xhr.onload = () => {
        if (xhr.status < 300) {
          const res = JSON.parse(xhr.responseText)
          setCurrentUrl(res.url)
          setCurrentType(res.type || 'video')
          setPreview(null)
          if (fileRef.current) fileRef.current.value = ''
          resolve()
        } else {
          reject(new Error(xhr.responseText))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.open('POST', `${API}/api/website/sections/full_bleed_video/upload`)
      xhr.withCredentials = true
      xhr.send(form)
    }).then(() => {
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2500)
    }).catch(e => {
      setStatus('error')
      setError(e.message || 'Upload failed')
    })
  }

  const card = { background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee' }

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>
        Full Bleed Video
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '2rem' }}>
        Upload a full-width cinematic video or image that plays between sections on the homepage.
      </p>

      {/* Current preview */}
      {currentUrl && (
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.75rem' }}>
            Current Media
          </p>
          {currentType === 'video' ? (
            <video src={currentUrl} muted loop playsInline controls style={{ width: '100%', borderRadius: '6px', maxHeight: '240px', objectFit: 'cover', background: '#000' }} />
          ) : (
            <img src={currentUrl} alt="Full bleed" style={{ width: '100%', borderRadius: '6px', maxHeight: '240px', objectFit: 'cover' }} />
          )}
        </div>
      )}

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) {
              handleFile(f)
              if (fileRef.current) {
                const dt = new DataTransfer()
                dt.items.add(f)
                fileRef.current.files = dt.files
              }
            }
          }}
          style={{
            border: '2px dashed #e0e0e0', borderRadius: '8px',
            padding: '2.5rem', textAlign: 'center',
            cursor: 'pointer', background: '#fafafa',
            transition: 'border-color 0.2s',
          }}
        >
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {preview ? (
            previewType === 'video' ? (
              <video src={preview} muted style={{ maxHeight: '180px', borderRadius: '6px', margin: '0 auto' }} />
            ) : (
              <img src={preview} alt="" style={{ maxHeight: '180px', borderRadius: '6px', margin: '0 auto', objectFit: 'cover' }} />
            )
          ) : (
            <div>
              <p style={{ fontSize: '0.9375rem', color: '#555', marginBottom: '0.25rem' }}>Drop image or video here</p>
              <p style={{ fontSize: '0.75rem', color: '#bbb' }}>JPEG, WebP, PNG, MP4, WebM · Videos stream directly, no size limit</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
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
          {status === 'uploading' ? `Uploading ${progress}%…` : status === 'done' ? '✓ Saved' : 'Save Media'}
        </button>
      </div>
    </div>
  )
}
