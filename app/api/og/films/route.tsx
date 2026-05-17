import { NextResponse } from 'next/server'
import { generateOgImage } from '../resolveImage'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imgParam = searchParams.get('img')

  const buffer = await generateOgImage(imgParam, [
    { text: 'MISTY VISUALS', fontSize: 30 },
    { text: 'FILMS', fontSize: 76 },
  ])

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
