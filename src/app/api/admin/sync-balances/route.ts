import { NextResponse } from 'next/server'
import { refreshBalances } from '@/app/admin/balances/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshBalances()
    return NextResponse.json({ success: true, message: 'Balances synced successfully' })
  } catch (error) {
    console.error('Error syncing balances:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync balances' },
      { status: 500 }
    )
  }
}

