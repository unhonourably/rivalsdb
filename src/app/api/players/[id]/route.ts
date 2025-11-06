import { NextRequest, NextResponse } from 'next/server'
import { getPlayerByUid, fetchPlayerStatsFromApi, savePlayerStats, savePlayer, saveFullPlayerProfile } from '@/lib/players'

const API_KEY = process.env.MARVEL_RIVALS_API_KEY || '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id

    const dbPlayer = await getPlayerByUid(uid)

    if (!dbPlayer) {
      return NextResponse.json({ error: 'Player not found in database' }, { status: 404 })
    }

    const parseJsonField = (value: unknown) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }
      if (typeof value === 'object') {
        return value
      }
      return null
    }

    const fullProfile = parseJsonField(dbPlayer.full_profile_json) || parseJsonField(dbPlayer.stats_json)
    
    const isConsolePlayer = uid.length <= 9
    
    console.log('DB player retrieval:', {
      uid,
      isConsolePlayer,
      hasFullProfile: !!dbPlayer.full_profile_json,
      hasStatsJson: !!dbPlayer.stats_json,
      fullProfileType: typeof fullProfile,
      fullProfileKeys: fullProfile ? Object.keys(fullProfile) : [],
      overallStatsLocation: fullProfile ? {
        direct: fullProfile.overall_stats,
        directType: typeof fullProfile.overall_stats,
        directKeys: fullProfile.overall_stats ? Object.keys(fullProfile.overall_stats) : [],
        player: fullProfile.player?.overall_stats,
        data: fullProfile.data?.overall_stats,
        stats: fullProfile.stats?.overall_stats,
        hasRolesPlayed: !!fullProfile.overall_stats?.roles_played,
        rolesPlayedKeys: fullProfile.overall_stats?.roles_played ? Object.keys(fullProfile.overall_stats.roles_played) : []
      } : null
    })

    return NextResponse.json({
      player: dbPlayer,
      stats: fullProfile,
      fullProfile: fullProfile,
      fromCache: true
    })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch player' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id
    const body = await request.json()
    const stats = body.stats || body.fullProfile

    if (!stats) {
      return NextResponse.json({ error: 'Stats data required' }, { status: 400 })
    }

    const playerNode = stats.player || stats
    const iconNode = playerNode?.icon || playerNode?.info?.icon || stats.player?.icon
    const rankNode = playerNode?.rank || playerNode?.rank_season || stats.player?.rank || stats.player?.rank_season
    const infoNode = playerNode?.info || stats.player?.info

    const playerRecord = {
      uid: uid,
      name: stats.name || playerNode?.name || 'Unknown',
      player_icon: iconNode?.player_icon || playerNode?.icon?.player_icon || stats.player?.icon?.player_icon || null,
      player_icon_id: iconNode?.player_icon_id || playerNode?.icon?.player_icon_id || stats.player?.icon?.player_icon_id || null,
      login_os: infoNode?.login_os || playerNode?.login_os || stats.player?.info?.login_os || stats.player?.login_os || null,
      level: rankNode?.level || playerNode?.level || stats.player?.rank_season?.level || stats.player?.level || null,
      rank_label: rankNode?.rank || rankNode?.rank_label || playerNode?.rank?.rank || stats.player?.rank?.rank || stats.player?.rank_season?.rank_label || null,
      rank_color: rankNode?.color || rankNode?.rank_color || playerNode?.rank?.color || stats.player?.rank?.color || stats.player?.rank_season?.rank_color || null,
      rank_score: rankNode?.rank_score || rankNode?.score || playerNode?.rank?.score || stats.player?.rank?.score || stats.player?.rank_season?.rank_score || null,
      max_level: rankNode?.max_level || playerNode?.max_level || stats.player?.rank_season?.max_level || stats.player?.max_level || null,
      max_rank_score: rankNode?.max_rank_score || playerNode?.rank?.peak_rank?.score || stats.player?.rank?.peak_rank?.score || stats.player?.rank_season?.max_rank_score || null,
      win_count: rankNode?.win_count || playerNode?.wins || stats.player?.rank_season?.win_count || stats.player?.wins || null,
      protect_score: rankNode?.protect_score || stats.player?.rank_season?.protect_score || null,
      diff_score: rankNode?.diff_score || stats.player?.rank_season?.diff_score || null,
      raw_json: stats,
      stats_json: stats,
      full_profile_json: stats
    }

    await savePlayer(playerRecord)

    return NextResponse.json({ success: true, message: 'Full profile saved to database' })
  } catch (error) {
    console.error('Error saving player stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save stats' },
      { status: 500 }
    )
  }
}

