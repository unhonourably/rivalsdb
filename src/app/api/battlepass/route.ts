import { NextRequest, NextResponse } from "next/server"
import {
  getBattlePassSeason,
  getBattlePassSeasons,
  saveBattlePassSeasons,
  fetchBattlePassSeasonFromApi,
  fetchBattlePassFromApi
} from "@/lib/battlepass"
import { setCacheMeta } from "@/lib/cacheMeta"

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const seasonParam = request.nextUrl.searchParams.get("season")
    const seasonNumber = seasonParam ? Number(seasonParam) : undefined
    if (seasonParam && (!Number.isFinite(seasonNumber) || (seasonNumber ?? 0) <= 0)) {
      return NextResponse.json({ error: "Invalid season parameter" }, { status: 400 })
    }
    if (seasonNumber) {
      let season = await getBattlePassSeason(seasonNumber)
      if (!season) {
        const fetched = await fetchBattlePassSeasonFromApi(seasonNumber)
        if (!fetched) {
          return NextResponse.json({ error: "Season not found" }, { status: 404 })
        }
        await saveBattlePassSeasons([fetched])
        const seasonsAfterSave = await getBattlePassSeasons()
        const totalItems = seasonsAfterSave.reduce((total, entry) => total + (entry.items?.length ?? 0), 0)
        await setCacheMeta('battlepass', new Date(), totalItems)
        season = fetched
        return NextResponse.json({
          season,
          availableSeasons: seasonsAfterSave.map(entry => entry.season).sort((a, b) => a - b)
        })
      }
      const all = await getBattlePassSeasons()
      return NextResponse.json({
        season,
        availableSeasons: all.map(entry => entry.season).sort((a, b) => a - b)
      })
    }
    const seasons = await getBattlePassSeasons()
    if (seasons.length === 0) {
      const fetched = await fetchBattlePassFromApi()
      if (!fetched.length) {
        return NextResponse.json({ error: "No battle pass data available" }, { status: 404 })
      }
      await saveBattlePassSeasons(fetched)
      const totalItems = fetched.reduce((total, entry) => total + (entry.items?.length ?? 0), 0)
      await setCacheMeta('battlepass', new Date(), totalItems)
      const latestFetched = fetched[fetched.length - 1]
      return NextResponse.json({
        season: latestFetched,
        availableSeasons: fetched.map(entry => entry.season).sort((a, b) => a - b)
      })
    }
    const latest = seasons[seasons.length - 1]
    return NextResponse.json({
      season: latest,
      availableSeasons: seasons.map(entry => entry.season).sort((a, b) => a - b)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load battle pass data"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

