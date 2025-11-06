import { NextResponse } from 'next/server'
import { refreshLeaderboard } from '@/app/admin/leaderboard/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshLeaderboard()
    return NextResponse.json({ success: true, message: 'Leaderboard synced successfully' })
  } catch (error) {
    console.error('Error syncing leaderboard:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync leaderboard' },
      { status: 500 }
    )
  }
}

