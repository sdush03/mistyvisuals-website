'use client'

import Link from 'next/link'
import type { Testimonial } from '@/lib/types'

interface Props {
  testimonials: Testimonial[]
  heading?: string
}

export default function TestimonialsSection({ testimonials, heading = 'TESTIMONIALS' }: Props) {
  if (!testimonials.length) return null

  // Show only the first 3 on the homepage
  const displayTestimonials = testimonials.slice(0, 3)

  return (
    <section id="testimonials" style={{
      background: 'var(--linen)', // White outer background
      padding: 'clamp(3rem, 6vh, 5rem) var(--page-x)',
    }}>
      <div style={{
        background: '#f7f7f3', // Custom beige background
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(4rem, 8vh, 6rem) clamp(2rem, 5vw, 6rem)',
      }}>
        
        {/* Header Row: Title on Left, CTA on Right */}
        {/* Header Row: Title on Left, CTA on Right */}
        <div className="testi-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'clamp(3rem, 6vh, 5rem)' 
        }}>
          <p style={{ 
            fontFamily: 'var(--font-sans)',
            fontSize: '1.125rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            fontWeight: 350,
            fontVariationSettings: "'wght' 350"
          }}>
            {heading}
          </p>
          
          <Link href="/testimonials" className="testi-cta testi-cta-desktop" style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6875rem',
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#ffffff',
            background: '#222',
            padding: '1.25rem 2rem',
            textDecoration: 'none',
            transition: 'background 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            SEE MORE <span style={{ fontSize: '0.875rem', lineHeight: 1 }}>&rarr;</span>
          </Link>
        </div>

        {/* 3-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(3rem, 6vw, 6rem)',
        }}>
          {displayTestimonials.map((t) => (
            <div key={t.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Quote - Fixed height with truncation */}
              <blockquote className="mv-body testi-quote" style={{
                fontFamily: 'var(--font-lora)',
                fontSize: '16px',
                letterSpacing: '0em',
                lineHeight: '1.8em',
                color: '#656565',
                margin: '0 0 1.5rem',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 8,
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis',
                textAlign: 'justify',
              }}>
                {t.quote.length > 320 ? `"${t.quote.substring(0, 320).trim()}..."` : `"${t.quote}"`}
              </blockquote>

              {/* Client Name */}
              <cite style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem', // Slightly larger names
                fontWeight: 300,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}>
                {t.client_name}
              </cite>
            </div>
          ))}
        </div>
        
        {/* Mobile CTA (hidden on desktop) */}
        <div className="testi-cta-mobile-wrapper" style={{ display: 'none', marginTop: '3rem', textAlign: 'right' }}>
          <Link href="/testimonials" className="testi-cta" style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6875rem',
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#ffffff',
            background: '#222',
            padding: '1.25rem 2rem',
            textDecoration: 'none',
            transition: 'background 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            SEE MORE <span style={{ fontSize: '0.875rem', lineHeight: 1 }}>&rarr;</span>
          </Link>
        </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .testi-header { flex-direction: column; align-items: flex-start !important; gap: 1.5rem; margin-bottom: 2rem !important; }
          .testi-cta { padding: 1rem 1.5rem !important; font-size: 0.6rem !important; }
          .testi-quote { text-align: justify !important; text-align-last: left !important; }
          .testi-cta-desktop { display: none !important; }
          .testi-cta-mobile-wrapper { display: block !important; }
        }
        .testi-cta:hover { background: #000 !important; }
      `}</style>
    </section>
  )
}
