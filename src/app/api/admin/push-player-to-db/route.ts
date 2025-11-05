import { NextRequest, NextResponse } from 'next/server'
import { fetchPlayerStatsFromApi, savePlayer } from '@/lib/players'

export const dynamic = 'force-dynamic'

const API_KEY = process.env.MARVEL_RIVALS_API_KEY || '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid } = body

    if (!uid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 })
    }

    try {
      const fullStats = await fetchPlayerStatsFromApi(uid, API_KEY)

      if (!fullStats) {
        return NextResponse.json({ error: 'Failed to fetch player stats', isPrivate: false }, { status: 404 })
      }

      const playerNode = fullStats.player || fullStats
      const iconNode = playerNode?.icon || playerNode?.info?.icon || fullStats.player?.icon
      const rankNode = playerNode?.rank || playerNode?.rank_season || fullStats.player?.rank || fullStats.player?.rank_season
      const infoNode = playerNode?.info || fullStats.player?.info

      const playerRecord = {
        uid: uid,
        name: fullStats.name || playerNode?.name || 'Unknown',
        player_icon: iconNode?.player_icon || playerNode?.icon?.player_icon || fullStats.player?.icon?.player_icon || null,
        player_icon_id: iconNode?.player_icon_id || playerNode?.icon?.player_icon_id || fullStats.player?.icon?.player_icon_id || null,
        login_os: infoNode?.login_os || playerNode?.login_os || fullStats.player?.info?.login_os || fullStats.player?.login_os || null,
        level: rankNode?.level || playerNode?.level || fullStats.player?.rank_season?.level || fullStats.player?.level || null,
        rank_label: rankNode?.rank || rankNode?.rank_label || playerNode?.rank?.rank || fullStats.player?.rank?.rank || fullStats.player?.rank_season?.rank_label || null,
        rank_color: rankNode?.color || rankNode?.rank_color || playerNode?.rank?.color || fullStats.player?.rank?.color || fullStats.player?.rank_season?.rank_color || null,
        rank_score: rankNode?.rank_score || rankNode?.score || playerNode?.rank?.score || fullStats.player?.rank?.score || fullStats.player?.rank_season?.rank_score || null,
        max_level: rankNode?.max_level || playerNode?.max_level || fullStats.player?.rank_season?.max_level || fullStats.player?.max_level || null,
        max_rank_score: rankNode?.max_rank_score || playerNode?.rank?.peak_rank?.score || fullStats.player?.rank?.peak_rank?.score || fullStats.player?.rank_season?.max_rank_score || null,
        win_count: rankNode?.win_count || playerNode?.wins || fullStats.player?.rank_season?.win_count || fullStats.player?.wins || null,
        protect_score: rankNode?.protect_score || fullStats.player?.rank_season?.protect_score || null,
        diff_score: rankNode?.diff_score || fullStats.player?.rank_season?.diff_score || null,
        raw_json: fullStats,
        stats_json: fullStats,
        full_profile_json: fullStats
      }

      await savePlayer(playerRecord)

      return NextResponse.json({ success: true, message: 'Player saved to database', isPrivate: false })
    } catch (apiError: any) {
      const errorMessage = apiError?.message || String(apiError)
      const isPrivate = apiError?.isPrivate || errorMessage.includes('403') || errorMessage.includes('private') || errorMessage.includes('Private')
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          isPrivate,
          message: isPrivate ? 'Player profile is private' : 'Failed to fetch player stats'
        },
        { status: isPrivate ? 403 : 500 }
      )
    }
  } catch (error) {
    console.error('Error pushing player to DB:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to push player to database', isPrivate: false },
      { status: 500 }
    )
  }
}

