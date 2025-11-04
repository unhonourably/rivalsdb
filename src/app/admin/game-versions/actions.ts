'use server'

import { fetchGameVersionsFromApi, saveGameVersions } from '@/lib/gameVersions'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshGameVersions() {
  const items = await fetchGameVersionsFromApi()
  await saveGameVersions(items)
  await setCacheMeta('game_versions', new Date(), items.length)
  return { count: items.length }
}

