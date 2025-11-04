import { NextRequest, NextResponse } from "next/server"
import { getHeroStats } from "@/lib/heroes"

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const heroId = params.id
    const stats = await getHeroStats(heroId)
    
    if (!stats) {
      return NextResponse.json({ error: "Stats not found" }, { status: 404 })
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load hero stats"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

