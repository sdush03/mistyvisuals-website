'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, { credentials: 'include', ...init })

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ quote: '', client_name: '', location: '', year: '' })
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch('/api/website/admin/testimonials').then(r => r.json()).then(setItems)
  }, [])

  const save = async () => {
    setSaving(true)
    const body = { ...form, year: form.year ? parseInt(form.year) : null }
    if (editing !== null) {
      const r = await apiFetch(`/api/website/testimonials/${editing}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const updated = await r.json()
      setItems(prev => prev.map(t => t.id === editing ? updated : t))
      setEditing(null)
    } else {
      const r = await apiFetch('/api/website/testimonials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const created = await r.json()
      setItems(prev => [...prev, created])
    }
    setForm({ quote: '', client_name: '', location: '', year: '' })
    setSaving(false)
  }

  const deleteItem = async (id: number) => {
    await apiFetch(`/api/website/testimonials/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(t => t.id !== id))
  }

  const startEdit = (t: any) => {
    setEditing(t.id)
    setForm({ quote: t.quote, client_name: t.client_name, location: t.location || '', year: t.year?.toString() || '' })
  }

  const input = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem' }
  const label = { fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', display: 'block', marginBottom: '0.3rem' }

  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '2rem' }}>Testimonials</h1>

      {/* Form */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem', color: '#555' }}>
          {editing !== null ? 'Edit Testimonial' : 'Add New Testimonial'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={label}>Quote *</label>
            <textarea rows={4} style={{ ...input, resize: 'vertical', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}
              value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
              placeholder="What the couple said…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={label}>Client Name *</label>
              <input style={input} value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Priya & Arjun" />
            </div>
            <div>
              <label style={label}>Location</label>
              <input style={input} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Udaipur" />
            </div>
            <div>
              <label style={label}>Year</label>
              <input style={input} type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={save} disabled={saving || !form.quote || !form.client_name} style={{
              background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0.625rem 1.5rem', fontSize: '0.875rem', cursor: 'pointer',
            }}>
              {saving ? 'Saving…' : editing !== null ? 'Update' : 'Add'}
            </button>
            {editing !== null && (
              <button onClick={() => { setEditing(null); setForm({ quote: '', client_name: '', location: '', year: '' }) }} style={{
                background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px',
                padding: '0.625rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer', color: '#555',
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map(t => (
          <div key={t.id} style={{
            background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '1rem 1.25rem',
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.9375rem', color: '#333', marginBottom: '0.4rem', lineHeight: 1.5 }}>
                &ldquo;{t.quote.length > 120 ? t.quote.slice(0, 120) + '…' : t.quote}&rdquo;
              </p>
              <p style={{ fontSize: '0.75rem', color: '#aaa' }}>
                — {t.client_name}{t.location ? `, ${t.location}` : ''}{t.year ? ` · ${t.year}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={() => startEdit(t)} style={{ fontSize: '0.75rem', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '0.3rem 0.6rem', background: 'none', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteItem(t.id)} style={{ fontSize: '0.75rem', color: '#e53e3e', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.3rem 0.6rem', background: 'none', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
