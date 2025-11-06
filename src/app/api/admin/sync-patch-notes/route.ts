import { NextResponse } from 'next/server'
import { refreshPatchNotes } from '@/app/admin/patch-notes/actions'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await refreshPatchNotes()
    return NextResponse.json({ success: true, message: 'Patch notes synced successfully' })
  } catch (error) {
    console.error('Error syncing patch notes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync patch notes' },
      { status: 500 }
    )
  }
}

