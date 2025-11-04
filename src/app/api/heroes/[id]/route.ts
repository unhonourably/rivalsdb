import { NextRequest, NextResponse } from "next/server"
import { getHeroById, getHeroAbilities } from "@/lib/heroes"

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const heroId = params.id
    const hero = await getHeroById(heroId)
    
    if (!hero) {
      return NextResponse.json({ error: "Hero not found" }, { status: 404 })
    }
    
    const abilities = await getHeroAbilities(heroId)
    
    const transformations = hero.raw && typeof hero.raw === 'object' 
      ? (hero.raw as any).transformations ?? []
      : []
    
    return NextResponse.json({
      ...hero,
      abilities,
      transformations
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load hero"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

