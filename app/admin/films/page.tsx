'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { compressImage } from '@/lib/compressImage'
import { motion, AnimatePresence } from 'framer-motion'

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
  
  // Drawer states
  const [editingFilm, setEditingFilm] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editIsPublished, setEditIsPublished] = useState(false)
  const [editIsFeatured, setEditIsFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Custom category addition inside drawer
  const [newCat, setNewCat] = useState('')
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)

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

  // Sync drawer fields when a film is selected for editing
  useEffect(() => {
    if (editingFilm) {
      setEditTitle(editingFilm.title || '')
      setEditSubtitle(editingFilm.subtitle || '')
      setEditLocation(editingFilm.location || '')
      setEditYear(editingFilm.year ? String(editingFilm.year) : '')
      setEditYoutubeUrl(editingFilm.youtube_url || '')
      setEditCategory(editingFilm.category || '')
      setEditIsPublished(editingFilm.is_published || false)
      setEditIsFeatured(editingFilm.is_featured || false)
    }
  }, [editingFilm])

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

  // Quick toggles on list card
  const handleQuickToggle = async (id: number, field: string, val: boolean | string) => {
    await apiFetch(`/api/website/films/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: val }),
    })
    setFilms(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f))
    if (editingFilm && editingFilm.id === id) {
      if (field === 'is_published') setEditIsPublished(val as boolean)
      if (field === 'is_featured') setEditIsFeatured(val as boolean)
    }
  }

  // Save changes from drawer
  const handleSaveFilm = async () => {
    if (!editingFilm) return
    setSaving(true)
    
    const videoId = editYoutubeUrl ? extractYouTubeId(editYoutubeUrl) : null
    const yearParsed = editYear ? parseInt(editYear, 10) : null
    const finalYear = isNaN(yearParsed as number) ? null : yearParsed

    const res = await apiFetch(`/api/website/films/${editingFilm.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        subtitle: editSubtitle || null,
        location: editLocation || null,
        year: finalYear,
        youtube_url: editYoutubeUrl || null,
        youtube_video_id: videoId,
        category: editCategory || null,
        is_published: editIsPublished,
        is_featured: editIsFeatured
      }),
    })

    if (res.ok) {
      const updatedFilm = {
        ...editingFilm,
        title: editTitle,
        subtitle: editSubtitle || null,
        location: editLocation || null,
        year: finalYear,
        youtube_url: editYoutubeUrl || null,
        youtube_video_id: videoId,
        category: editCategory || null,
        is_published: editIsPublished,
        is_featured: editIsFeatured
      }
      
      setFilms(prev => prev.map(f => f.id === editingFilm.id ? updatedFilm : f))
      setEditingFilm(null)
    } else {
      alert('Failed to save changes')
    }
    setSaving(false)
  }

  const deleteFilm = async (id: number) => {
    if (!confirm('Delete this film?')) return
    await apiFetch(`/api/website/films/${id}`, { method: 'DELETE' })
    setFilms(prev => prev.filter(f => f.id !== id))
    if (editingFilm?.id === id) setEditingFilm(null)
  }

  const uploadThumb = async (filmId: number, file: File) => {
    let toUpload = file
    try {
      toUpload = await compressImage(file, { maxWidth: 1280, maxHeight: 720, quality: 0.85 })
    } catch { /* fall back to original */ }
    const form = new FormData()
    form.append('file', toUpload)
    setUploadingId(filmId)
    const r = await apiFetch(`/api/website/films/${filmId}/thumbnail`, { method: 'POST', body: form })
    const film = await r.json()
    
    setFilms(prev => prev.map(f => f.id === filmId ? film : f))
    if (editingFilm && editingFilm.id === filmId) {
      setEditingFilm(film)
    }
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

  const renderFilmCard = (film: any, isFeaturedList: boolean) => {
    const isExpanded = editingFilm?.id === film.id
    const currentCats = editCategory.split(',').map((c: string) => c.trim()).filter(Boolean)

    return (
      <motion.div 
        layout
        key={film.id} 
        draggable={!isExpanded}
        onDragStart={() => onDragStart(film.id)}
        onDragOver={e => e.preventDefault()}
        onDrop={() => onDrop(film.id, isFeaturedList)}
        style={{
          background: '#fff', 
          border: isExpanded 
            ? '2px solid #9a7d52' 
            : draggingId === film.id ? '2px solid #1a1512' : '1px solid #ece9e4', 
          borderRadius: '12px', 
          padding: '0.875rem 1.25rem',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '0',
          cursor: isExpanded ? 'default' : 'grab', 
          opacity: draggingId === film.id ? 0.5 : 1,
          transition: 'border 0.2s, opacity 0.2s, box-shadow 0.2s',
          boxShadow: isExpanded ? '0 8px 32px rgba(28,26,24,0.06)' : 'none'
        }}
        className="hover:shadow-[0_4px_16px_rgba(28,26,24,0.02)]"
      >
        {/* Card Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%', flexWrap: 'wrap' }}>
          {/* Drag handle icon */}
          {!isExpanded && (
            <div style={{ color: '#c0b9af', cursor: 'grab', paddingRight: '0.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            </div>
          )}

          {/* Thumbnail */}
          <div 
            style={{ 
              width: '96px', 
              height: '54px', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              flexShrink: 0, 
              background: '#1a1512', 
              position: 'relative', 
              cursor: 'pointer',
              border: '1px solid #ece9e4'
            }}
            onClick={() => setEditingFilm(isExpanded ? null : film)}
          >
            {film.thumbnail_url ? (
              <img src={film.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.5rem', color: '#8c867e', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>No Thumb</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px', cursor: 'pointer' }} onClick={() => setEditingFilm(isExpanded ? null : film)}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1c1a18', marginBottom: '0.2rem' }}>{film.title}</p>
            <p style={{ fontSize: '0.75rem', color: '#8c867e', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {film.location && <span>{film.location}</span>}
              {film.location && film.year && <span style={{ color: '#ece9e4' }}>•</span>}
              {film.year && <span>{film.year}</span>}
              {film.category && (
                <>
                  <span style={{ color: '#ece9e4' }}>•</span>
                  <span style={{ color: '#9a7d52', fontWeight: 500 }}>{film.category}</span>
                </>
              )}
            </p>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <QuickToggle label="Published" value={film.is_published} onChange={v => handleQuickToggle(film.id, 'is_published', v)} color="#22c55e" />
            <QuickToggle label="Featured" value={film.is_featured} onChange={v => handleQuickToggle(film.id, 'is_featured', v)} color="#3b82f6" />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setEditingFilm(isExpanded ? null : film)}
              className="admin-btn admin-btn-secondary"
              style={{ 
                padding: '0.4rem 0.75rem', 
                fontSize: '0.75rem',
                borderColor: isExpanded ? '#9a7d52' : '#ece9e4',
                color: isExpanded ? '#9a7d52' : 'inherit'
              }}
            >
              {isExpanded ? 'Close Editor' : 'Edit Detail'}
            </button>
            <button 
              onClick={() => deleteFilm(film.id)}
              className="admin-btn admin-btn-danger"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Inline Expanding Editor Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{ overflow: 'hidden', width: '100%' }}
              onClick={e => e.stopPropagation()} // Protect form fields from accidental drag/click triggers
            >
              <div style={{ borderTop: '1px solid #ece9e4', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%' }}>
                  
                  {/* Left Column: Media & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label className="admin-label">Film Cover Thumbnail</label>
                      <div 
                        onClick={() => thumbRef.current?.click()}
                        style={{
                          width: '100%', 
                          aspectRatio: '16/9', 
                          borderRadius: '10px', 
                          overflow: 'hidden', 
                          background: '#fcfbf9',
                          border: '1px solid #e5e1da',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                        }}
                        className="hover:border-[#c0b9af]"
                      >
                        {editingFilm.thumbnail_url ? (
                          <img src={editingFilm.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#8c867e' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Upload Image</span>
                          </div>
                        )}
                        
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                        >
                          <span style={{ background: '#fff', color: '#1c1a18', padding: '0.4rem 0.875rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
                            {uploadingId === editingFilm.id ? 'Optimizing...' : 'Upload New'}
                          </span>
                        </div>

                        {uploadingId === editingFilm.id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Optimizing...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Categories pill selector */}
                    <div>
                      <label className="admin-label">Categories</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {Array.from(new Set([
                          ...PREDEFINED_CATEGORIES, 
                          ...films.flatMap(f => (f.category || '').split(',').map((c:string) => c.trim()).filter(Boolean))
                        ])).sort().map((cat: string) => {
                          const isSelected = currentCats.includes(cat)
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                let newCats = [...currentCats]
                                if (isSelected) newCats = newCats.filter(c => c !== cat)
                                else newCats.push(cat)
                                setEditCategory(newCats.join(', '))
                              }}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.4rem 0.875rem',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: isSelected ? '#1c1a18' : '#e5e1da',
                                background: isSelected ? '#1c1a18' : '#fcfbf9',
                                color: isSelected ? '#fff' : '#4a4540',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                              }}
                            >
                              {cat}
                            </button>
                          )
                        })}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '320px' }}>
                        <input 
                          value={newCat} 
                          onChange={e => setNewCat(e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (!newCat.trim()) return
                              if (!currentCats.includes(newCat.trim())) {
                                setEditCategory([...currentCats, newCat.trim()].join(', '))
                              }
                              setNewCat('')
                            }
                          }}
                          placeholder="Add custom category..." 
                          className="admin-input"
                          style={{ padding: '0.35rem 0.625rem', fontSize: '0.75rem' }} 
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            if (!newCat.trim()) return
                            if (!currentCats.includes(newCat.trim())) {
                              setEditCategory([...currentCats, newCat.trim()].join(', '))
                            }
                            setNewCat('')
                          }}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Form Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label className="admin-label">Film Title</label>
                      <input 
                        className="admin-input" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        placeholder="Enter film title..."
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <label className="admin-label" style={{ marginBottom: 0 }}>Subtitle / Description</label>
                        <span style={{ fontSize: '0.625rem', color: editSubtitle.length > 280 ? '#e53e3e' : '#8c867e', fontWeight: 500 }}>
                          {editSubtitle.length} / 300
                        </span>
                      </div>
                      <textarea 
                        className="admin-input" 
                        rows={3}
                        maxLength={300}
                        style={{ 
                          resize: 'vertical', 
                          fontFamily: 'inherit',
                          lineHeight: '1.5',
                          padding: '0.75rem 1rem'
                        }}
                        value={editSubtitle} 
                        onChange={e => setEditSubtitle(e.target.value)} 
                        placeholder="Write a description or subtitle about this film..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="admin-label">Location</label>
                        <input 
                          className="admin-input" 
                          value={editLocation} 
                          onChange={e => setEditLocation(e.target.value)} 
                          placeholder="e.g. Lake Como, Italy"
                        />
                      </div>
                      <div>
                        <label className="admin-label">Year</label>
                        <input 
                          className="admin-input" 
                          type="number"
                          value={editYear} 
                          onChange={e => setEditYear(e.target.value)} 
                          placeholder="e.g. 2026"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="admin-label">YouTube URL</label>
                      <input 
                        className="admin-input" 
                        value={editYoutubeUrl} 
                        onChange={e => setEditYoutubeUrl(e.target.value)} 
                        placeholder="e.g. https://www.youtube.com/watch?v=..."
                      />
                      <p style={{ fontSize: '0.6875rem', color: '#8c867e', marginTop: '0.35rem' }}>Supports full links or short YouTube URLs.</p>
                    </div>

                    {/* Inline Status toggles */}
                    <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid #ece9e4', paddingTop: '1rem', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => setEditIsPublished(!editIsPublished)}
                          style={{
                            width: '32px', height: '18px', borderRadius: '9px',
                            background: editIsPublished ? '#22c55e' : '#ddd8d0',
                            position: 'relative', border: 'none', cursor: 'pointer',
                            transition: 'background 0.2s', padding: 0
                          }}
                        >
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '2px', left: editIsPublished ? '16px' : '2px',
                            transition: 'left 0.2s'
                          }} />
                        </button>
                        <span style={{ fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 500 }}>Published</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => setEditIsFeatured(!editIsFeatured)}
                          style={{
                            width: '32px', height: '18px', borderRadius: '9px',
                            background: editIsFeatured ? '#3b82f6' : '#ddd8d0',
                            position: 'relative', border: 'none', cursor: 'pointer',
                            transition: 'background 0.2s', padding: 0
                          }}
                        >
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '2px', left: editIsFeatured ? '16px' : '2px',
                            transition: 'left 0.2s'
                          }} />
                        </button>
                        <span style={{ fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 500 }}>Featured on Home</span>
                      </div>
                    </div>

                    {/* Inline Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #ece9e4', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                      <button 
                        className="admin-btn admin-btn-secondary" 
                        onClick={() => setEditingFilm(null)}
                        disabled={saving}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button 
                        className="admin-btn admin-btn-primary" 
                        onClick={handleSaveFilm}
                        disabled={saving || !editTitle.trim()}
                        type="button"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  const featuredFilms = films.filter(f => f.is_featured)
  const otherFilms = films.filter(f => !f.is_featured)

  const currentCats = editCategory.split(',').map((c: string) => c.trim()).filter(Boolean)

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#1c1a18' }}>Films</h1>
          <p style={{ fontSize: '0.875rem', color: '#8c867e' }}>Upload thumbnails and link unlisted YouTube videos. Drag to reorder homepage highlights.</p>
        </div>
      </div>

      {/* ── Header Background Upload ── */}
      <div className="admin-card" style={{ marginBottom: '3.5rem', padding: '1.5rem' }}>
        <h2 className="admin-label" style={{ marginBottom: '0.75rem' }}>
          Films Page Header Image / Video
        </h2>
        
        <div
          onClick={() => bgInputRef.current?.click()}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDropBg}
          style={{
            width: '100%', height: '160px',
            background: headerBg ? 'none' : '#fcfbf9',
            border: isDragActive ? '2px solid #9a7d52' : '1px dashed #e5e1da',
            borderRadius: '10px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          className="hover:border-[#c0b9af]"
        >
          {headerBg && headerBgType === 'video' ? (
            <video src={headerBg} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : headerBg ? (
            <img src={headerBg} alt="Header Bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : null}
          
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', background: headerBg ? 'rgba(255,255,255,0.92)' : 'none', padding: headerBg ? '0.5rem 1.25rem' : '0', borderRadius: '8px', boxShadow: headerBg ? '0 4px 12px rgba(28,26,24,0.05)' : 'none' }}>
            <span style={{ fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 500 }}>
              {headerBg ? 'Click or drag to replace media' : 'Click or drag image/video file here'}
            </span>
            <p style={{ fontSize: '0.75rem', color: '#8c867e', marginTop: '0.25rem' }}>Full bleed landscape (e.g. 2560x1440)</p>
          </div>

          {bgUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <div style={{ width: '50%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ width: `${bgProgress}%`, height: '100%', background: '#9a7d52', transition: 'width 0.2s' }} />
              </div>
              <span style={{ color: '#ffffff', fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>UPLOADING {bgProgress}%</span>
            </div>
          )}
        </div>
        <input ref={bgInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadHeaderBg(e.target.files[0])} />
      </div>

      {/* Create new */}
      <div className="admin-card" style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem', alignItems: 'center' }}>
        <input 
          className="admin-input"
          placeholder="New film title… (e.g. A Parisian Romance)" 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createFilm()} 
          style={{ flex: 1 }}
        />
        <button 
          onClick={createFilm} 
          disabled={creating || !newTitle.trim()} 
          className="admin-btn admin-btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {creating ? 'Creating…' : '+ New Film'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>Loading films…</p>
      ) : films.length === 0 ? (
        <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>No films yet. Create your first one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Featured Section */}
          <section>
            <h2 style={{ fontSize: '0.8125rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1c1a18', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#9a7d52' }}>★</span> Featured Films (Homepage Grid)
            </h2>
            {featuredFilms.length === 0 ? (
              <div style={{ padding: '2.5rem', border: '1px dashed #e5e1da', borderRadius: '12px', textAlign: 'center', color: '#8c867e', fontSize: '0.875rem', background: '#fcfbf9' }}>
                Toggle "Featured" on any film below to feature it on the homepage highlights.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {featuredFilms.map(f => renderFilmCard(f, true))}
              </div>
            )}
          </section>

          {/* All Other Films */}
          <section style={{ marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '0.8125rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8c867e', fontWeight: 600, marginBottom: '1.25rem' }}>
              All Other Films (Gallery Portfolio)
            </h2>
            {otherFilms.length === 0 ? (
              <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>No other films listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {otherFilms.map(f => renderFilmCard(f, false))}
              </div>
            )}
          </section>

        </div>
      )}

      {/* Hidden file input for thumbnail */}
      <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0] && editingFilm) uploadThumb(editingFilm.id, e.target.files[0]) }} />
    </div>
  )
}

// Quick toggle styling component
function QuickToggle({ label, value, onChange, color }: { label: string; value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '0.35rem 0.75rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: value ? color : '#f0f0f0',
      color: value ? '#fff' : '#888',
      fontWeight: 600, transition: 'all 0.2s',
    }}>
      {label}
    </button>
  )
}
