import { ImageResponse } from 'next/og'
import { fetchHomeData } from '@/lib/api'


export const alt = 'Misty Visuals — Luxury Wedding Photography & Films'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  let bgUrl = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80'

  try {
    const homeData = await fetchHomeData()
    const hero = homeData?.hero
    if (hero) {
      const mediaUrl = hero.media_type === 'image' ? hero.media_url : hero.poster_url
      if (mediaUrl) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
        bgUrl = mediaUrl.startsWith('http') ? mediaUrl : `${API_BASE}${mediaUrl}`
      }
    }
  } catch (e) {
    console.error('OG Image fetch error:', e)
  }

  // Fetch Jost Font securely via HTTP
  let fontData: any = null
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mistyvisuals.com'
    fontData = await fetch(new URL('/fonts/jost.ttf', siteUrl)).then(res => res.arrayBuffer())
  } catch (e) {
    console.error('Font load error:', e)
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1512',
        }}
      >
        {/* Background Image */}
        <img
          src={bgUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Dark Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)',
          }}
        />
        {/* Brand Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'Jost',
              fontSize: '76px',
              fontWeight: 400,
              letterSpacing: '0.22em',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            MISTY VISUALS
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData ? {
        fonts: [
          {
            name: 'Jost',
            data: fontData,
            style: 'normal',
            weight: 400,
          },
        ]
      } : {}),
    }
  )
}
