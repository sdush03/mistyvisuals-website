'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminHomepage() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/website/sections').then(r => r.json()).then(setSections).finally(() => setLoading(false))
  }, [])

  const saveOrder = async (updatedSections: any[]) => {
    await apiFetch('/api/website/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: updatedSections.map(s => ({ key: s.key, display_order: s.display_order, is_visible: s.is_visible })) })
    })
  }

  const toggleVisibility = (key: string, is_visible: boolean) => {
    const updated = sections.map(s => s.key === key ? { ...s, is_visible } : s)
    setSections(updated)
    saveOrder(updated)
  }

  const onDragStart = (key: string) => setDraggingKey(key)

  const onDrop = (dropKey: string) => {
    if (!draggingKey || draggingKey === dropKey) return setDraggingKey(null)
    
    const dragIdx = sections.findIndex(s => s.key === draggingKey)
    const dropIdx = sections.findIndex(s => s.key === dropKey)
    if (dragIdx === -1 || dropIdx === -1) return setDraggingKey(null)

    const updated = [...sections]
    const [dragged] = updated.splice(dragIdx, 1)
    updated.splice(dropIdx, 0, dragged)

    // Update display_order
    updated.forEach((s, i) => s.display_order = i)

    setSections(updated)
    setDraggingKey(null)
    saveOrder(updated)
  }

  if (loading) return <p style={{ color: '#888', padding: '2rem' }}>Loading sections…</p>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Manage</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 300, fontStyle: 'italic', color: '#1a1512' }}>Homepage</h1>
      </div>

      {/* Single Pane for Drag and Drop */}
      <div style={{ maxWidth: '600px' }}>
        <p style={{ fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '1rem', fontWeight: 500 }}>
          Sections — Drag to Reorder
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sections.map(section => (
            <div 
              key={section.key}
              draggable
              onDragStart={() => onDragStart(section.key)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(section.key)}
              style={{
                padding: '1.25rem 1rem',
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: draggingKey === section.key ? 0.4 : (section.is_visible ? 1 : 0.6),
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Drag Handle */}
                <div style={{ color: '#ccc', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 400, color: '#1a1512', marginBottom: '0.2rem' }}>
                    {section.label}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {section.is_visible ? 'Visible' : 'Hidden'}
                  </p>
                </div>
              </div>

              {/* Visibility Eye Icon */}
              <button 
                onClick={(e) => toggleVisibility(section.key, !section.is_visible)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: section.is_visible ? '#1a1512' : '#ccc', padding: '0.5rem' }}
              >
                {section.is_visible ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
