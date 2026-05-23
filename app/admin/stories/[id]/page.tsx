'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [initialStory, setInitialStory] = useState<any>(null) // Dirty state tracking
  const [photos, setPhotos] = useState<Photo[]>([])
  
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Isolated upload states
  const [uploadingTab, setUploadingTab] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [tabs, setTabs] = useState<string[]>([])
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
      setInitialStory(JSON.parse(JSON.stringify(storyData))) // deep clone
      setPhotos((storyData.photos || []).sort((a: Photo, b: Photo) => a.display_order - b.display_order))
      setTabs(storyData.tabs || [])
      
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
    const res = await apiFetch(`/api/website/stories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: story.title, subtitle: story.subtitle,
        location: story.location, date: story.date,
        category: story.category, is_published: story.is_published,
        is_featured: story.is_featured,
        tabs: tabs,
      }),
    })
    
    if (res.ok) {
      setInitialStory(JSON.parse(JSON.stringify({ ...story, tabs }))) // Sync dirty state
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Failed to save story changes')
    }
    setSaving(false)
  }

  const uploadPhotos = async (files: File[], tabName: string | null = null) => {
    if (!files.length) return
    const activeTab = tabName || 'All'
    setUploadingTab(activeTab)
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
    }).catch(err => {
      console.error(err)
      alert('Photo upload failed')
    })

    setUploadingTab(null)
    setUploadProgress(0)
  }

  const uploadCover = async (file: File, type: 'grid' | 'desktop' | 'mobile') => {
    setUploadingTab(`cover-${type}`)
    const form = new FormData()
    form.append('file', file)
    form.append('coverType', type)

    const res = await apiFetch(`/api/website/stories/${id}/covers`, {
      method: 'POST',
      body: form
    })
    const data = await res.json()
    if (res.ok) {
      setStory(data.story)
      setInitialStory(JSON.parse(JSON.stringify(data.story)))
    } else {
      alert('Failed to upload cover: ' + (data.error || 'Unknown error'))
    }
    setUploadingTab(null)
  }

  const deletePhoto = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    await apiFetch(`/api/website/story-photos/${photoId}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const renameTab = async (oldName: string, newName: string) => {
    if (!newName || newName.trim() === '' || oldName === newName) return
    const trimmedNewName = newName.trim()
    
    // Optimistic UI update
    setTabs(prev => prev.map(t => t === oldName ? trimmedNewName : t))
    setPhotos(prev => prev.map(p => p.tab_name === oldName ? { ...p, tab_name: trimmedNewName } : p))
    
    const res = await apiFetch(`/api/website/stories/${id}/tabs/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName: trimmedNewName })
    })
    
    if (!res.ok) {
      alert('Failed to rename tab. Please refresh the page.')
    }
  }

  const moveTab = (idx: number, direction: 'left' | 'right') => {
    const nextIdx = direction === 'left' ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= tabs.length) return
    const updatedTabs = [...tabs]
    const [moved] = updatedTabs.splice(idx, 1)
    updatedTabs.splice(nextIdx, 0, moved)
    setTabs(updatedTabs)
  }

  const movePhoto = async (photoId: number, direction: 'left' | 'right') => {
    const activePhotos = [...photos]
    const currentIdx = activePhotos.findIndex(p => p.id === photoId)
    if (currentIdx === -1) return

    const photo = activePhotos[currentIdx]
    const tabName = photo.tab_name || 'All'
    
    // Filter photos belonging to the same tab
    const sameTabPhotos = activePhotos.filter(p => (!p.tab_name && tabName === 'All') || p.tab_name === photo.tab_name)
    const activeSubIdx = sameTabPhotos.findIndex(p => p.id === photoId)
    if (activeSubIdx === -1) return

    const nextSubIdx = direction === 'left' ? activeSubIdx - 1 : activeSubIdx + 1
    if (nextSubIdx < 0 || nextSubIdx >= sameTabPhotos.length) return

    const targetPhoto = sameTabPhotos[nextSubIdx]
    
    // Swapping displays
    const dragIdx = activePhotos.findIndex(p => p.id === photo.id)
    const hoverIdx = activePhotos.findIndex(p => p.id === targetPhoto.id)
    if (dragIdx === -1 || hoverIdx === -1) return

    const updatedPhotos = [...photos]
    const [movedItem] = updatedPhotos.splice(dragIdx, 1)
    updatedPhotos.splice(hoverIdx, 0, movedItem)

    const finalPhotos = updatedPhotos.map((p, i) => ({ ...p, display_order: i }))
    setPhotos(finalPhotos)

    // Save DB reorder
    await apiFetch(`/api/website/stories/${id}/photos/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: finalPhotos.map(p => ({ id: p.id, display_order: p.display_order }))
      })
    })
  }

  // Determine dirty state (modified but unsaved changes)
  const isDirty = story && initialStory && (
    story.title !== initialStory.title ||
    story.subtitle !== initialStory.subtitle ||
    story.location !== initialStory.location ||
    story.date !== initialStory.date ||
    story.category !== initialStory.category ||
    story.is_published !== initialStory.is_published ||
    story.is_featured !== initialStory.is_featured ||
    JSON.stringify(tabs) !== JSON.stringify(initialStory.tabs || [])
  )

  if (!story) return <p style={{ color: '#c0b9af', fontSize: '0.875rem' }}>Loading editorial details…</p>

  return (
    <div style={{ maxWidth: '1000px', marginBottom: '6rem' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <a href="/admin/stories" style={{ fontSize: '0.75rem', color: '#c0b9af', textDecoration: 'none', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            ← Back to Stories
          </a>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#1c1a18' }}>{story.title}</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isDirty && (
            <span style={{ fontSize: '0.75rem', color: '#9a7d52', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9a7d52', display: 'inline-block' }}></span>
              Unsaved changes pending
            </span>
          )}
          
          <button 
            onClick={saveStory} 
            disabled={saving} 
            className="admin-btn admin-btn-primary animate-all duration-200"
            style={{
              background: saved ? '#22c55e' : isDirty ? '#9a7d52' : '#1c1a18',
              boxShadow: isDirty ? '0 4px 12px rgba(154, 125, 82, 0.2)' : 'none'
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Editorial details Form */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { label: 'Title', field: 'title', type: 'text', placeholder: 'Enter story title...' },
            { label: 'Subtitle', field: 'subtitle', type: 'text', placeholder: 'e.g. A Parisian Elopement' },
            { label: 'Location', field: 'location', type: 'text', placeholder: 'e.g. Paris, France' },
            { label: 'Date', field: 'date', type: 'date', placeholder: '' }
          ].map(inp => (
            <div key={inp.field}>
              <label className="admin-label">{inp.label}</label>
              <input 
                type={inp.type} 
                className="admin-input" 
                placeholder={inp.placeholder} 
                value={(story as any)[inp.field] || ''}
                onChange={e => setStory((s: any) => ({ ...s, [inp.field]: e.target.value }))} 
              />
            </div>
          ))}

          {/* Event Tabs Sub-galleries Input */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #ece9e4', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <label className="admin-label">Event Galleries / Sub-tabs</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              {tabs.map((tab, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: '#fcfbf9', padding: '0.4rem 0.875rem', borderRadius: '20px',
                  border: '1px solid #e5e1da', fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 500
                }}>
                  {/* Move Left */}
                  <button 
                    onClick={() => moveTab(idx, 'left')} 
                    disabled={idx === 0} 
                    title="Move Left" 
                    style={{
                      background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      color: idx === 0 ? '#e5e1da' : '#8c867e', padding: '0 2px', display: 'flex', alignItems: 'center',
                      fontSize: '0.875rem', transition: 'color 0.2s'
                    }}
                  >
                    ←
                  </button>
                  
                  <span>{tab}</span>
                  
                  {/* Move Right */}
                  <button 
                    onClick={() => moveTab(idx, 'right')} 
                    disabled={idx === tabs.length - 1} 
                    title="Move Right" 
                    style={{
                      background: 'none', border: 'none', cursor: idx === tabs.length - 1 ? 'not-allowed' : 'pointer',
                      color: idx === tabs.length - 1 ? '#e5e1da' : '#8c867e', padding: '0 2px', display: 'flex', alignItems: 'center',
                      fontSize: '0.875rem', transition: 'color 0.2s'
                    }}
                  >
                    →
                  </button>
                  
                  <span style={{ width: '1px', height: '10px', background: '#ece9e4', margin: '0 2px' }} />

                  <button onClick={() => {
                    const newName = prompt(`Rename event tab "${tab}" to:`, tab)
                    if (newName !== null) renameTab(tab, newName)
                  }} title="Rename Tab" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8c867e', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Remove event tab "${tab}"? (Photos in this tab will remain in the main gallery but lose this tab label)`)) {
                        setTabs(prev => prev.filter(t => t !== tab))
                      }
                    }} 
                    title="Remove Tab" 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', padding: 0, fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  const newTab = prompt('New Event Tab Name (e.g. Sangeet, Mehendi, Cocktail):')
                  if (newTab && newTab.trim() && !tabs.includes(newTab.trim())) {
                    setTabs(prev => [...prev, newTab.trim()])
                  }
                }} 
                className="admin-btn admin-btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '20px', borderStyle: 'dashed' }}
              >
                + Add Event Tab
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#8c867e', marginTop: '0.3rem' }}>Organizes the story into separate galleries for different events. Renaming tabs dynamically re-labels the associated photos.</p>
          </div>

          {/* Categories Multi-Select */}
          <div style={{ position: 'relative' }}>
            <label className="admin-label">Categories</label>
            <div 
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="admin-input"
              style={{
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: story.category ? '#1c1a18' : '#c0b9af'
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                {story.category || 'Select categories...'}
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: catDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {catDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: '#fff', border: '1px solid #e5e1da', borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(28,26,24,0.08)', zIndex: 50, padding: '0.5rem 0',
                maxHeight: '260px', overflowY: 'auto'
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
                        padding: '0.45rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem',
                        background: isSelected ? '#f7f6f4' : 'transparent',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <div style={{ 
                        width: '14px', height: '14px', border: '1px solid #c0b9af', borderRadius: '3px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSelected ? '#1c1a18' : '#fff', borderColor: isSelected ? '#1c1a18' : '#c0b9af',
                        flexShrink: 0
                      }}>
                        {isSelected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#1c1a18' : '#4a4540' }}>{cat}</span>
                      <span style={{ color: '#c0b9af', fontSize: '0.7rem' }}>({count})</span>
                    </div>
                  )
                })}
                <div style={{ padding: '0.45rem 1rem', borderTop: '1px solid #ece9e4', display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }} onClick={e => e.stopPropagation()}>
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
                    className="admin-input"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} 
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
                    className="admin-btn admin-btn-primary"
                    style={{ padding: '0 0.75rem', fontSize: '0.7rem', borderRadius: '6px' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            
            {catDropdownOpen && (
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                onClick={() => setCatDropdownOpen(false)}
              />
            )}
          </div>

          {/* Published / Featured Toggles */}
          <div>
            <label className="admin-label">Story Status</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '38px' }}>
              {[
                { label: 'Published', field: 'is_published', color: '#22c55e' },
                { label: 'Featured', field: 'is_featured', color: '#3b82f6' }
              ].map(t => (
                <button 
                  key={t.field} 
                  onClick={() => setStory((s: any) => ({ ...s, [t.field]: !s[t.field] }))} 
                  style={{
                    fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.45rem 0.875rem',
                    borderRadius: '20px', border: 'none', cursor: 'pointer',
                    background: (story as any)[t.field] ? t.color : '#f0f0f0',
                    color: (story as any)[t.field] ? '#fff' : '#888', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Story Covers Section */}
      <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: '#1c1a18', marginBottom: '0.25rem' }}>Cover Settings</h2>
        <p style={{ fontSize: '0.75rem', color: '#8c867e', marginBottom: '1.5rem' }}>Set optimized landscape covers for wide-screen viewports, portrait layouts for mobile screens, and square crops for layouts grid.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {[
            { label: 'Grid Cover (Square / Landscape)', key: 'grid_image_url', type: 'grid' as const, desc: 'Displayed on Portfolio listing grids' },
            { label: 'Desktop Banner (Landscape)', key: 'cover_image_url', type: 'desktop' as const, desc: 'Wide banner displayed at page headers' },
            { label: 'Mobile Banner (Portrait)', key: 'cover_image_mobile_url', type: 'mobile' as const, desc: 'Tall banner displayed on mobile screens' },
          ].map(cover => {
            const isCoverUploading = uploadingTab === `cover-${cover.type}`
            return (
              <div key={cover.type} style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="admin-label">{cover.label}</label>
                <p style={{ fontSize: '0.7rem', color: '#8c867e', marginBottom: '0.5rem' }}>{cover.desc}</p>
                <div style={{
                  position: 'relative', aspectRatio: cover.type === 'mobile' ? '3/4' : '3/2',
                  background: '#fcfbf9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e1da',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {story[cover.key] ? (
                    <img src={story[cover.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#c0b9af' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.35rem' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>No Cover Set</span>
                    </div>
                  )}
                  
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.45)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    <button 
                      onClick={() => document.getElementById(`cover-${cover.type}`)?.click()} 
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '0.45rem 0.875rem', fontSize: '0.75rem', fontWeight: 500 }}
                    >
                      {isCoverUploading ? 'Optimizing...' : 'Upload Image'}
                    </button>
                    <input type="file" id={`cover-${cover.type}`} style={{ display: 'none' }} accept="image/*"
                      onChange={e => { if (e.target.files?.[0]) uploadCover(e.target.files[0], cover.type) }}
                    />
                  </div>

                  {isCoverUploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,24,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Optimizing...</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Photo lists per sub-gallery tab */}
      {['All', ...tabs].map(tab => {
        const isAll = tab === 'All';
        const tabPhotos = isAll 
          ? photos.filter(p => !p.tab_name || p.tab_name === 'All') 
          : photos.filter(p => p.tab_name === tab);
        
        return (
          <div key={tab} className="admin-card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
            
            {/* Header controls for tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: '#1c1a18', marginBottom: '0.2rem' }}>
                  {isAll ? 'Gallery Photos (Default Grid)' : `${tab} Tab Photos`}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#8c867e' }}>{tabPhotos.length} photos assigned • Use ← and → buttons to reorder photos.</p>
              </div>
              
              <button 
                onClick={() => document.getElementById(`file-${tab}`)?.click()} 
                className="admin-btn admin-btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                + Upload to {tab}
              </button>
              <input id={`file-${tab}`} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => e.target.files && uploadPhotos(Array.from(e.target.files), isAll ? null : tab)} 
              />
            </div>

            {/* Uploading progress indicator */}
            {uploadingTab === tab && (
              <div style={{ 
                background: '#fcfbf9', 
                border: '1px solid #ece9e4', 
                borderRadius: '8px', 
                padding: '1rem', 
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ height: '4px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ height: '100%', background: '#9a7d52', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#1c1a18', fontWeight: 500, margin: 0 }}>
                  Uploading & optimizing {uploadProgress}%…
                </p>
              </div>
            )}

            {/* Premium Reordering photo grids */}
            {tabPhotos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                {tabPhotos.map((photo, subIdx) => {
                  return (
                    <motion.div 
                      layout
                      key={photo.id}
                      style={{
                        position: 'relative', 
                        aspectRatio: '1', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        border: '1px solid #ece9e4',
                        background: '#fcfbf9',
                        transition: 'border-color 0.2s',
                      }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    >
                      <img src={photo.file_url_thumb || photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {photo.is_cover && (
                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#9a7d52', borderRadius: '4px', padding: '2px 6px', fontSize: '0.5625rem', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, zIndex: 11 }}>
                          Cover
                        </div>
                      )}
                      
                      {/* Premium Glassmorphism Bottom Action Bar */}
                      <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        background: 'rgba(28, 26, 24, 0.82)', 
                        backdropFilter: 'blur(6px)',
                        padding: '0.375rem 0.5rem', 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        zIndex: 10
                      }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {/* Move Left */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); movePhoto(photo.id, 'left'); }}
                            disabled={subIdx === 0}
                            title="Move Left"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: subIdx === 0 ? 'not-allowed' : 'pointer',
                              color: subIdx === 0 ? 'rgba(255,255,255,0.25)' : '#fff',
                              fontSize: '0.75rem',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.2s',
                              fontWeight: 600
                            }}
                          >
                            ←
                          </button>
                          
                          {/* Move Right */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); movePhoto(photo.id, 'right'); }}
                            disabled={subIdx === tabPhotos.length - 1}
                            title="Move Right"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: subIdx === tabPhotos.length - 1 ? 'not-allowed' : 'pointer',
                              color: subIdx === tabPhotos.length - 1 ? 'rgba(255,255,255,0.25)' : '#fff',
                              fontSize: '0.75rem',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.2s',
                              fontWeight: 600
                            }}
                          >
                            →
                          </button>
                        </div>

                        {/* Delete */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                          title="Delete Photo"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#fca5a5',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', border: '1px dashed #e5e1da', borderRadius: '8px', textAlign: 'center', color: '#c0b9af', fontSize: '0.8125rem' }}>
                No photos uploaded yet in this section. Click '+ Upload to {tab}' above to begin.
              </div>
            )}

          </div>
        );
      })}
    </div>
  )
}
