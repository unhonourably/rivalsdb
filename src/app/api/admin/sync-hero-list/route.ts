import { NextResponse } from 'next/server'
import { refreshHeroList } from '@/app/admin/heroes/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshHeroList()
    return NextResponse.json({ success: true, message: 'Hero list synced successfully' })
  } catch (error) {
    console.error('Error syncing hero list:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync hero list' },
      { status: 500 }
    )
  }
}

