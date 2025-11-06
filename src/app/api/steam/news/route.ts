import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MARVEL_RIVALS_STEAM_APP_ID = '2767030'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count') || '5')
    const maxlength = parseInt(url.searchParams.get('maxlength') || '500')

    const response = await fetch(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${MARVEL_RIVALS_STEAM_APP_ID}&count=${count}&maxlength=${maxlength}`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`)
    }

    const data = await response.json()
    const newsItems = data?.appnews?.newsitems || []

    const formattedNews = newsItems.map((item: any) => ({
      gid: item.gid,
      title: item.title,
      url: item.url,
      author: item.author,
      contents: item.contents,
      date: item.date,
      feedType: item.feed_type || item.feedtype,
      feedName: item.feed_name || item.feedname,
      feedLabel: item.feed_label || item.feedlabel,
      isExternalUrl: item.is_external_url || item.is_externalurl,
      formattedDate: item.date ? new Date(item.date * 1000).toISOString() : null
    }))

    return NextResponse.json({
      news: formattedNews,
      count: formattedNews.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching Steam news:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch Steam news',
        news: []
      },
      { status: 500 }
    )
  }
}

