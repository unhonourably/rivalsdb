import { NextResponse } from "next/server"
import { getAllBalances } from "@/lib/balances"

export const revalidate = 0

export async function GET() {
  try {
    const balances = await getAllBalances()
    return NextResponse.json({ balances })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load balances"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

