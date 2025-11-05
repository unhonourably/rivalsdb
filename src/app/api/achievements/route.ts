import { NextRequest, NextResponse } from "next/server"
import { getAchievementCategories, getAchievementsPage } from "@/lib/achievements"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 24
    const search = searchParams.get("search")?.trim() || ""
    const categoryParam = searchParams.get("category")?.trim() || ""
    const category = categoryParam && categoryParam.toLowerCase() !== "all" ? categoryParam : undefined
    const { rows, total, limit: safeLimit, page: safePage } = await getAchievementsPage({
      search: search || undefined,
      category,
      limit,
      page
    })
    const categories = await getAchievementCategories()
    const totalPages = Math.max(Math.ceil(total / safeLimit), 1)
    return NextResponse.json({
      achievements: rows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      categories
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load achievements"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

