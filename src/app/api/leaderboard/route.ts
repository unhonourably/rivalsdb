import { NextRequest, NextResponse } from "next/server"
import { getLeaderboardPage } from "@/lib/leaderboard"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 25
    const result = await getLeaderboardPage(page, limit)
    return NextResponse.json({
      players: result.players,
      page: result.page,
      limit: result.limit,
      total_players: result.total,
      total_pages: result.totalPages
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

