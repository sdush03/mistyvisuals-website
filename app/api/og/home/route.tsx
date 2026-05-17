import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Load font once at module scope (cold start)
let fontData: Buffer | null = null
try {
  fontData = readFileSync(join(process.cwd(), 'public/fonts/jost.ttf'))
} catch (e) {
  console.error('OG font load error:', e)
}

/**
 * Resolve an image path to a data URI to avoid self-referencing deadlocks.
 * Relative paths (e.g. /media/...) are fetched from the internal backend API.
 * Absolute URLs to external hosts are fetched directly.
 */
async function resolveImageToDataUri(imgPath: string | null): Promise<string> {
  if (!imgPath) return ''

  const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001'

  try {
    // For relative paths, fetch from internal backend (avoids Next.js self-request deadlock)
    const fetchUrl = imgPath.startsWith('http') ? imgPath : `${INTERNAL_API}${imgPath}`
    const res = await fetch(fetchUrl)
    if (!res.ok) return ''

    const buffer = Buffer.from(await res.arrayBuffer())
    // Detect content type, default to jpeg for broad compatibility
    const ct = res.headers.get('content-type') || 'image/jpeg'
    return `data:${ct};base64,${buffer.toString('base64')}`
  } catch (e) {
    console.error('OG resolveImage error:', e)
    return ''
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imgParam = searchParams.get('img')

  const bgDataUri = await resolveImageToDataUri(imgParam)

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
          <img
            src={bgDataUri}
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
        {/* Dark overlay */}
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
        {/* Brand text */}
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
              fontSize: '76px',
              fontWeight: 400,
              letterSpacing: '0.22em',
              color: '#ffffff',
              textTransform: 'uppercase' as const,
            }}
          >
            MISTY VISUALS
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
