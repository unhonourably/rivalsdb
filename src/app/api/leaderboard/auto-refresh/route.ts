import { NextResponse } from "next/server"
import { fetchLeaderboardFromApi, saveLeaderboardPlayers } from "@/lib/leaderboard"
import { getCacheMeta, setCacheMeta } from "@/lib/cacheMeta"

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export async function GET() {
  try {
    const meta = await getCacheMeta('leaderboard')
    const lastSynced = meta.lastSynced ? new Date(meta.lastSynced) : null
    const now = new Date()
    
    if (lastSynced && (now.getTime() - lastSynced.getTime()) < TWO_HOURS_MS) {
      return NextResponse.json({ 
        skipped: true, 
        message: 'Leaderboard was synced recently',
        lastSynced: lastSynced.toISOString(),
        nextSync: new Date(lastSynced.getTime() + TWO_HOURS_MS).toISOString()
      })
    }
    
    const players = await fetchLeaderboardFromApi(10)
    await saveLeaderboardPlayers(players)
    await setCacheMeta('leaderboard', now, players.length)
    
    return NextResponse.json({ 
      synced: true, 
      count: players.length,
      syncedAt: now.toISOString()
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh leaderboard"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

