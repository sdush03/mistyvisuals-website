import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

let fontData: Buffer | null = null
try {
  fontData = readFileSync(join(process.cwd(), 'public/fonts/jost.ttf'))
} catch (e) {
  console.error('OG font load error:', e)
}

export async function GET() {
  const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001'
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mistyvisuals.com'
  let bgUrl = ''

  try {
    const res = await fetch(`${INTERNAL_API}/api/website/home`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const hero = data?.hero
      if (hero) {
        const mediaUrl = hero.media_type === 'image' ? hero.media_url : hero.poster_url
        if (mediaUrl) {
          bgUrl = mediaUrl.startsWith('http') ? mediaUrl : `${SITE}${mediaUrl}`
        }
      }
    }
  } catch (e) {
    console.error('OG films data fetch error:', e)
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
        {bgUrl && (
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
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%)',
          }}
        />
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
              fontFamily: fontData ? 'Jost' : 'sans-serif',
              fontSize: '32px',
              fontWeight: 400,
              letterSpacing: '0.25em',
              color: '#ffffff',
              textTransform: 'uppercase' as const,
              marginBottom: '12px',
            }}
          >
            MISTY VISUALS
          </span>
          <span
            style={{
              fontFamily: fontData ? 'Jost' : 'sans-serif',
              fontSize: '80px',
              fontWeight: 400,
              letterSpacing: '0.18em',
              color: '#ffffff',
              textTransform: 'uppercase' as const,
            }}
          >
            FILMS
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fontData
        ? {
            fonts: [
              {
                name: 'Jost',
                data: fontData,
                style: 'normal' as const,
                weight: 400 as const,
              },
            ],
          }
        : {}),
    }
  )
}
