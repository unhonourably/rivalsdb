import { NextRequest, NextResponse } from 'next/server'
import { fetchHeroStatsFromApi, saveHeroStats } from '@/lib/heroes'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { heroId } = await request.json()

    if (!heroId) {
      return NextResponse.json({ error: 'Hero ID is required' }, { status: 400 })
    }

    const stats = await fetchHeroStatsFromApi(heroId)
    await saveHeroStats(heroId, stats)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error syncing stats for hero ${heroId}:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync hero stats' },
      { status: 500 }
    )
  }
}

