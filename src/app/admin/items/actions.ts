'use server'

import { fetchItemsFromApi, saveItems } from '@/lib/items'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshItems() {
  const items = await fetchItemsFromApi()
  await saveItems(items)
  await setCacheMeta('items', new Date(), items.length)
  return { count: items.length }
}

