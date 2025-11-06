import { NextResponse } from 'next/server'
import { refreshDevDiaries } from '@/app/admin/dev-diaries/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshDevDiaries()
    return NextResponse.json({ success: true, message: 'Dev diaries synced successfully' })
  } catch (error) {
    console.error('Error syncing dev diaries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync dev diaries' },
      { status: 500 }
    )
  }
}

