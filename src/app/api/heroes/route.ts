import { NextResponse } from "next/server"
import { getAllHeroes } from "@/lib/heroes"

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const heroes = await getAllHeroes()
    return NextResponse.json({ heroes })
  } catch (error) {
    console.error('Error fetching heroes:', error)
    const message = error instanceof Error ? error.message : "Failed to load heroes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

