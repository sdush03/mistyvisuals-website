'use client'

import { useEffect, useState, useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminFilmsPage() {
  const [films, setFilms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [uploadPct, setUploadPct] = useState(0)
  const thumbRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const [activeFilmId, setActiveFilmId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch('/api/website/admin/films').then(r => r.json()).then(setFilms).finally(() => setLoading(false))
    // Poll for transcode status changes
    const poll = setInterval(() => {
      apiFetch('/api/website/admin/films').then(r => r.json()).then(setFilms)
    }, 8000)
    return () => clearInterval(poll)
  }, [])

  const createFilm = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    const r = await apiFetch('/api/website/films', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const film = await r.json()
    setFilms(prev => [film, ...prev])
    setNewTitle('')
    setCreating(false)
  }

  const toggle = async (id: number, field: string, val: boolean) => {
    await apiFetch(`/api/website/films/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: val }),
    })
    setFilms(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f))
  }

  const deleteFilm = async (id: number) => {
    if (!confirm('Delete this film?')) return
    await apiFetch(`/api/website/films/${id}`, { method: 'DELETE' })
    setFilms(prev => prev.filter(f => f.id !== id))
  }

  const uploadThumb = async (filmId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    setUploadingId(filmId)
    const r = await apiFetch(`/api/website/films/${filmId}/thumbnail`, { method: 'POST', body: form })
    const film = await r.json()
    setFilms(prev => prev.map(f => f.id === filmId ? film : f))
    setUploadingId(null)
  }

  const uploadVideo = (filmId: number, file: File) => {
    setUploadingId(filmId)
    setUploadPct(0)
    const form = new FormData()
    form.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = e => e.lengthComputable && setUploadPct(Math.round(e.loaded / e.total * 100))
    xhr.onload = () => {
      setFilms(prev => prev.map(f => f.id === filmId ? { ...f, transcode_status: 'processing' } : f))
      setUploadingId(null)
    }
    xhr.onerror = () => setUploadingId(null)
    xhr.open('POST', `${API}/api/website/films/${filmId}/video`)
    xhr.withCredentials = true
    xhr.send(form)
  }

  const statusColor = (s: string) => ({ ready: '#22c55e', processing: '#f59e0b', error: '#ef4444', pending: '#d1d5db' }[s] || '#d1d5db')

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>Films</h1>
        <p style={{ fontSize: '0.875rem', color: '#888' }}>Upload portfolio films with adaptive HLS streaming.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <input style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem' }}
          placeholder="New film title…" value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createFilm()} />
        <button onClick={createFilm} disabled={creating || !newTitle.trim()} style={{
          background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '0.625rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          {creating ? 'Creating…' : '+ New Film'}
        </button>
      </div>

      {loading ? <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {films.map(film => (
            <div key={film.id} style={{
              background: '#fff', border: '1px solid #eee', borderRadius: '12px',
              padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
            }}>
              {/* Thumbnail */}
              <div style={{ width: '100px', height: '56px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#1a1512', position: 'relative', cursor: 'pointer' }}
                onClick={() => { setActiveFilmId(film.id); thumbRef.current?.click() }}>
                {film.thumbnail_url ? (
                  <img src={film.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.5625rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Add thumb</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1a1512', marginBottom: '0.25rem' }}>{film.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
                    color: statusColor(film.transcode_status), background: `${statusColor(film.transcode_status)}20`,
                    padding: '0.2rem 0.5rem', borderRadius: '20px',
                  }}>
                    {film.transcode_status === 'processing' ? '⏳ Processing…' :
                     film.transcode_status === 'ready'      ? '✓ Ready' :
                     film.transcode_status === 'error'      ? '✗ Error' : 'Pending'}
                  </span>
                  {uploadingId === film.id && (
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>Uploading {uploadPct}%…</span>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['is_published', 'is_featured'].map(field => (
                  <button key={field} onClick={() => toggle(film.id, field, !film[field])} style={{
                    fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.625rem',
                    borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 500,
                    background: film[field] ? (field === 'is_published' ? '#22c55e' : '#3b82f6') : '#f0f0f0',
                    color: film[field] ? '#fff' : '#888',
                  }}>
                    {field === 'is_published' ? 'Published' : 'Featured'}
                  </button>
                ))}
              </div>

              {/* Upload video */}
              <button onClick={() => { setActiveFilmId(film.id); videoRef.current?.click() }}
                disabled={uploadingId === film.id}
                style={{ fontSize: '0.75rem', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '0.375rem 0.75rem', background: 'none', cursor: 'pointer' }}>
                {film.hls_url ? 'Replace Video' : 'Upload Video'}
              </button>
              <button onClick={() => deleteFilm(film.id)}
                style={{ fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.375rem 0.75rem', background: 'none', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0] && activeFilmId) uploadThumb(activeFilmId, e.target.files[0]) }} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0] && activeFilmId) uploadVideo(activeFilmId, e.target.files[0]) }} />
    </div>
  )
}
