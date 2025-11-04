'use server'

import { fetchBattlePassFromApi, fetchBattlePassSeasonFromApi, saveBattlePassSeasons } from '@/lib/battlepass'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshBattlePass() {
  const combined = new Map<number, any>()
  
  try {
    const primary = await fetchBattlePassFromApi()
    primary.forEach(season => {
      combined.set(season.season, season)
    })
  } catch (err) {
    console.warn('Failed to fetch primary battle pass data, falling back to individual seasons:', err)
  }

  const requiredSeasons = [1, 2, 3, 4]
  for (const seasonNumber of requiredSeasons) {
    if (!combined.has(seasonNumber)) {
      try {
        const fetched = await fetchBattlePassSeasonFromApi(seasonNumber)
        if (fetched) {
          combined.set(fetched.season, fetched)
        }
      } catch (err) {
        console.warn(`Failed to fetch season ${seasonNumber}:`, err)
      }
    }
  }

  if (combined.size === 0) {
    throw new Error('No battle pass seasons could be fetched from the API')
  }

  const seasons = Array.from(combined.values()).sort((a, b) => a.season - b.season)
  await saveBattlePassSeasons(seasons)
  const totalItems = seasons.reduce((total, season) => total + (season.items?.length ?? 0), 0)
  await setCacheMeta('battlepass', new Date(), totalItems)
  return { seasons: seasons.length, items: totalItems }
}

