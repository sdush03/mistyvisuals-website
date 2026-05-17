import sharp from 'sharp'
import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'

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
 * Use next/og ImageResponse to render text with Jost font as a transparent PNG.
 * ImageResponse bundles satori+resvg internally and works with Turbopack.
 */
async function renderTextOverlay(
  width: number,
  height: number,
  lines: { text: string; fontSize: number }[]
): Promise<Buffer> {
  const element = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.50) 100%)',
      },
    },
    ...lines.map((line) =>
      React.createElement('span', {
        key: line.text,
        style: {
          fontFamily: 'Jost',
          fontSize: `${line.fontSize}px`,
          fontWeight: 400,
          letterSpacing: line.fontSize > 50 ? '0.18em' : '0.25em',
          color: '#ffffff',
          textTransform: 'uppercase' as const,
          marginBottom: lines.length > 1 ? '8px' : '0',
        },
        children: line.text,
      })
    )
  )

  const imgResponse = new ImageResponse(element, {
    width,
    height,
    ...(fontData
      ? {
          fonts: [
            {
              name: 'Jost',
              data: fontData,
              weight: 400 as const,
              style: 'normal' as const,
            },
          ],
        }
      : {}),
  })

  const arrayBuffer = await imgResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
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

  // Render text overlay with Jost font via next/og ImageResponse
  const textOverlay = await renderTextOverlay(width, height, lines)

  // Composite and output compressed JPEG
  const result = await base
    .composite([{ input: textOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 75 })
    .toBuffer()

  return result
}
