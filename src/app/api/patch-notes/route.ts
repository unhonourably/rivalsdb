import { NextResponse } from "next/server"
import { getAllPatchNotes } from "@/lib/patchNotes"

export const revalidate = 0

export async function GET() {
  try {
    const patchNotes = await getAllPatchNotes()
    return NextResponse.json({ patchNotes })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load patch notes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

