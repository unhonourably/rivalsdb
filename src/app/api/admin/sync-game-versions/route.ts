import { NextResponse } from 'next/server'
import { refreshGameVersions } from '@/app/admin/game-versions/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshGameVersions()
    return NextResponse.json({ success: true, message: 'Game versions synced successfully' })
  } catch (error) {
    console.error('Error syncing game versions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync game versions' },
      { status: 500 }
    )
  }
}

