'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

type Status = 'idle' | 'uploading' | 'done' | 'error'

export default function AdminInquiryPage() {
  const [currentBg, setCurrentBg] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    apiFetch(`/api/website/home?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const inquirySection = d.sections?.find((s: any) => s.key === 'inquiry')
        if (inquirySection?.content?.bgImage) {
          setCurrentBg(inquirySection.content.bgImage)
        }
      })
      .catch(() => null)
  }, [])

  const handleFile = (f: File) => {
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return setError('Please select an image file.')
    
    setStatus('uploading')
    setError('')
    setProgress(0)

    try {
      const form = new FormData()
      form.append('file', file)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = e => e.lengthComputable && setProgress(Math.round(e.loaded / e.total * 100))
        xhr.onload = () => {
          if (xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(xhr.responseText))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', `${API}/api/website/sections/inquiry/bg`)
        xhr.withCredentials = true
        xhr.send(form)
      })

      setStatus('done')
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      
      apiFetch(`/api/website/home?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const inquirySection = d.sections?.find((s: any) => s.key === 'inquiry')
          if (inquirySection?.content?.bgImage) {
            setCurrentBg(inquirySection.content.bgImage)
          }
        })

      setTimeout(() => setStatus('idle'), 2000)
      router.refresh()
    } catch (e: any) {
      setStatus('error')
      setError(e.message || 'Upload failed')
    }
  }

  const card = { background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee' }

  return (
    <div style={{ maxWidth: '700px' }}>
      <p style={{ fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Edit Section</p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 300, fontStyle: 'italic', color: '#1a1512', marginBottom: '0.5rem' }}>Let's Connect</h1>
      <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '2rem' }}>Upload the background image for the Let's Connect CTA section.</p>

      {/* Current image preview */}
      {currentBg && (
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.75rem' }}>Current Background</p>
          <img src={currentBg} alt="Background" style={{ width: '100%', borderRadius: '6px', maxHeight: '240px', objectFit: 'cover' }} />
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
          <input ref={fileRef} type="file" accept="image/*" className="hidden" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {preview ? (
            <img src={preview} alt="" style={{ maxHeight: '180px', borderRadius: '6px', margin: '0 auto', objectFit: 'cover' }} />
          ) : (
            <div>
              <p style={{ fontSize: '0.9375rem', color: '#555', marginBottom: '0.25rem' }}>Drop image here</p>
              <p style={{ fontSize: '0.75rem', color: '#bbb' }}>JPEG, WebP, PNG · Max 20MB</p>
            </div>
          )}
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
          {status === 'uploading' ? `Uploading ${progress}%…` : status === 'done' ? '✓ Saved' : 'Save Background'}
        </button>
      </div>
    </div>
  )
}
