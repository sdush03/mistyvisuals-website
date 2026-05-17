import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Load font path for SVG text (we use SVG overlay instead of Satori for size control)
const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mistyvisuals.com'

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

function createTextOverlay(
  width: number,
  height: number,
  lines: { text: string; fontSize: number }[]
): Buffer {
  const totalHeight = lines.reduce((sum, l) => sum + l.fontSize * 1.3, 0)
  const startY = (height - totalHeight) / 2

  let textElements = ''
  let y = startY
  for (const line of lines) {
    y += line.fontSize * 0.9
    textElements += `<text x="50%" y="${y}" text-anchor="middle" 
      font-family="'Jost', 'Futura', 'Trebuchet MS', Arial, sans-serif" 
      font-size="${line.fontSize}" font-weight="400" 
      letter-spacing="${line.fontSize > 50 ? 16 : 8}" 
      fill="white">${line.text}</text>`
    y += line.fontSize * 0.4
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.50"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#overlay)"/>
    ${textElements}
  </svg>`

  return Buffer.from(svg)
}

export async function generateOgImage(
  imgPath: string | null,
  lines: { text: string; fontSize: number }[]
): Promise<Buffer> {
  const width = 1200
  const height = 630

  // Start with the background image or a solid dark color
  const imgBuffer = await fetchImage(imgPath)

  let base: sharp.Sharp
  if (imgBuffer) {
    base = sharp(imgBuffer).resize(width, height, { fit: 'cover' })
  } else {
    base = sharp({
      create: { width, height, channels: 3, background: { r: 26, g: 21, b: 18 } },
    })
  }

  // Composite the text overlay SVG
  const overlay = createTextOverlay(width, height, lines)

  const result = await base
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 75 })
    .toBuffer()

  return result
}
