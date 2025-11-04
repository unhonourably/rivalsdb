'use server'

import { getAllPlayers, savePlayer, getPlayerCount } from '@/lib/players'
import { setCacheMeta } from '@/lib/cacheMeta'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'

interface BatchConfig {
  batchSize: number
  delayBetweenBatches: number
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchPlayerUpdate(uid: string) {
  const updateResponse = await fetch(`${API_BASE}/player/${uid}/update`, {
    headers: { 'x-api-key': API_KEY }
  })
  
  if (!updateResponse.ok) {
    throw new Error(`Update request failed: ${updateResponse.status}`)
  }
  
  await delay(2000)
  
  const playerResponse = await fetch(`${API_BASE}/player/${uid}`, {
    headers: { 'x-api-key': API_KEY }
  })
  
  if (!playerResponse.ok) {
    throw new Error(`Failed to fetch updated player data: ${playerResponse.status}`)
  }
  
  return await playerResponse.json()
}

async function savePlayerToDb(fullProfile: any) {
  const player = fullProfile?.player || fullProfile
  
  if (!player.uid) {
    throw new Error('Player UID is required')
  }

  const playerRecord: any = {
    uid: String(player.uid),
    name: player.name || 'Unknown',
    player_icon: player.icon?.player_icon || null,
    player_icon_id: player.icon?.player_icon_id || null,
    login_os: player.info?.login_os || null,
    level: player.level ? parseInt(player.level) : null,
    rank_label: player.rank?.rank || null,
    rank_color: player.rank?.color || null,
    rank_score: player.rank?.score ? parseFloat(player.rank.score) : null,
    max_level: null,
    max_rank_score: player.rank?.peak_rank?.score ? parseFloat(player.rank.peak_rank.score) : null,
    win_count: null,
    protect_score: null,
    diff_score: null,
    raw_json: player,
    stats_json: fullProfile.overall_stats || fullProfile.stats || null,
    full_profile_json: fullProfile
  }

  await savePlayer(playerRecord)
}

export async function refreshPlayerStats(batchConfig?: BatchConfig) {
  const config = batchConfig || { batchSize: 10, delayBetweenBatches: 5 }
  
  const players = await getAllPlayers()
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ uid: string; error: string }> = []

  for (let i = 0; i < players.length; i += config.batchSize) {
    const batch = players.slice(i, i + config.batchSize)
    
    await Promise.allSettled(
      batch.map(async (player) => {
        try {
          const updatedProfile = await fetchPlayerUpdate(player.uid)
          await savePlayerToDb(updatedProfile)
          successCount++
        } catch (error) {
          errorCount++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ uid: player.uid, error: errorMessage })
          console.error(`Failed to update player ${player.uid}:`, error)
        }
      })
    )

    if (i + config.batchSize < players.length) {
      await delay(config.delayBetweenBatches * 60 * 1000)
    }
  }

  await setCacheMeta('player_stats_update', new Date(), successCount)
  
  return { 
    success: successCount, 
    errors: errorCount,
    total: players.length,
    errorDetails: errors.slice(0, 10)
  }
}

export async function getPlayerStatsUpdateInfo() {
  const count = await getPlayerCount()
  return { totalPlayers: count }
}

