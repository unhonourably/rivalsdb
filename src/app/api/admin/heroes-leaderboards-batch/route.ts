import { NextRequest, NextResponse } from 'next/server'
import { refreshAllHeroLeaderboards } from '@/app/admin/heroes/actions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startIndex = 0, batchSize = 3 } = body

    const result = await refreshAllHeroLeaderboards({ 
      startIndex, 
      batchSize 
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error syncing hero leaderboards batch:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to sync hero leaderboards batch',
        success: false
      },
      { status: 500 }
    )
  }
}

