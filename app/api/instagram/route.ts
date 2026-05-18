import { NextResponse } from 'next/server'

export const revalidate = 14400 // Cache for 4 hours (14400 seconds)

export async function GET() {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  const accessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN

  if (!accountId || !accessToken) {
    return NextResponse.json(
      { error: 'Instagram credentials are not configured on the server.' },
      { status: 500 }
    )
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=9&access_token=${accessToken}`

    const res = await fetch(url, {
      next: { revalidate: 14400 } // 4 hours cache
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error('Instagram API returned error:', errData)
      return NextResponse.json(
        { error: 'Failed to fetch media from Instagram' },
        { status: res.status }
      )
    }

    const data = await res.json()
    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json([])
    }

    const formattedPosts = data.data.map((item: any) => ({
      id: item.id,
      url: item.permalink,
      image: item.media_type === 'VIDEO' && item.thumbnail_url ? item.thumbnail_url : item.media_url
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('Error in Instagram API Route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
