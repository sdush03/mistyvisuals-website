import sharp from 'sharp'

/**
 * Fetch an image and convert it to a JPEG data URI.
 * - Relative paths are fetched from the internal backend API (avoids Next.js deadlock).
 * - WebP/AVIF/etc. are converted to JPEG via sharp (Satori only supports PNG/JPEG).
 */
export async function resolveImageToDataUri(imgPath: string | null): Promise<string> {
  if (!imgPath) return ''

  const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001'

  try {
    const fetchUrl = imgPath.startsWith('http') ? imgPath : `${INTERNAL_API}${imgPath}`
    const res = await fetch(fetchUrl)
    if (!res.ok) return ''

    const rawBuffer = Buffer.from(await res.arrayBuffer())

    // Convert to JPEG for Satori compatibility (webp not supported)
    // Keep quality low to stay under WhatsApp's ~300KB OG image limit
    const jpegBuffer = await sharp(rawBuffer)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 50 })
      .toBuffer()

    return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
  } catch (e) {
    console.error('OG resolveImage error:', e)
    return ''
  }
}
