import { NextResponse } from "next/server"
import { getAllDevDiaries } from "@/lib/devDiaries"

export const revalidate = 0

export async function GET() {
  try {
    const devDiaries = await getAllDevDiaries()
    return NextResponse.json({ devDiaries })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dev diaries"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

