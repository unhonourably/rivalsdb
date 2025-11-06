import { NextRequest, NextResponse } from 'next/server'
import { fetchHeroStatsFromApi, saveHeroStats } from '@/lib/heroes'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let heroId: string | undefined
  
  try {
    const body = await request.json()
    heroId = body.heroId

    if (!heroId) {
      return NextResponse.json({ error: 'Hero ID is required' }, { status: 400 })
    }

    const stats = await fetchHeroStatsFromApi(heroId)
    if (!stats) {
      return NextResponse.json({ error: 'Failed to fetch hero stats from API' }, { status: 404 })
    }
    await saveHeroStats(stats)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error syncing stats for hero ${heroId || 'unknown'}:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync hero stats' },
      { status: 500 }
    )
  }
}

