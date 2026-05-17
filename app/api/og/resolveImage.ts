import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001'

// Load Jost font once at module scope
let fontData: ArrayBuffer | null = null
try {
  const buf = readFileSync(join(process.cwd(), 'public/fonts/jost.ttf'))
  fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
} catch (e) {
  console.error('OG: Could not load jost.ttf', e)
}

async function fetchImage(imgPath: string | null): Promise<Buffer | null> {
  if (!imgPath) return null
  try {
    const url = imgPath.startsWith('http') ? imgPath : `${INTERNAL_API}${imgPath}`
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

/**
 * Use Satori to render text with the Jost font as a transparent PNG overlay.
 * Satori handles custom fonts natively — no system font install needed.
 */
async function renderTextOverlay(
  width: number,
  height: number,
  lines: { text: string; fontSize: number }[]
): Promise<Buffer> {
  // Dynamic import to avoid bundling issues
  const satori = (await import('satori')).default
  const { Resvg } = await import('@resvg/resvg-js')

  const jsx = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        // Gradient overlay baked into this layer
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.50) 100%)',
      },
      children: lines.map((line) => ({
        type: 'span',
        props: {
          style: {
            fontFamily: 'Jost',
            fontSize: `${line.fontSize}px`,
            fontWeight: 400,
            letterSpacing: line.fontSize > 50 ? '0.18em' : '0.25em',
            color: '#ffffff',
            textTransform: 'uppercase',
            marginBottom: lines.length > 1 ? '8px' : '0',
          },
          children: line.text,
        },
      })),
    },
  }

  const svg = await satori(jsx as any, {
    width,
    height,
    fonts: fontData
      ? [{ name: 'Jost', data: fontData, weight: 400 as const, style: 'normal' as const }]
      : [],
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  return Buffer.from(resvg.render().asPng())
}

export async function generateOgImage(
  imgPath: string | null,
  lines: { text: string; fontSize: number }[]
): Promise<Buffer> {
  const width = 1200
  const height = 630

  // Background: photo or solid dark color
  const imgBuffer = await fetchImage(imgPath)

  let base: sharp.Sharp
  if (imgBuffer) {
    base = sharp(imgBuffer).resize(width, height, { fit: 'cover' })
  } else {
    base = sharp({
      create: { width, height, channels: 3, background: { r: 26, g: 21, b: 18 } },
    })
  }

  // Render text + gradient overlay using Satori (supports custom fonts)
  const textOverlay = await renderTextOverlay(width, height, lines)

  // Composite and output compressed JPEG
  const result = await base
    .composite([{ input: textOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 75 })
    .toBuffer()

  return result
}
