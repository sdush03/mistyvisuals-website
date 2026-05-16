'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { compressImage } from '@/lib/compressImage'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

const PAGES = [
  { key: 'home',    label: 'Homepage',      field: 'bgHome' },
  { key: 'stories', label: 'Stories Page',  field: 'bgStories' },
  { key: 'films',   label: 'Films Page',    field: 'bgFilms' },
]

type Status = 'idle' | 'uploading' | 'done' | 'error'

export default function AdminInquiryPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'home'
  const validTabs = PAGES.map(p => p.key)
  
  const [bgs, setBgs] = useState<Record<string, string | null>>({
    bgHome: null, bgStories: null, bgFilms: null, bgContact: null,
  })
  const [activeTab, setActiveTab] = useState(validTabs.includes(initialTab) ? initialTab : 'home')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch(`/api/website/home?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        const section = d.sections?.find((s: any) => s.key === 'inquiry')
        if (section?.content) {
          setBgs({
            bgHome:    section.content.bgHome    || section.content.bgImage || null,
            bgStories: section.content.bgStories || null,
            bgFilms:   section.content.bgFilms   || null,
            bgContact: section.content.bgContact  || null,
          })
        }
      })
  }, [])

  const handleFile = (f: File) => setPreview(URL.createObjectURL(f))

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return setError('Please select an image.')

    setStatus('uploading')
    setError('')
    setProgress(0)

    let toUpload = file
    try {
      toUpload = await compressImage(file, { maxWidth: 2560, maxHeight: 1600, quality: 0.82 })
    } catch { /* fall back */ }

    const form = new FormData()
    form.append('file', toUpload)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => e.lengthComputable && setProgress(Math.round(e.loaded / e.total * 100))
      xhr.onload = () => {
        if (xhr.status < 300) {
          const res = JSON.parse(xhr.responseText)
          const tab = PAGES.find(p => p.key === activeTab)!
          setBgs(prev => ({ ...prev, [tab.field]: res.url }))
          setPreview(null)
          if (fileRef.current) fileRef.current.value = ''
          resolve()
        } else {
          reject(new Error(xhr.responseText))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.open('POST', `${API}/api/website/sections/inquiry/bg?page=${activeTab}`)
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
  const activePage = PAGES.find(p => p.key === activeTab)!
  const currentBg = bgs[activePage.field]

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem' }}>
        Let's Connect — Backgrounds
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '2rem' }}>
        Set a unique background image for the "Let's Connect" CTA on each page.
      </p>

      {/* Page Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {PAGES.map(p => (
          <button
            key={p.key}
            onClick={() => { setActiveTab(p.key); setPreview(null); setStatus('idle'); setError('') }}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              border: activeTab === p.key ? '1px solid #1a1512' : '1px solid #e0e0e0',
              background: activeTab === p.key ? '#1a1512' : '#fff',
              color: activeTab === p.key ? '#fff' : '#888',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: activeTab === p.key ? 500 : 400,
              transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Current Image */}
      {currentBg && (
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.75rem' }}>
            Current — {activePage.label}
          </p>
          <img src={currentBg} alt="Background" style={{ width: '100%', borderRadius: '6px', maxHeight: '240px', objectFit: 'cover' }} />
        </div>
      )}

      {/* Upload Card */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) {
              handleFile(f)
              if (fileRef.current) {
                const dt = new DataTransfer(); dt.items.add(f); fileRef.current.files = dt.files
              }
            }
          }}
          style={{
            border: '2px dashed #e0e0e0', borderRadius: '8px',
            padding: '2.5rem', textAlign: 'center',
            cursor: 'pointer', background: '#fafafa',
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
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
          {status === 'uploading' ? `Uploading ${progress}%…` : status === 'done' ? '✓ Saved' : `Save for ${activePage.label}`}
        </button>
      </div>
    </div>
  )
}
