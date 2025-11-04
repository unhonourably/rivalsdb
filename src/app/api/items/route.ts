import { NextRequest, NextResponse } from "next/server"
import { getItemCategories, getItemsPage } from "@/lib/items"

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 30
    const search = searchParams.get("search")?.trim() || ""
    const categoryParam = searchParams.get("category")?.trim() || ""
    const category = categoryParam && categoryParam.toLowerCase() !== "all" ? categoryParam : undefined
    const { rows, total, limit: safeLimit, page: safePage } = await getItemsPage({
      search: search || undefined,
      category,
      limit,
      page
    })
    const categories = await getItemCategories()
    const totalPages = Math.max(Math.ceil(total / safeLimit), 1)
    return NextResponse.json({
      items: rows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      categories
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load items"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

