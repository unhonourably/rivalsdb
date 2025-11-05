import { NextRequest, NextResponse } from 'next/server'
import { getDueSyncs, updateLastAutoSynced } from '@/lib/autoSync'
import { refreshAchievements } from '@/app/admin/achievements/actions'
import { refreshItems } from '@/app/admin/items/actions'
import { refreshBattlePass } from '@/app/admin/battlepass/actions'
import { refreshPatchNotes } from '@/app/admin/patch-notes/actions'
import { refreshBalances } from '@/app/admin/balances/actions'
import { refreshDevDiaries } from '@/app/admin/dev-diaries/actions'
import { refreshGameVersions } from '@/app/admin/game-versions/actions'
import { refreshLeaderboard } from '@/app/admin/leaderboard/actions'
import {
  refreshHeroList,
  refreshAllHeroDetails,
  refreshAllHeroStats,
  refreshAllHeroCostumes,
  refreshAllHeroLeaderboards
} from '@/app/admin/heroes/actions'
import { refreshPlayerStats } from '@/app/admin/players/actions'

const syncFunctions: Record<string, (config?: any) => Promise<any>> = {
  'achievements': refreshAchievements,
  'items': refreshItems,
  'battlepass': refreshBattlePass,
  'patch_notes': refreshPatchNotes,
  'balances': refreshBalances,
  'dev_diaries': refreshDevDiaries,
  'game_versions': refreshGameVersions,
  'leaderboard': refreshLeaderboard,
  'heroes_list': refreshHeroList,
  'heroes_details': refreshAllHeroDetails,
  'heroes_stats': refreshAllHeroStats,
  'heroes_costumes': refreshAllHeroCostumes,
  'heroes_leaderboards': refreshAllHeroLeaderboards,
  'player_stats_update': refreshPlayerStats,
}

export async function POST(request: NextRequest) {
  try {
    const dueSyncs = await getDueSyncs()
    const results: Array<{ cache_type: string; success: boolean; error?: string; count?: number }> = []

    for (const config of dueSyncs) {
      try {
        const syncFunction = syncFunctions[config.cache_type]
        if (!syncFunction) {
          results.push({ cache_type: config.cache_type, success: false, error: 'No sync function found' })
          continue
        }

        if (config.cache_type === 'heroes_leaderboards') {
          let totalCount = 0
          let currentIndex = 0
          let isComplete = false
          const batchSize = 3
          
          while (!isComplete) {
            const result = await syncFunction({ startIndex: currentIndex, batchSize })
            totalCount += result.count
            currentIndex = result.nextIndex
            isComplete = result.isComplete
            
            if (!isComplete) {
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
          
          const { setCacheMeta } = await import('@/lib/cacheMeta')
          await setCacheMeta('heroes_leaderboards', new Date(), totalCount)
          await updateLastAutoSynced(config.cache_type)
          results.push({ cache_type: config.cache_type, success: true, count: totalCount })
        } else {
          const batchConfig = config.batch_size && config.batch_delay ? {
            batchSize: config.batch_size,
            delayBetweenBatches: config.batch_delay
          } : undefined
          
          await syncFunction(batchConfig)
          await updateLastAutoSynced(config.cache_type)
          results.push({ cache_type: config.cache_type, success: true })
        }
      } catch (error) {
        console.error(`Error syncing ${config.cache_type}:`, error)
        results.push({
          cache_type: config.cache_type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error running auto-syncs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run auto-syncs' },
      { status: 500 }
    )
  }
}

