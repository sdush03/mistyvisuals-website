'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Story } from '@/lib/types'

interface Props {
  stories: Story[]
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function StoriesGrid({ stories }: Props) {
  const [activeFilter, setActiveFilter] = useState('All')

  // Generate filters dynamically based on explicit categories assigned to stories
  const categoriesSet = new Set<string>()
  stories.forEach(story => {
    const dbCats = (story.category || '').split(',').map(c => c.trim()).filter(Boolean)
    dbCats.forEach(c => categoriesSet.add(c))
  })
  const dynamicFilters = ['All', ...Array.from(categoriesSet).sort()]

  // Simple filter logic: if 'All', show all. Else try to match category or title/location text roughly.
  const filteredStories = stories.filter(story => {
    if (activeFilter === 'All') return true
    
    // Exact DB category match handling comma-separated values (e.g. "Destination, Intimate")
    const dbCategories = (story.category || '').split(',').map(c => c.trim().toLowerCase())
    if (dbCategories.includes(activeFilter.toLowerCase())) return true

    // Fallback: Check if the text matches anywhere (title, subtitle, location)
    const searchString = `${story.title} ${story.subtitle || ''} ${story.location || ''}`.toLowerCase()
    
    if (activeFilter === 'Pre-Wedding' && searchString.includes('pre-wedding')) return true
    if (activeFilter === 'Destination' && searchString.includes('destination')) return true
    if (activeFilter === 'Intimate' && searchString.includes('intimate')) return true
    if (activeFilter === 'Night' && searchString.includes('night')) return true
    
    return false
  })

  // Fallback: If strict filtering returns empty, show all stories to prevent an empty grid,
  // or show a subtle message.
  const displayStories = filteredStories.length > 0 ? filteredStories : []

  return (
    <div style={{ padding: 'clamp(2.5rem,5vh,4rem) var(--page-x) clamp(4rem,8vh,7rem)' }}>
      
      {/* ── Filters ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        gap: 'clamp(1rem, 3vw, 2.5rem)',
        flexWrap: 'wrap',
        marginBottom: 'clamp(3rem, 5vh, 4rem)',
      }}>
        {dynamicFilters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.6875rem',
              fontWeight: 400,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: activeFilter === f ? '#000' : '#888',
              paddingBottom: '0.25rem',
              borderBottom: activeFilter === f ? '1px solid #000' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {displayStories.length > 0 ? (
        <div
          className="all-stories-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(1rem, 2vw, 2rem) clamp(1rem, 2vw, 2rem)',
          }}
        >
          {displayStories.map((story, i) => (
            <Link key={story.id} href={`/stories/${story.slug}`} style={{ display: 'block' }}>
              <article className="hover-scale">
                {/* Cover — 3:2 landscape, NO overlay */}
                <div style={{
                  aspectRatio: '3/2',
                  overflow: 'hidden',
                  background: 'var(--linen-dark)',
                  marginBottom: '0.75rem',
                }}>
                  {story.grid_image_url || story.cover_image_url ? (
                    <img
                      src={story.grid_image_url || story.cover_image_url || ''}
                      alt={story.title}
                      loading={i < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--linen-dark)' }} />
                  )}
                </div>

                {/* Caption below — Centered, Pixieset style */}
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink)',
                    marginBottom: story.location ? '0.35rem' : '0',
                  }}>
                    {story.title}
                  </h3>
                  {story.location && (
                    <p style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-mid)',
                    }}>
                      {story.location}
                    </p>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--ink-light)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            No stories found in this category.
          </p>
          <button 
            onClick={() => setActiveFilter('All')}
            style={{ 
              marginTop: '1rem', background: 'none', border: '1px solid var(--border)', 
              padding: '0.5rem 1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.625rem', 
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              color: 'var(--ink)'
            }}
          >
            View All
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .all-stories-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .all-stories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
