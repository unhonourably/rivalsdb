import { NextResponse } from 'next/server'
import { getAllPatchNotes } from '@/lib/patchNotes'
import { getAllDevDiaries } from '@/lib/devDiaries'
import { getAllBalances } from '@/lib/balances'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [patchNotes, devDiaries, balances] = await Promise.all([
      getAllPatchNotes(),
      getAllDevDiaries(),
      getAllBalances()
    ])

    const latestPatchNote = patchNotes[0] || null
    const latestDevDiary = devDiaries[0] || null
    const latestBalance = balances[0] || null

    return NextResponse.json({
      patchNote: latestPatchNote,
      devDiary: latestDevDiary,
      balance: latestBalance
    })
  } catch (error) {
    console.error('Error fetching recent updates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recent updates' },
      { status: 500 }
    )
  }
}

