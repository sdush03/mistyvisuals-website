'use client'

import { useState, useEffect } from 'react'
import type { Testimonial } from '@/lib/types'

interface Props {
  testimonials: Testimonial[]
  heading?: string
}

export default function TestimonialsSection({ testimonials, heading }: Props) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % testimonials.length)
        setVisible(true)
      }, 500)
    }, 8000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  if (!testimonials.length) return null
  const t = testimonials[idx]

  return (
    <section style={{
      background: 'var(--linen-dark)',
      padding: 'clamp(4rem,8vh,7rem) var(--page-x)',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>

        {heading && (
          <p className="t-caption" style={{ marginBottom: '3rem' }}>{heading}</p>
        )}

        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(6px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          {/* Large open-quote */}
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '5rem',
            lineHeight: 0.5,
            color: 'var(--border)',
            marginBottom: '1.5rem',
            userSelect: 'none',
          }}>
            &ldquo;
          </div>

          <blockquote style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: 'var(--ink)',
            margin: '0 0 2rem',
          }}>
            {t.quote}
          </blockquote>

          <cite style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.5875rem',
            fontStyle: 'normal',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-light)',
          }}>
            — {t.client_name}
            {(t.location || t.year) && (
              <span style={{ color: 'var(--border)', marginLeft: '0.5rem' }}>
                // {[t.location, t.year].filter(Boolean).join(', ')}
              </span>
            )}
          </cite>
        </div>

        {/* Dot nav */}
        {testimonials.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true) }, 300) }}
                style={{
                  width: i === idx ? '1.5rem' : '0.3rem',
                  height: '0.3rem',
                  borderRadius: '3px',
                  background: i === idx ? 'var(--ink)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s ease',
                }}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
