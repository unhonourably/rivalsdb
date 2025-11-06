import { NextResponse } from 'next/server'
import { refreshAllHeroDetails } from '@/app/admin/heroes/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshAllHeroDetails()
    return NextResponse.json({ success: true, message: 'Hero details synced successfully' })
  } catch (error) {
    console.error('Error syncing hero details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync hero details' },
      { status: 500 }
    )
  }
}

