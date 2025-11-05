import { NextRequest, NextResponse } from 'next/server'
import { getAutoSyncConfig, getAllAutoSyncConfigs, saveAutoSyncConfig } from '@/lib/autoSync'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const configs = await getAllAutoSyncConfigs()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error fetching auto-sync configs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch auto-sync configs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cache_type, enabled, interval_count, interval_unit, next_sync_at, batch_size, batch_delay } = body

    if (!cache_type || typeof enabled !== 'boolean' || !interval_count || !interval_unit) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const config: any = {
      cache_type,
      enabled,
      interval_count: parseInt(interval_count),
      interval_unit: interval_unit as 'hour' | 'day' | 'week' | 'month',
      batch_size: batch_size ? parseInt(batch_size) : null,
      batch_delay: batch_delay ? parseInt(batch_delay) : null
    }

    if (next_sync_at !== undefined) {
      config.next_sync_at = next_sync_at ? new Date(next_sync_at) : null
    }

    await saveAutoSyncConfig(config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving auto-sync config:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save auto-sync config' },
      { status: 500 }
    )
  }
}

