'use server'

import {
  fetchHeroesFromApi,
  fetchHeroDetailFromApi,
  fetchHeroStatsFromApi,
  fetchHeroCostumesFromApi,
  fetchHeroLeaderboardFromApi,
  saveHeroes,
  saveHeroAbilities,
  saveHeroStats,
  saveHeroCostumes,
  saveHeroLeaderboard,
  getAllHeroes
} from '@/lib/heroes'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshHeroList() {
  const heroes = await fetchHeroesFromApi()
  await saveHeroes(heroes)
  await setCacheMeta('heroes_list', new Date(), heroes.length)
  return { count: heroes.length }
}

export async function refreshAllHeroDetails() {
  const heroes = await fetchHeroesFromApi()
  let detailCount = 0
  
  for (const hero of heroes) {
    try {
      const detail = await fetchHeroDetailFromApi(hero.id)
      await saveHeroes([detail.hero])
      await saveHeroAbilities(hero.id, detail.abilities)
      detailCount++
    } catch (error) {
      console.warn(`Failed to fetch details for hero ${hero.id}:`, error)
    }
  }
  
  await setCacheMeta('heroes_details', new Date(), detailCount)
  return { count: detailCount }
}

export async function refreshAllHeroStats() {
  const dbHeroes = await getAllHeroes()
  const apiHeroes = await fetchHeroesFromApi()
  if (apiHeroes.length && apiHeroes.length > dbHeroes.length) {
    await saveHeroes(apiHeroes)
  }

  const combined = [...dbHeroes, ...apiHeroes]
  const idToName = new Map<string, string>()
  const allIds = Array.from(new Set(combined
    .map(h => ({ id: String(h.id), name: h.name }))
    .filter(h => /^\d{4}$/.test(h.id))
    .map(h => { idToName.set(h.id, h.name); return h.id })
  ))

  const maxConcurrency = 6
  let statsCount = 0
  const processed = new Set<string>()

  for (let i = 0; i < allIds.length; i += maxConcurrency) {
    const batch = allIds.slice(i, i + maxConcurrency)
    await Promise.allSettled(batch.map(async (heroId) => {
      if (processed.has(heroId)) return
      processed.add(heroId)
      const heroName = idToName.get(heroId) || 'Unknown'

      const attempt = async (tries: number): Promise<void> => {
        try {
          const stats = await fetchHeroStatsFromApi(heroId)
          if (stats) {
            await saveHeroStats(stats)
            statsCount++
          } else {
            console.warn(`No stats returned for hero ${heroId} (${heroName})`)
          }
        } catch (err: any) {
          const message = String(err?.message || '')
          const retriable = /429|502|503|504|ECONNRESET|ETIMEDOUT/i.test(message)
          if (retriable && tries < 3) {
            await new Promise(r => setTimeout(r, 1000 * (tries + 1)))
            return attempt(tries + 1)
          }
          console.warn(`Failed to fetch stats for hero ${heroId} (${heroName}):`, err?.message || err)
        }
      }
      await attempt(0)
    }))
    if (i + maxConcurrency < allIds.length) {
      await new Promise(r => setTimeout(r, 250))
    }
  }

  await setCacheMeta('heroes_stats', new Date(), statsCount)
  return { count: statsCount }
}

export async function refreshAllHeroCostumes() {
  const heroes = await fetchHeroesFromApi()
  let costumeCount = 0
  
  for (const hero of heroes) {
    try {
      const costumes = await fetchHeroCostumesFromApi(hero.id)
      await saveHeroCostumes(hero.id, costumes)
      costumeCount += costumes.length
    } catch (error) {
      console.warn(`Failed to fetch costumes for hero ${hero.id}:`, error)
    }
  }
  
  await setCacheMeta('heroes_costumes', new Date(), costumeCount)
  return { count: costumeCount }
}

export async function refreshAllHeroLeaderboards() {
  const heroes = await fetchHeroesFromApi()
  const platforms = ['pc', 'ps', 'xbox']
  let leaderboardCount = 0
  
  for (const hero of heroes) {
    for (const platform of platforms) {
      try {
        const leaderboard = await fetchHeroLeaderboardFromApi(hero.id, platform)
        await saveHeroLeaderboard(hero.id, platform, leaderboard)
        leaderboardCount += leaderboard.length
      } catch (error) {
        console.warn(`Failed to fetch leaderboard for hero ${hero.id} on ${platform}:`, error)
      }
    }
  }
  
  await setCacheMeta('heroes_leaderboards', new Date(), leaderboardCount)
  return { count: leaderboardCount }
}

