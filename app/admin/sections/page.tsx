'use client'

import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

const SECTION_ICONS: Record<string, string> = {
  hero: '🌅', stories: '📷', philosophy: '💭',
  films: '🎬', experience: '✨', testimonials: '💬', inquiry: '✉️',
}

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/website/sections').then(r => r.json()).then(rows =>
      setSections([...rows].sort((a, b) => a.display_order - b.display_order))
    )
  }, [])

  const toggle = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, is_visible: !s.is_visible } : s))
  }

  const onDrop = useCallback((targetKey: string) => {
    if (!draggingKey || draggingKey === targetKey) return
    const reordered = [...sections]
    const fromIdx = reordered.findIndex(s => s.key === draggingKey)
    const toIdx   = reordered.findIndex(s => s.key === targetKey)
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setSections(reordered.map((s, i) => ({ ...s, display_order: i + 1 })))
    setDraggingKey(null)
  }, [draggingKey, sections])

  const save = async () => {
    setSaving(true)
    await apiFetch('/api/website/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: sections.map(s => ({ key: s.key, is_visible: s.is_visible, display_order: s.display_order })) }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400 }}>Homepage Sections</h1>
          <p style={{ fontSize: '0.875rem', color: '#888' }}>Drag to reorder. Toggle to show/hide.</p>
        </div>
        <button onClick={save} disabled={saving} style={{
          background: saved ? '#22c55e' : '#1a1512', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Order'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {sections.map(s => (
          <div
            key={s.key}
            draggable
            onDragStart={() => setDraggingKey(s.key)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(s.key)}
            style={{
              background: '#fff', border: `1px solid ${draggingKey === s.key ? '#1a1512' : '#eee'}`,
              borderRadius: '10px', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
              cursor: 'grab', opacity: s.is_visible ? 1 : 0.5,
              transition: 'all 0.2s',
            }}
          >
            {/* Drag handle */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="1.5">
              <line x1="2" y1="4" x2="12" y2="4"/><line x1="2" y1="7" x2="12" y2="7"/><line x1="2" y1="10" x2="12" y2="10"/>
            </svg>

            <span style={{ fontSize: '1.25rem' }}>{SECTION_ICONS[s.key] || '📄'}</span>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1a1512' }}>{s.label}</p>
              <p style={{ fontSize: '0.6875rem', color: '#bbb', letterSpacing: '0.06em' }}>{s.key}</p>
            </div>

            {/* Visibility toggle */}
            <button onClick={() => toggle(s.key)} style={{
              background: s.is_visible ? '#1a1512' : '#f0f0f0',
              border: 'none', borderRadius: '20px',
              width: '3rem', height: '1.5rem',
              cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: '50%', transform: `translateY(-50%) translateX(${s.is_visible ? '1.5rem' : '0.15rem'})`,
                width: '1.2rem', height: '1.2rem', borderRadius: '50%', background: '#fff',
                transition: 'transform 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
