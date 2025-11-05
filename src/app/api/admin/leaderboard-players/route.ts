import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboardPage } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const result = await getLeaderboardPage(1, 10000)
    return NextResponse.json({ players: result.players })
  } catch (error) {
    console.error('Error fetching leaderboard players:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leaderboard players' },
      { status: 500 }
    )
  }
}

