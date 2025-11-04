'use server'

import { fetchAchievementsFromApi, saveAchievements } from '@/lib/achievements'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshAchievements() {
  const items = await fetchAchievementsFromApi()
  await saveAchievements(items)
  await setCacheMeta('achievements', new Date(), items.length)
  return { count: items.length }
}

