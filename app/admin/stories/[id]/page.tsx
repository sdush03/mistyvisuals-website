'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

type Photo = {
  id: number; file_url: string; file_url_thumb?: string
  blur_data_url?: string; is_cover: boolean; display_order: number; tab_name?: string | null
}

export default function AdminStoryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [story, setStory] = useState<any>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [tabsString, setTabsString] = useState('')
  const [newCat, setNewCat] = useState('')
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [allStories, setAllStories] = useState<any[]>([])

  const PREDEFINED_CATEGORIES = ['Destination', 'Intimate', 'Night', 'Pre-Wedding']

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/website/admin/stories/${id}`).then(r => r.json()),
      apiFetch('/api/website/admin/stories').then(r => r.json())
    ]).then(([storyData, allStoriesData]) => {
      if (storyData.date) storyData.date = new Date(storyData.date).toISOString().split('T')[0]
      setStory(storyData)
      setPhotos((storyData.photos || []).sort((a: Photo, b: Photo) => a.display_order - b.display_order))
      setTabsString((storyData.tabs || []).join(', '))
      
      const cats = new Set<string>()
      allStoriesData.forEach((s: any) => {
        (s.category || '').split(',').forEach((c: string) => {
          if (c.trim()) cats.add(c.trim())
        })
      })
      setAllCategories(Array.from(cats))
      setAllStories(allStoriesData)
    })
  }, [id])

  const saveStory = async () => {
    setSaving(true)
    await apiFetch(`/api/website/stories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: story.title, subtitle: story.subtitle,
        location: story.location, date: story.date,
        category: story.category, is_published: story.is_published,
        is_featured: story.is_featured,
        tabs: tabsString.split(',').map(t=>t.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const uploadPhotos = async (files: File[], tabName: string | null = null) => {
    if (!files.length) return
    setUploading(true)
    setUploadProgress(0)
    const form = new FormData()
    files.forEach(f => form.append('file', f))

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => e.lengthComputable && setUploadProgress(Math.round(e.loaded / e.total * 100))
      xhr.onload = () => {
        if (xhr.status < 300) {
          const newPhotos: Photo[] = JSON.parse(xhr.responseText)
          setPhotos(prev => [...prev, ...newPhotos].sort((a, b) => a.display_order - b.display_order))
          resolve()
        } else reject(new Error(xhr.responseText))
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.open('POST', `${API}/api/website/stories/${id}/photos${tabName ? `?tab=${encodeURIComponent(tabName)}` : ''}`)
      xhr.withCredentials = true
      xhr.send(form)
    }).catch(console.error)

    setUploading(false)
    setUploadProgress(0)
  }

  const setCover = async (photoId: number) => {
    await apiFetch(`/api/website/story-photos/${photoId}/cover`, { method: 'PATCH' })
    setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photoId })))
    setStory((s: any) => ({ ...s, cover_image_url: photos.find(p => p.id === photoId)?.file_url }))
  }

  const deletePhoto = async (photoId: number) => {
    await apiFetch(`/api/website/story-photos/${photoId}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  // Drag-drop reorder
  const onDragStart = (id: number) => setDraggingId(id)
  const onDrop = useCallback(async (targetId: number) => {
    if (draggingId === null || draggingId === targetId) return
    const reordered = [...photos]
    const fromIdx = reordered.findIndex(p => p.id === draggingId)
    const toIdx   = reordered.findIndex(p => p.id === targetId)
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updated = reordered.map((p, i) => ({ ...p, display_order: i }))
    setPhotos(updated)
    setDraggingId(null)
    await apiFetch(`/api/website/stories/${id}/photos/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: updated.map(p => ({ id: p.id, display_order: p.display_order })) }),
    })
  }, [draggingId, photos, id])

  const input = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9375rem' }
  const label = { fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', display: 'block', marginBottom: '0.35rem' }

  if (!story) return <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading…</p>

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <a href="/admin/stories" style={{ fontSize: '0.75rem', color: '#aaa', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}>← Stories</a>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>{story.title}</h1>
        </div>
        <button onClick={saveStory} disabled={saving} style={{
          background: saved ? '#22c55e' : '#1a1512', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Story details */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[['Title', 'title', 'text', ''], ['Subtitle', 'subtitle', 'text', ''], ['Location', 'location', 'text', ''], ['Date', 'date', 'date', '']].map(([lbl, field, type, placeholder]) => (
            <div key={field}>
              <label style={label}>{lbl}</label>
              <input type={type as any} style={input} placeholder={placeholder} value={(story as any)[field] || ''}
                onChange={e => setStory((s: any) => ({ ...s, [field]: e.target.value }))} />
            </div>
          ))}

          
          {/* Tabs Input */}
          <div>
            <label style={label}>Event Tabs (Comma separated)</label>
            <input type="text" style={input} placeholder="e.g. Haldi, Wedding" value={tabsString}
              onChange={e => setTabsString(e.target.value)} />
            <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.3rem' }}>Creates separate galleries for each event.</p>
          </div>

          {/* Custom Category Multi-Select Dropdown */}
          <div style={{ position: 'relative' }}>
            <label style={label}>Categories</label>
            <div 
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              style={{
                ...input,
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
                color: story.category ? '#000' : '#888'
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                {story.category || 'Select categories...'}
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: catDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {catDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '0.5rem 0',
                maxHeight: '300px', overflowY: 'auto'
              }}>
                {Array.from(new Set([...PREDEFINED_CATEGORIES, ...allCategories, ...(story.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)])).sort().map(cat => {
                  const currentCats = (story.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
                  const isSelected = currentCats.includes(cat)
                  const othersCount = allStories.filter(s => s.id !== parseInt(id) && (s.category || '').split(',').map((c:string)=>c.trim()).includes(cat)).length
                  const count = othersCount + (isSelected ? 1 : 0)
                  return (
                    <div 
                      key={cat}
                      onClick={() => {
                        let newCats = [...currentCats]
                        if (isSelected) newCats = newCats.filter(c => c !== cat)
                        else newCats.push(cat)
                        setStory((s: any) => ({ ...s, category: newCats.join(', ') }))
                      }}
                      style={{
                        padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: isSelected ? '#f7f5f2' : 'transparent',
                        fontSize: '0.875rem'
                      }}
                    >
                      <div style={{ 
                        width: '16px', height: '16px', border: '1px solid #ccc', borderRadius: '3px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSelected ? '#1a1512' : '#fff', borderColor: isSelected ? '#1a1512' : '#ccc',
                        flexShrink: 0
                      }}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
                      <span style={{ color: '#aaa', fontSize: '0.75rem' }}>({count})</span>
                    </div>
                  )
                })}
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }} onClick={e => e.stopPropagation()}>
                  <input 
                    value={newCat} 
                    onChange={e => setNewCat(e.target.value)} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (!newCat.trim()) return
                        const currentCats = (story.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
                        if (!currentCats.includes(newCat.trim())) {
                          setStory((s: any) => ({ ...s, category: [...currentCats, newCat.trim()].join(', ') }))
                        }
                        setNewCat('')
                      }
                    }}
                    placeholder="New category..." 
                    style={{ ...input, padding: '0.4rem 0.5rem', fontSize: '0.8125rem' }} 
                  />
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      if (!newCat.trim()) return
                      const currentCats = (story.category || '').split(',').map((c: string) => c.trim()).filter(Boolean)
                      if (!currentCats.includes(newCat.trim())) {
                        setStory((s: any) => ({ ...s, category: [...currentCats, newCat.trim()].join(', ') }))
                      }
                      setNewCat('')
                    }}
                    style={{ background: '#1a1512', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            
            {/* Close dropdown when clicking outside (simple overlay trick) */}
            {catDropdownOpen && (
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 9 }} 
                onClick={() => setCatDropdownOpen(false)}
              />
            )}
          </div>
          <div>
            <label style={label}>Status</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['is_published', 'is_featured'].map(field => (
                <button key={field} onClick={() => setStory((s: any) => ({ ...s, [field]: !s[field] }))} style={{
                  fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.4rem 0.875rem',
                  borderRadius: '20px', border: 'none', cursor: 'pointer',
                  background: (story as any)[field] ? '#22c55e' : '#f0f0f0',
                  color: (story as any)[field] ? '#fff' : '#888', fontWeight: 500,
                }}>
                  {field === 'is_published' ? 'Published' : 'Featured'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      
      {/* Photo upload per tab */}
      {['All', ...tabsString.split(',').map(t=>t.trim()).filter(Boolean)].map(tab => {
        const isAll = tab === 'All';
        const tabPhotos = isAll ? photos.filter(p => !p.tab_name || p.tab_name === 'All') : photos.filter(p => p.tab_name === tab);
        return (
          <div key={tab} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '0.2rem' }}>{isAll ? 'Gallery Photos (Default)' : `${tab} Photos`}</h2>
                <p style={{ fontSize: '0.75rem', color: '#aaa' }}>{tabPhotos.length} photos · Drag to reorder · Click star to set cover</p>
              </div>
              <button onClick={() => {
                const el = document.getElementById(`file-${tab}`);
                if (el) el.click();
              }} style={{
                background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
                padding: '0.625rem 1.25rem', fontSize: '0.8125rem', cursor: 'pointer',
              }}>
                + Upload to {tab}
              </button>
              <input id={`file-${tab}`} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => e.target.files && uploadPhotos(Array.from(e.target.files), isAll ? null : tab)} />
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const files = Array.from(e.dataTransfer.files).filter((f: any) => f.type.startsWith('image/'))
                if (files.length) uploadPhotos(files, isAll ? null : tab)
              }}
              style={{
                border: `2px dashed ${dragOver ? '#1a1512' : '#e0e0e0'}`,
                borderRadius: '8px', padding: '1.25rem', textAlign: 'center',
                marginBottom: '1.25rem', background: dragOver ? '#f7f5f2' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? (
                <div>
                  <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#1a1512', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#555' }}>Uploading & optimizing {uploadProgress}%…</p>
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#bbb' }}>Drop photos here to add them to {tab}</p>
              )}
            </div>

            {tabPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {tabPhotos.map(photo => (
                  <div key={photo.id}
                    draggable
                    onDragStart={() => onDragStart(photo.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(photo.id)}
                    style={{
                      position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden',
                      cursor: 'grab', border: draggingId === photo.id ? '2px solid #1a1512' : '2px solid transparent',
                      background: '#f0ede8',
                    }}
                  >
                    <img src={photo.file_url_thumb || photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {photo.is_cover && (
                      <div style={{ position: 'absolute', top: '5px', left: '5px', background: '#b8965a', borderRadius: '4px', padding: '2px 6px', fontSize: '0.5625rem', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Cover
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,8,6,0.6)', padding: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                      <button onClick={() => setCover(photo.id)} title="Set as cover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1 }}>
                        {photo.is_cover ? '⭐' : '☆'}
                      </button>
                      <button onClick={() => deletePhoto(photo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '0.75rem' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )
}

