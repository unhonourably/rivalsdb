import { NextResponse } from 'next/server'
import { refreshAchievements } from '@/app/admin/achievements/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshAchievements()
    return NextResponse.json({ success: true, message: 'Achievements synced successfully' })
  } catch (error) {
    console.error('Error syncing achievements:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync achievements' },
      { status: 500 }
    )
  }
}

