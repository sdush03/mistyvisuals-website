'use client'

import { useEffect, useState } from 'react'

export default function InstagramFeed() {
  const [posts, setPosts] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1024)
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetch('/api/instagram')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return
        setPosts(data)
      })
      .catch(err => console.error('Error fetching Instagram feed:', err))
  }, [])

  const displayPosts = isMobile ? posts : posts.slice(0, 6)

  return (
    <section style={{
      background: 'var(--linen)',
      padding: 'clamp(4rem, 8vh, 6rem) var(--page-x)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vh, 3.5rem)' }}>
        <h2 className="mv-heading" style={{
          fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)',
          letterSpacing: '0.1em',
          color: '#000000',
          marginBottom: '0',
        }}>
          <a 
            href="https://www.instagram.com/weddingsbymistyvisuals" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover-opacity"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            FOLLOW US ON INSTAGRAM
          </a>
        </h2>
      </div>

      {/* Grid: 6 columns on desktop, 3 on mobile */}
      <div className="ig-grid">
        {displayPosts.map(post => (
          <a 
            key={post.id} 
            href={post.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover-dim"
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: '3/4', // New 2026 Instagram portrait ratio
              overflow: 'hidden',
              background: 'var(--linen-dark)',
            }}
          >
            <img 
              src={post.image} 
              alt="Instagram Post" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }} 
            />
          </a>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 'clamp(2rem, 4vh, 3.5rem)' }}>
        <a 
          href="https://www.instagram.com/weddingsbymistyvisuals" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover-opacity"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6875rem',
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#000000',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          @weddingsbymistyvisuals
        </a>
      </div>

      <style>{`
        .hover-opacity { transition: opacity 0.3s ease; }
        .hover-opacity:hover { opacity: 0.6; }
        .ig-grid { 
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: clamp(0.5rem, 1vw, 1rem);
        }
        @media (max-width: 1024px) {
          .ig-grid { 
            grid-template-columns: repeat(3, 1fr); 
            gap: 0.5rem; 
          }
        }
      `}</style>
    </section>
  )
}
