'use server'

import { fetchBalancesFromApi, saveBalances } from '@/lib/balances'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshBalances() {
  const items = await fetchBalancesFromApi()
  await saveBalances(items)
  await setCacheMeta('balances', new Date(), items.length)
  return { count: items.length }
}

