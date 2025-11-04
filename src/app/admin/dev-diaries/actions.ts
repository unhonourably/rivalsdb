'use server'

import { fetchDevDiariesFromApi, saveDevDiaries } from '@/lib/devDiaries'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshDevDiaries() {
  const items = await fetchDevDiariesFromApi()
  await saveDevDiaries(items)
  await setCacheMeta('dev_diaries', new Date(), items.length)
  return { count: items.length }
}

