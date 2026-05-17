import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { resolveImageToDataUri } from '../resolveImage'

export const dynamic = 'force-dynamic'

let fontData: Buffer | null = null
try {
  fontData = readFileSync(join(process.cwd(), 'public/fonts/jost.ttf'))
} catch (e) {
  console.error('OG font load error:', e)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bgDataUri = await resolveImageToDataUri(searchParams.get('img'))

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
        {bgDataUri && (
          <img src={bgDataUri} alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <span style={{ fontFamily: fontData ? 'Jost' : 'sans-serif', fontSize: '32px', fontWeight: 400, letterSpacing: '0.25em', color: '#ffffff', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
            MISTY VISUALS
          </span>
          <span style={{ fontFamily: fontData ? 'Jost' : 'sans-serif', fontSize: '80px', fontWeight: 400, letterSpacing: '0.18em', color: '#ffffff', textTransform: 'uppercase' as const }}>
            FILMS
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fontData
        ? { fonts: [{ name: 'Jost', data: fontData, style: 'normal' as const, weight: 400 as const }] }
        : {}),
    }
  )
}
