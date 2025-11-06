import { NextResponse } from 'next/server'
import { refreshBattlePass } from '@/app/admin/battlepass/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshBattlePass()
    return NextResponse.json({ success: true, message: 'Battle pass synced successfully' })
  } catch (error) {
    console.error('Error syncing battle pass:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync battle pass' },
      { status: 500 }
    )
  }
}

