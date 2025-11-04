import { NextResponse } from "next/server"
import { getAllGameVersions } from "@/lib/gameVersions"

export const revalidate = 0

export async function GET() {
  try {
    const gameVersions = await getAllGameVersions()
    return NextResponse.json({ gameVersions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load game versions"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

