import { NextRequest, NextResponse } from "next/server"
import { getHeroLeaderboard } from "@/lib/heroes"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const heroId = params.id
    const platform = request.nextUrl.searchParams.get("platform") || "pc"
    const leaderboard = await getHeroLeaderboard(heroId, platform)
    
    return NextResponse.json({ players: leaderboard })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

