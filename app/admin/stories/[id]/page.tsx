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
  const [activeDragOverTab, setActiveDragOverTab] = useState<string | null>(null)
  
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([])
  const [dragOverPhotoId, setDragOverPhotoId] = useState<number | null>(null)
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    tabName: string;
  } | null>(null)
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [tabs, setTabs] = useState<string[]>([])
  const [newCat, setNewCat] = useState('')
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [allStories, setAllStories] = useState<any[]>([])
  const [linkedFilms, setLinkedFilms] = useState<number[]>([])
  const [allFilms, setAllFilms] = useState<any[]>([])
  const [linkedReels, setLinkedReels] = useState<number[]>([])
  const [allReels, setAllReels] = useState<any[]>([])

  const PREDEFINED_CATEGORIES = ['Destination', 'Intimate', 'Night', 'Pre-Wedding']

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/website/admin/stories/${id}`).then(r => r.json()),
      apiFetch('/api/website/admin/stories').then(r => r.json()),
      apiFetch('/api/website/admin/films').then(r => r.json()),
      apiFetch('/api/website/admin/reels').then(r => r.json())
    ]).then(([storyData, allStoriesData, allFilmsData, allReelsData]) => {
      if (storyData.date) storyData.date = new Date(storyData.date).toISOString().split('T')[0]
      setStory(storyData)
      setInitialStory(JSON.parse(JSON.stringify(storyData))) // deep clone
      setPhotos((storyData.photos || []).sort((a: Photo, b: Photo) => a.display_order - b.display_order))
      setTabs(storyData.tabs || [])
      setLinkedFilms((storyData.films || []).map((f: any) => f.id))
      setLinkedReels((storyData.reels || []).map((r: any) => r.id))
      setAllFilms(allFilmsData || [])
      setAllReels(allReelsData || [])
      
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

  // Marquee mouse drag multi-selection hook
  useEffect(() => {
    if (!marquee) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMarquee(prev => {
        if (!prev) return null
        
        const nextMarquee = {
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY
        }

        // Bounding box boundary values
        const left = Math.min(nextMarquee.startX, nextMarquee.currentX)
        const top = Math.min(nextMarquee.startY, nextMarquee.currentY)
        const right = Math.max(nextMarquee.startX, nextMarquee.currentX)
        const bottom = Math.max(nextMarquee.startY, nextMarquee.currentY)

        // Find cards inside active marquee tab grid container
        const gridElement = document.getElementById(`grid-container-${nextMarquee.tabName}`)
        if (!gridElement) return nextMarquee

        const cards = gridElement.querySelectorAll('.admin-photo-card')
        const newlySelected: number[] = []

        cards.forEach(card => {
          const cardIdAttr = card.getAttribute('data-id')
          if (!cardIdAttr) return
          const cardId = Number(cardIdAttr)
          
          const cardRect = card.getBoundingClientRect()
          const isOverlapping = !(
            cardRect.right < left ||
            cardRect.left > right ||
            cardRect.bottom < top ||
            cardRect.top > bottom
          )

          if (isOverlapping) {
            newlySelected.push(cardId)
          }
        })

        // Enforce same-tab selection: update state atomically
        setSelectedPhotoIds(newlySelected)

        return nextMarquee
      })
    }

    const handleGlobalMouseUp = () => {
      setMarquee(null)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [marquee])

  const startMarquee = (e: React.MouseEvent<HTMLDivElement>, tabName: string) => {
    if (e.button !== 0) return // Only left click

    // If click initiated inside an interactive element, do not draw marquee box
    const target = e.target as HTMLElement
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('input') || 
      target.closest('.admin-photo-card')
    ) {
      return
    }

    // Initialize marquee coordinates
    setMarquee({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      tabName
    })
  }


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
        film_ids: linkedFilms,
        reel_ids: linkedReels,
      }),
    })
    
    if (res.ok) {
      setInitialStory(JSON.parse(JSON.stringify({ 
        ...story, 
        tabs, 
        films: (story.films || []).filter((f: any) => linkedFilms.includes(f.id)),
        reels: (story.reels || []).filter((r: any) => linkedReels.includes(r.id))
      }))) // Sync dirty state
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

  const areSelectedAdjacent = (tabPhotos: Photo[]): boolean => {
    const tabSelectedIds = selectedPhotoIds.filter(id => tabPhotos.some(p => p.id === id))
    if (tabSelectedIds.length <= 1) return true
    const indices = tabPhotos
      .map((p, idx) => ({ id: p.id, idx }))
      .filter(item => tabSelectedIds.includes(item.id))
      .map(item => item.idx)
      .sort((a, b) => a - b)
    
    for (let i = 0; i < indices.length - 1; i++) {
      if (indices[i + 1] - indices[i] !== 1) return false
    }
    return true
  }

  const handlePhotoSelect = (photo: Photo) => {
    setSelectedPhotoIds(prev => {
      if (prev.length === 0) return [photo.id]
      const firstSelected = photos.find(p => p.id === prev[0])
      const sameTab = firstSelected && (
        (firstSelected.tab_name || 'All') === (photo.tab_name || 'All')
      )
      if (sameTab) {
        return prev.includes(photo.id) 
          ? prev.filter(id => id !== photo.id) 
          : [...prev, photo.id]
      } else {
        return [photo.id]
      }
    })
  }

  const handlePhotoDrop = async (targetPhotoId: number, tabPhotos: Photo[]) => {
    if (draggingId === null || draggingId === targetPhotoId) return

    const isDraggingSelectedGroup = selectedPhotoIds.includes(draggingId)

    if (isDraggingSelectedGroup) {
      if (!areSelectedAdjacent(tabPhotos)) {
        alert('Resequencing multiple photos together is supported only for adjacent selections.')
        setDraggingId(null)
        return
      }

      const groupItems = photos.filter(p => selectedPhotoIds.includes(p.id))
      const remainingItems = photos.filter(p => !selectedPhotoIds.includes(p.id))
      
      const targetIdxInRemaining = remainingItems.findIndex(p => p.id === targetPhotoId)
      if (targetIdxInRemaining === -1) return

      const updatedPhotos = [...remainingItems]
      updatedPhotos.splice(targetIdxInRemaining, 0, ...groupItems)

      const finalPhotos = updatedPhotos.map((p, i) => ({ ...p, display_order: i }))
      setPhotos(finalPhotos)
      setSelectedPhotoIds([])
      setDraggingId(null)
      setDragOverPhotoId(null)

      await apiFetch(`/api/website/stories/${id}/photos/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: finalPhotos.map(p => ({ id: p.id, display_order: p.display_order }))
        })
      })
    } else {
      const activePhotos = [...photos]
      const fromIdx = activePhotos.findIndex(p => p.id === draggingId)
      const toIdx = activePhotos.findIndex(p => p.id === targetPhotoId)
      if (fromIdx === -1 || toIdx === -1) return

      const updatedPhotos = [...photos]
      const [movedItem] = updatedPhotos.splice(fromIdx, 1)
      updatedPhotos.splice(toIdx, 0, movedItem)

      const finalPhotos = updatedPhotos.map((p, i) => ({ ...p, display_order: i }))
      setPhotos(finalPhotos)
      setDraggingId(null)
      setDragOverPhotoId(null)

      await apiFetch(`/api/website/stories/${id}/photos/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: finalPhotos.map(p => ({ id: p.id, display_order: p.display_order }))
        })
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPhotoIds.length === 0) return
    if (!confirm(`Are you sure you want to delete the ${selectedPhotoIds.length} selected photos?`)) return

    setSaving(true)
    try {
      await Promise.all(
        selectedPhotoIds.map(photoId => 
          apiFetch(`/api/website/story-photos/${photoId}`, { method: 'DELETE' })
        )
      )
      setPhotos(prev => prev.filter(p => !selectedPhotoIds.includes(p.id)))
      setSelectedPhotoIds([])
    } catch (err) {
      console.error('Failed to execute bulk deletion:', err)
      alert('Failed to delete some photos. Please reload and try again.')
    } finally {
      setSaving(false)
    }
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
    JSON.stringify(tabs) !== JSON.stringify(initialStory.tabs || []) ||
    JSON.stringify(linkedFilms.sort()) !== JSON.stringify((initialStory.films || []).map((f: any) => f.id).sort()) ||
    JSON.stringify(linkedReels.sort()) !== JSON.stringify((initialStory.reels || []).map((r: any) => r.id).sort())
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

      {/* Cinematic Video Connections Section */}
      <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: '#1c1a18', marginBottom: '0.25rem' }}>Cinema Tab Settings</h2>
        <p style={{ fontSize: '0.75rem', color: '#8c867e', marginBottom: '1.5rem' }}>Link published widescreen films and vertical reels from your library to display them in this story's dedicated "Cinema" tab.</p>
        
        <div>
          {/* Widescreen Films */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4540', borderBottom: '1px solid #ece9e4', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Widescreen Feature Films (Max 2 recommended)
            </h3>
            {allFilms.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {allFilms.filter(f => f.category?.toLowerCase() !== 'reel').map(film => {
                  const isLinked = linkedFilms.includes(film.id)
                  return (
                    <div 
                      key={film.id}
                      onClick={() => {
                        setLinkedFilms(prev => 
                          isLinked ? prev.filter(id => id !== film.id) : [...prev, film.id]
                        )
                      }}
                      style={{
                        padding: '0.875rem 1.25rem',
                        background: isLinked ? '#f7f6f4' : '#fff',
                        border: isLinked ? '1px solid #9a7d52' : '1px solid #e5e1da',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1c1a18', margin: '0 0 0.15rem 0' }}>{film.title}</p>
                        <p style={{ fontSize: '0.7rem', color: '#8c867e', margin: 0 }}>{film.location || 'No Location'} • {film.year || 'No Year'}</p>
                      </div>
                      <div style={{
                        width: '18px', height: '18px', border: '1px solid #c0b9af', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isLinked ? '#9a7d52' : '#fff', borderColor: isLinked ? '#9a7d52' : '#c0b9af',
                      }}>
                        {isLinked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: '#b0a99e', fontStyle: 'italic' }}>No widescreen films found. Upload them under "Films" first.</p>
            )}
          </div>

          {/* Vertical Reels */}
          <div>
            <h3 style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4540', borderBottom: '1px solid #ece9e4', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Vertical Reels & Stories (Max 4 recommended)
            </h3>
            {allReels.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {allReels.map(reel => {
                  const isLinked = linkedReels.includes(reel.id)
                  return (
                    <div 
                      key={reel.id}
                      onClick={() => {
                        setLinkedReels(prev => 
                          isLinked ? prev.filter(id => id !== reel.id) : [...prev, reel.id]
                        )
                      }}
                      style={{
                        padding: '0.875rem 1.25rem',
                        background: isLinked ? '#f7f6f4' : '#fff',
                        border: isLinked ? '1px solid #9a7d52' : '1px solid #e5e1da',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Portrait thumbnail mini-preview */}
                        <div style={{ width: '20px', aspectRatio: '9/16', background: '#eee', border: '1px solid #ddd', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
                          {reel.thumbnail_url && <img src={reel.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1c1a18', margin: '0 0 0.15rem 0' }}>{reel.title}</p>
                          <p style={{ fontSize: '0.7rem', color: '#9a7d52', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, margin: 0 }}>Vertical Reel</p>
                        </div>
                      </div>
                      <div style={{
                        width: '18px', height: '18px', border: '1px solid #c0b9af', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isLinked ? '#9a7d52' : '#fff', borderColor: isLinked ? '#9a7d52' : '#c0b9af',
                      }}>
                        {isLinked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: '#b0a99e', fontStyle: 'italic' }}>No vertical reels found. Upload them under the new "Reels" section first.</p>
            )}
          </div>
        </div>
      </div>

      {/* Photo lists per sub-gallery tab */}
      {['All', ...tabs].map(tab => {
        const isAll = tab === 'All';
        const tabPhotos = isAll 
          ? photos.filter(p => !p.tab_name || p.tab_name === 'All') 
          : photos.filter(p => p.tab_name === tab);
        const isDragOver = activeDragOverTab === tab;
        
        return (
          <div 
            key={tab} 
            className="admin-card" 
            style={{ 
              marginBottom: '2rem', 
              overflow: 'hidden',
              border: isDragOver ? '2px dashed #9a7d52' : '1px solid #e5e1da',
              background: isDragOver ? '#fcfaf7' : '#fff',
              transition: 'all 0.2s ease',
            }}
            onDragOver={e => {
              e.preventDefault();
              setActiveDragOverTab(tab);
            }}
            onDragLeave={() => {
              setActiveDragOverTab(null);
            }}
            onDrop={async e => {
              e.preventDefault();
              setActiveDragOverTab(null);
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (files.length) {
                await uploadPhotos(files, isAll ? null : tab);
              }
            }}
          >
            
            {/* Header controls for tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: '#1c1a18', marginBottom: '0.2rem' }}>
                  {isAll ? 'Gallery Photos (Default Grid)' : `${tab} Tab Photos`}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#8c867e' }}>{tabPhotos.length} photos assigned • Drag & drop images here to upload • Use ← and → to reorder.</p>
                
                {tabPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setSelectedPhotoIds(tabPhotos.map(p => p.id))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9a7d52',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textDecoration: 'underline',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#7d643f'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9a7d52'}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#e5e1da', fontSize: '0.6875rem' }}>•</span>
                    <button
                      onClick={() => setSelectedPhotoIds([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8c867e',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textDecoration: 'underline',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#1c1a18'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8c867e'}
                    >
                      Deselect All
                    </button>
                  </div>
                )}
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

            {/* Bulk Actions Bar */}
            {selectedPhotoIds.length > 0 && tabPhotos.some(p => selectedPhotoIds.includes(p.id)) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(28, 26, 24, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  marginBottom: '1.25rem',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: '#a39274' }}>
                    {selectedPhotoIds.length} {selectedPhotoIds.length === 1 ? 'photo' : 'photos'} selected
                  </span>
                  <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: '#ccc', fontSize: '0.75rem' }}>
                    {areSelectedAdjacent(tabPhotos) 
                      ? '✓ Contiguous adjacent block (You can drag-reorder them together)' 
                      : '⚠ Non-adjacent block (Group drag-reorder disabled; select adjacent photos to drag together)'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleBulkDelete}
                    className="admin-btn"
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '0.4rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedPhotoIds([])}
                    className="admin-btn"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '0.4rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Visual Marquee Box */}
            {marquee && marquee.tabName === tab && (
              <div 
                style={{
                  position: 'fixed',
                  left: Math.min(marquee.startX, marquee.currentX),
                  top: Math.min(marquee.startY, marquee.currentY),
                  width: Math.abs(marquee.startX - marquee.currentX),
                  height: Math.abs(marquee.startY - marquee.currentY),
                  background: 'rgba(154, 125, 82, 0.15)',
                  border: '1px solid #9a7d52',
                  borderRadius: '2px',
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Premium Reordering photo grids */}
            {tabPhotos.length > 0 ? (
              <div 
                id={`grid-container-${tab}`}
                onMouseDown={e => startMarquee(e, tab)}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                  gap: '1rem',
                  position: 'relative',
                  userSelect: marquee ? 'none' : 'auto'
                }}
              >
                {tabPhotos.map((photo, subIdx) => {
                  const isSelected = selectedPhotoIds.includes(photo.id)
                  const isDragging = draggingId === photo.id
                  const isDraggingSelectedGroup = draggingId !== null && selectedPhotoIds.includes(draggingId)
                  const isAttachedSelected = isDraggingSelectedGroup && isSelected && !isDragging
                  const showDragIndicator = dragOverPhotoId === photo.id && draggingId !== null && !selectedPhotoIds.includes(photo.id)
                  return (
                    <motion.div 
                      layout
                      key={photo.id}
                      className="admin-photo-card"
                      data-id={photo.id}
                      draggable
                      onDragStart={(e: any) => {
                        setDraggingId(photo.id)
                        if (selectedPhotoIds.includes(photo.id) && selectedPhotoIds.length > 1) {
                          const dragImage = document.createElement('div')
                          dragImage.style.background = '#9a7d52'
                          dragImage.style.color = '#fff'
                          dragImage.style.padding = '6px 14px'
                          dragImage.style.borderRadius = '20px'
                          dragImage.style.fontFamily = 'var(--font-sans), sans-serif'
                          dragImage.style.fontSize = '0.75rem'
                          dragImage.style.fontWeight = '600'
                          dragImage.style.position = 'absolute'
                          dragImage.style.top = '-1000px'
                          dragImage.style.zIndex = '99999'
                          dragImage.style.boxShadow = '0 4px 12px rgba(154, 125, 82, 0.3)'
                          dragImage.innerText = `📦 Moving ${selectedPhotoIds.length} photos`
                          document.body.appendChild(dragImage)
                          e.dataTransfer.setDragImage(dragImage, 10, 10)
                          setTimeout(() => {
                            if (document.body.contains(dragImage)) {
                              document.body.removeChild(dragImage)
                            }
                          }, 0)
                        }
                      }}
                      onDragOver={e => e.preventDefault()}
                      onDragEnter={() => {
                        if (draggingId !== null && draggingId !== photo.id) {
                          setDragOverPhotoId(photo.id)
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverPhotoId === photo.id) {
                          setDragOverPhotoId(null)
                        }
                      }}
                      onDrop={() => handlePhotoDrop(photo.id, tabPhotos)}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDragOverPhotoId(null)
                      }}
                      onClick={() => {
                        if (selectedPhotoIds.length > 0) {
                          handlePhotoSelect(photo)
                        }
                      }}
                      style={{
                        position: 'relative', 
                        aspectRatio: '1', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        border: isSelected ? '2.5px solid #9a7d52' : '1px solid #ece9e4',
                        background: '#fcfbf9',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.3 : (isAttachedSelected ? 0.45 : 1),
                        transition: 'border-color 0.2s, opacity 0.2s',
                      }}
                      animate={{
                        scale: isDragging ? 0.98 : (isAttachedSelected ? 0.96 : 1),
                      }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    >
                      <img src={photo.file_url_thumb || photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      
                      {showDragIndicator && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          bottom: '-4px',
                          left: '-0.5rem',
                          width: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          zIndex: 20,
                          pointerEvents: 'none',
                          transform: 'translateX(-50%)',
                        }}>
                          <div style={{
                            flex: 1,
                            width: '0px',
                            borderLeft: '3px dotted #9a7d52',
                            filter: 'drop-shadow(0 0 4px rgba(154, 125, 82, 0.6))',
                          }} />
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9a7d52', position: 'absolute', top: '-2px' }} />
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9a7d52', position: 'absolute', bottom: '-2px' }} />
                        </div>
                      )}

                      {photo.is_cover && (
                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#9a7d52', borderRadius: '4px', padding: '2px 6px', fontSize: '0.5625rem', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, zIndex: 11 }}>
                          Cover
                        </div>
                      )}

                      {/* Selection Checkbox Bubble */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhotoSelect(photo);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected 
                            ? '1px solid #9a7d52' 
                            : '1px solid rgba(28, 26, 24, 0.25)',
                          background: isSelected 
                            ? '#9a7d52' 
                            : 'rgba(255, 255, 255, 0.85)',
                          backdropFilter: 'blur(4px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 12,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1.5 4 4 6.5 8.5 1.5" />
                          </svg>
                        )}
                      </div>
                      
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
                      }}
                        onClick={e => e.stopPropagation()}
                      >
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
                No photos uploaded yet in this section. Click '+ Upload to {tab}' above or drop files here to begin.
              </div>
            )}

          </div>
        );
      })}
    </div>
  )
}
