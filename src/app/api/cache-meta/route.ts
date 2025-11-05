import { NextRequest, NextResponse } from 'next/server'
import { setCacheMeta } from '@/lib/cacheMeta'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { cacheType, count } = await request.json()
    
    if (!cacheType || typeof count !== 'number') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    await setCacheMeta(cacheType, new Date(), count)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating cache meta:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update cache meta' },
      { status: 500 }
    )
  }
}

