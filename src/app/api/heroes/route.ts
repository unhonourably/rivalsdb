import { NextResponse } from "next/server"
import { getAllHeroes } from "@/lib/heroes"

export const revalidate = 0

export async function GET() {
  try {
    const heroes = await getAllHeroes()
    return NextResponse.json({ heroes })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load heroes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

