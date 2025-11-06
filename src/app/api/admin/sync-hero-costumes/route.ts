import { NextResponse } from 'next/server'
import { refreshAllHeroCostumes } from '@/app/admin/heroes/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshAllHeroCostumes()
    return NextResponse.json({ success: true, message: 'Hero costumes synced successfully' })
  } catch (error) {
    console.error('Error syncing hero costumes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync hero costumes' },
      { status: 500 }
    )
  }
}

