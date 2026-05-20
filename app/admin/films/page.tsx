'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { compressImage } from '@/lib/compressImage'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

const extractYouTubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  return match ? match[1] : null
}

export default function AdminFilmsPage() {
  const [films, setFilms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const thumbRef = useRef<HTMLInputElement>(null)
  const [activeFilmId, setActiveFilmId] = useState<number | null>(null)
  const [openCategoryFilmId, setOpenCategoryFilmId] = useState<number | null>(null)
  const [newCat, setNewCat] = useState('')

  const PREDEFINED_CATEGORIES = ['Destination', 'Intimate', 'Night', 'Pre-Wedding']

  // Header background state
  const [headerBg, setHeaderBg] = useState<string | null>(null)
  const [headerBgType, setHeaderBgType] = useState<'image' | 'video'>('image')
  const [bgUploading, setBgUploading] = useState(false)
  const [bgProgress, setBgProgress] = useState(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const bgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      apiFetch('/api/website/admin/films').then(r => r.json()),
      apiFetch('/api/website/sections').then(r => r.json())
    ]).then(([filmsData, sectionsData]) => {
      setFilms(filmsData)
      const filmsSection = sectionsData.find((s: any) => s.key === 'films')
      if (filmsSection?.content?.bgImage) {
        setHeaderBg(filmsSection.content.bgImage)
        setHeaderBgType(filmsSection.content.bgType || 'image')
      }
    }).finally(() => setLoading(false))
  }, [])

  const uploadHeaderBg = useCallback(async (file: File) => {
    if (!file) return
    setBgUploading(true)
    setBgProgress(0)

    const isVideo = file.type.startsWith('video/')

    // Compress images client-side; send videos raw
    let toUpload: File = file
    if (!isVideo) {
      try {
        toUpload = await compressImage(file, { maxWidth: 2560, maxHeight: 1600, quality: 0.82 })
      } catch { /* fall back to original */ }
    }

    const form = new FormData()
    form.append('file', toUpload)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/api/website/sections/films/bg`)
    xhr.withCredentials = true
    xhr.upload.onprogress = e => e.lengthComputable && setBgProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      setBgUploading(false)
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        setHeaderBg(res.url)
        setHeaderBgType(res.type || 'image')
      } else {
        alert('Upload failed')
      }
    }
    xhr.onerror = () => {
      setBgUploading(false)
      alert('Upload failed')
    }
    xhr.send(form)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true) }
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false) }
  const onDropBg = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files?.[0]) uploadHeaderBg(e.dataTransfer.files[0])
  }

  const createFilm = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    const r = await apiFetch('/api/website/films', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const film = await r.json()
    if (r.ok && film.id) {
      setFilms(prev => [film, ...prev])
      setNewTitle('')
    } else {
      alert(film.error || film.message || 'Failed to create film')
    }
    setCreating(false)
  }

  const toggle = async (id: number, field: string, val: boolean | string) => {
    await apiFetch(`/api/website/films/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: val }),
    })
    setFilms(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f))
  }

  const updateYoutubeUrl = async (id: number, url: string) => {
    const videoId = extractYouTubeId(url)
    await apiFetch(`/api/website/films/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtube_url: url, youtube_video_id: videoId }),
    })
    setFilms(prev => prev.map(f => f.id === id ? { ...f, youtube_url: url, youtube_video_id: videoId } : f))
  }

  const deleteFilm = async (id: number) => {
    if (!confirm('Delete this film?')) return
    await apiFetch(`/api/website/films/${id}`, { method: 'DELETE' })
    setFilms(prev => prev.filter(f => f.id !== id))
  }

  const uploadThumb = async (filmId: number, file: File) => {
    // Compress thumbnail client-side (HD for 2-col grid + retina)
    let toUpload = file
    try {
      toUpload = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 })
    } catch { /* fall back to original */ }
    const form = new FormData()
    form.append('file', toUpload)
    setUploadingId(filmId)
    const r = await apiFetch(`/api/website/films/${filmId}/thumbnail`, { method: 'POST', body: form })
    const film = await r.json()
    setFilms(prev => prev.map(f => f.id === filmId ? film : f))
    setUploadingId(null)
  }

  const onDragStart = (id: number) => setDraggingId(id)

  const onDrop = async (dropId: number, isFeaturedList: boolean) => {
    if (!draggingId || draggingId === dropId) return setDraggingId(null)
    
    const list = isFeaturedList ? films.filter(f => f.is_featured) : films.filter(f => !f.is_featured)
    const dragIdx = list.findIndex(f => f.id === draggingId)
    const dropIdx = list.findIndex(f => f.id === dropId)
    
    if (dragIdx === -1 || dropIdx === -1) return setDraggingId(null)

    const updated = [...list]
    const [dragged] = updated.splice(dragIdx, 1)
    updated.splice(dropIdx, 0, dragged)

    updated.forEach((f, i) => f.display_order = i)

    setFilms(prev => {
      const newList = prev.map(f => {
        const found = updated.find(u => u.id === f.id)
        return found ? { ...f, display_order: found.display_order } : f
      })
      return newList.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    })
    setDraggingId(null)

    for (const f of updated) {
      await apiFetch(`/api/website/films/${f.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: f.display_order })
      })
    }
  }

  const renderFilmCard = (film: any, isFeaturedList: boolean) => (
    <div key={film.id} 
      draggable
      onDragStart={() => onDragStart(film.id)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(film.id, isFeaturedList)}
      style={{
        background: '#fff', border: draggingId === film.id ? '2px solid #1a1512' : '1px solid #eee', 
        borderRadius: '10px', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        cursor: 'grab', opacity: draggingId === film.id ? 0.5 : 1,
        transition: 'border 0.2s, opacity 0.2s',
      }}>
      
      {/* Drag handle icon */}
      <div style={{ color: '#ccc', cursor: 'grab', paddingRight: '0.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
      </div>

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
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1a1512', marginBottom: '0.25rem' }}>{film.title}</p>
        <input 
          defaultValue={film.youtube_url || ''} 
          placeholder="Paste YouTube URL here..." 
          onBlur={e => updateYoutubeUrl(film.id, e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '0.5rem' }} 
        />
        
        {/* Category Multi-Select */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setOpenCategoryFilmId(openCategoryFilmId === film.id ? null : film.id)}
            style={{
              padding: '0.4rem 0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.75rem',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: film.category ? '#000' : '#888'
            }}
          >
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
              {film.category || 'Select categories...'}
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openCategoryFilmId === film.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {openCategoryFilmId === film.id && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '4px',
              background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '0.5rem 0',
              maxHeight: '250px', overflowY: 'auto'
            }}>
              {Array.from(new Set([
                ...PREDEFINED_CATEGORIES, 
                ...Array.from(new Set(films.flatMap(f => (f.category || '').split(',').map((c:string) => c.trim()).filter(Boolean))))
              ])).sort().map((cat: string) => {
                const currentCats = (film.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
                const isSelected = currentCats.includes(cat)
                const count = films.filter(f => (f.category || '').split(',').map((c:string)=>c.trim()).includes(cat)).length
                return (
                  <div 
                    key={cat}
                    onClick={() => {
                      let newCats = [...currentCats]
                      if (isSelected) newCats = newCats.filter(c => c !== cat)
                      else newCats.push(cat)
                      toggle(film.id, 'category', newCats.join(', '))
                    }}
                    style={{
                      padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: isSelected ? '#f7f5f2' : 'transparent', fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ 
                      width: '12px', height: '12px', border: '1px solid #ccc', borderRadius: '2px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? '#1a1512' : '#fff', borderColor: isSelected ? '#1a1512' : '#ccc',
                      flexShrink: 0
                    }}>
                      {isSelected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
                    <span style={{ color: '#aaa', fontSize: '0.65rem' }}>({count})</span>
                  </div>
                )
              })}
              <div style={{ padding: '0.4rem 0.75rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }} onClick={e => e.stopPropagation()}>
                <input 
                  value={newCat} 
                  onChange={e => setNewCat(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!newCat.trim()) return
                      const currentCats = (film.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
                      if (!currentCats.includes(newCat.trim())) {
                        toggle(film.id, 'category', [...currentCats, newCat.trim()].join(', '))
                      }
                      setNewCat('')
                    }
                  }}
                  placeholder="New category..." 
                  style={{ width: '100%', padding: '0.25rem 0.4rem', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.75rem' }} 
                />
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    if (!newCat.trim()) return
                    const currentCats = (film.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
                    if (!currentCats.includes(newCat.trim())) {
                      toggle(film.id, 'category', [...currentCats, newCat.trim()].join(', '))
                    }
                    setNewCat('')
                  }}
                  style={{ background: '#1a1512', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 0.5rem', fontSize: '0.65rem', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>
          )}
          
          {openCategoryFilmId === film.id && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpenCategoryFilmId(null)} />
          )}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Toggle label="Published" value={film.is_published} onChange={v => toggle(film.id, 'is_published', v)} color="#22c55e" />
        <Toggle label="Featured" value={film.is_featured} onChange={v => toggle(film.id, 'is_featured', v)} color="#3b82f6" />
      </div>

      <button onClick={() => deleteFilm(film.id)}
        style={{ fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.375rem 0.75rem', background: 'none', cursor: 'pointer' }}>
        Delete
      </button>
    </div>
  )

  const featuredFilms = films.filter(f => f.is_featured)
  const otherFilms = films.filter(f => !f.is_featured)

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>Films</h1>
          <p style={{ fontSize: '0.875rem', color: '#888' }}>Upload thumbnails and link unlisted YouTube videos. Drag to reorder.</p>
        </div>
      </div>

      {/* ── Header Background Upload ── */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1512', fontWeight: 600, marginBottom: '1rem' }}>
          Films Page Header Image
        </h2>
        
        <div
          onClick={() => bgInputRef.current?.click()}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDropBg}
          style={{
            width: '100%', height: '160px',
            background: headerBg ? 'none' : '#fff',
            border: isDragActive ? '2px solid #1a1512' : '1px dashed #ccc',
            borderRadius: '12px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border 0.2s',
          }}
        >
          {headerBg && headerBgType === 'video' ? (
            <video src={headerBg} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : headerBg ? (
            <img src={headerBg} alt="Header Bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : null}
          
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', background: headerBg ? 'rgba(255,255,255,0.9)' : 'none', padding: headerBg ? '0.5rem 1rem' : '0', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: '#1a1512', fontWeight: 500 }}>
              {headerBg ? 'Click or drag to replace' : 'Click or drag image here'}
            </span>
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>Full bleed landscape (e.g. 2560x1440)</p>
          </div>

          {bgUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,21,18,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <div style={{ width: '60%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${bgProgress}%`, height: '100%', background: '#fff', transition: 'width 0.2s' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '0.75rem', marginTop: '0.5rem', letterSpacing: '0.1em' }}>UPLOADING {bgProgress}%</span>
            </div>
          )}
        </div>
        <input ref={bgInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadHeaderBg(e.target.files[0])} />
      </div>

      {/* Create new */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #eee' }}>
        <input style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem' }}
          placeholder="New film title…" value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createFilm()} />
        <button onClick={createFilm} disabled={creating || !newTitle.trim()} style={{
          background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '0.625rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {creating ? 'Creating…' : '+ New Film'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading films…</p>
      ) : films.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>No films yet. Create your first one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Featured Section */}
          <section>
            <h2 style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1512', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#3b82f6' }}>★</span> Featured Films (Homepage)
            </h2>
            {featuredFilms.length === 0 ? (
              <div style={{ padding: '2rem', border: '1px dashed #ccc', borderRadius: '10px', textAlign: 'center', color: '#888', fontSize: '0.875rem' }}>
                Toggle "Featured" on any film below to show it on your homepage.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {featuredFilms.map(f => renderFilmCard(f, true))}
              </div>
            )}
          </section>

          {/* All Other Films */}
          <section>
            <h2 style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1rem' }}>
              All Other Films (Gallery)
            </h2>
            {otherFilms.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '0.875rem' }}>No other films.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {otherFilms.map(f => renderFilmCard(f, false))}
              </div>
            )}
          </section>

        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0] && activeFilmId) uploadThumb(activeFilmId, e.target.files[0]) }} />
    </div>
  )
}

function Toggle({ label, value, onChange, color }: { label: string; value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '0.3rem 0.625rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: value ? color : '#f0f0f0',
      color: value ? '#fff' : '#888',
      fontWeight: 500, transition: 'all 0.2s',
    }}>
      {label}
    </button>
  )
}
