import { NextResponse } from "next/server"
import { getAllCacheMeta } from "@/lib/cacheMeta"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const metadata = await getAllCacheMeta()
    return NextResponse.json({ metadata })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cache metadata"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

