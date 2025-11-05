import { NextRequest, NextResponse } from 'next/server'
import {
  fetchHeroLeaderboardFromApi,
  saveHeroLeaderboard
} from '@/lib/heroes'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { heroId } = await request.json()
    
    if (!heroId) {
      return NextResponse.json({ error: 'Hero ID is required' }, { status: 400 })
    }
    
    const platforms = ['pc', 'ps', 'xbox']
    let totalCount = 0
    
    for (const platform of platforms) {
      try {
        const leaderboard = await fetchHeroLeaderboardFromApi(heroId, platform)
        await saveHeroLeaderboard(heroId, platform, leaderboard)
        totalCount += leaderboard.length
      } catch (error) {
        console.warn(`Failed to fetch leaderboard for hero ${heroId} on ${platform}:`, error)
      }
    }
    
    return NextResponse.json({ success: true, count: totalCount })
  } catch (error) {
    console.error('Error syncing hero leaderboard:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync hero leaderboard' },
      { status: 500 }
    )
  }
}

