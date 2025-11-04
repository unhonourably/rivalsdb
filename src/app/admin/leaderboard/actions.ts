'use server'

import { fetchLeaderboardFromApi, saveLeaderboardPlayers } from '@/lib/leaderboard'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshLeaderboard() {
  const players = await fetchLeaderboardFromApi(10)
  await saveLeaderboardPlayers(players)
  await setCacheMeta('leaderboard', new Date(), players.length)
  return { count: players.length }
}

