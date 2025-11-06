import { NextResponse } from 'next/server'
import { getBattlePassSeason } from '@/lib/battlepass'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const currentSeason = await getBattlePassSeason()

    if (!currentSeason) {
      return NextResponse.json({ error: 'No battle pass season found' }, { status: 404 })
    }

    return NextResponse.json({
      season: currentSeason.season,
      season_name: currentSeason.season_name,
      items: currentSeason.items || []
    })
  } catch (error) {
    console.error('Error fetching current battle pass:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch current battle pass' },
      { status: 500 }
    )
  }
}

