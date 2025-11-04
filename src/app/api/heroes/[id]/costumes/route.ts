import { NextRequest, NextResponse } from "next/server"
import { getHeroCostumes } from "@/lib/heroes"

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const heroId = params.id
    const costumes = await getHeroCostumes(heroId)
    
    return NextResponse.json(costumes)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load costumes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

