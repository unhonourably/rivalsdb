import { NextRequest, NextResponse } from 'next/server'
import { getPlayerByName, getPlayerByUid, searchPlayer, fetchPlayerFromApi, savePlayer, fetchPlayerStatsFromApi, savePlayerStats } from '@/lib/players'

const API_KEY = process.env.MARVEL_RIVALS_API_KEY || '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || searchParams.get('query') || ''

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
    }

    const isNumeric = /^\d+$/.test(query.trim())
    
    let dbPlayer = null
    if (isNumeric) {
      dbPlayer = await getPlayerByUid(query.trim())
    } else {
      dbPlayer = await getPlayerByName(query.trim())
      if (!dbPlayer) {
        const searchResults = await searchPlayer(query.trim())
        if (searchResults.length > 0) {
          dbPlayer = searchResults[0]
        }
      }
    }

    if (dbPlayer) {
      return NextResponse.json({
        player: dbPlayer,
        fromCache: true
      })
    }

    const apiPlayer = await fetchPlayerFromApi(query, API_KEY)
    
    if (!apiPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const uid = apiPlayer.uid || apiPlayer.player_uid
    const name = apiPlayer.name || apiPlayer.info?.name

    if (!uid || !name) {
      return NextResponse.json({ error: 'Invalid player data' }, { status: 400 })
    }

    try {
      const fullStats = await fetchPlayerStatsFromApi(uid.toString(), API_KEY)
      
      const playerNode = fullStats?.player || apiPlayer
      const iconNode = playerNode?.icon || playerNode?.info?.icon || apiPlayer.info?.icon
      const rankNode = playerNode?.rank || playerNode?.rank_season || apiPlayer.info?.rank_season || apiPlayer.rank
      const infoNode = playerNode?.info || apiPlayer.info

      const playerRecord = {
        uid: uid.toString(),
        name: name,
        player_icon: iconNode?.player_icon || playerNode?.icon?.player_icon || apiPlayer.info?.icon?.player_icon || apiPlayer.player_icon || null,
        player_icon_id: iconNode?.player_icon_id || playerNode?.icon?.player_icon_id || apiPlayer.info?.icon?.player_icon_id || null,
        login_os: infoNode?.login_os || playerNode?.login_os || apiPlayer.info?.login_os || apiPlayer.login_os || null,
        level: rankNode?.level || playerNode?.level || apiPlayer.info?.rank_season?.level || apiPlayer.level || null,
        rank_label: rankNode?.rank || rankNode?.rank_label || playerNode?.rank?.rank || apiPlayer.info?.rank_season?.rank_label || apiPlayer.rank?.rank || null,
        rank_color: rankNode?.color || rankNode?.rank_color || playerNode?.rank?.color || apiPlayer.info?.rank_season?.rank_color || apiPlayer.rank?.color || null,
        rank_score: rankNode?.rank_score || rankNode?.score || playerNode?.rank?.score || apiPlayer.info?.rank_season?.rank_score || apiPlayer.rank?.score || null,
        max_level: rankNode?.max_level || playerNode?.max_level || apiPlayer.info?.rank_season?.max_level || apiPlayer.max_level || null,
        max_rank_score: rankNode?.max_rank_score || playerNode?.rank?.peak_rank?.score || apiPlayer.info?.rank_season?.max_rank_score || apiPlayer.rank?.peak_rank?.score || null,
        win_count: rankNode?.win_count || playerNode?.wins || apiPlayer.info?.rank_season?.win_count || apiPlayer.wins || null,
        protect_score: rankNode?.protect_score || apiPlayer.info?.rank_season?.protect_score || null,
        diff_score: rankNode?.diff_score || apiPlayer.info?.rank_season?.diff_score || null,
        raw_json: fullStats || apiPlayer,
        stats_json: fullStats || apiPlayer,
        full_profile_json: fullStats || apiPlayer
      }

      await savePlayer(playerRecord)

      return NextResponse.json({
        player: {
          uid: playerRecord.uid,
          name: playerRecord.name,
          player_icon: playerRecord.player_icon,
          player_icon_id: playerRecord.player_icon_id,
          login_os: playerRecord.login_os,
          level: playerRecord.level,
          rank_label: playerRecord.rank_label,
          rank_color: playerRecord.rank_color,
          rank_score: playerRecord.rank_score,
          max_level: playerRecord.max_level,
          max_rank_score: playerRecord.max_rank_score,
          win_count: playerRecord.win_count,
          protect_score: playerRecord.protect_score,
          diff_score: playerRecord.diff_score
        },
        fromCache: false
      })
    } catch (err) {
      console.error('Failed to fetch and save player data:', err)
      
      const basicPlayerRecord = {
        uid: uid.toString(),
        name: name,
        player_icon: apiPlayer.info?.icon?.player_icon || apiPlayer.player_icon || null,
        player_icon_id: apiPlayer.info?.icon?.player_icon_id || null,
        login_os: apiPlayer.info?.login_os || apiPlayer.login_os || null,
        level: apiPlayer.info?.rank_season?.level || apiPlayer.level || null,
        rank_label: apiPlayer.info?.rank_season?.rank_label || apiPlayer.rank?.rank || null,
        rank_color: apiPlayer.info?.rank_season?.rank_color || apiPlayer.rank?.color || null,
        rank_score: apiPlayer.info?.rank_season?.rank_score || apiPlayer.rank?.score || null,
        max_level: apiPlayer.info?.rank_season?.max_level || apiPlayer.max_level || null,
        max_rank_score: apiPlayer.info?.rank_season?.max_rank_score || apiPlayer.rank?.peak_rank?.score || null,
        win_count: apiPlayer.info?.rank_season?.win_count || apiPlayer.wins || null,
        protect_score: apiPlayer.info?.rank_season?.protect_score || null,
        diff_score: apiPlayer.info?.rank_season?.diff_score || null,
        raw_json: apiPlayer
      }

      await savePlayer(basicPlayerRecord)

      return NextResponse.json({
        player: {
          uid: basicPlayerRecord.uid,
          name: basicPlayerRecord.name,
          player_icon: basicPlayerRecord.player_icon,
          player_icon_id: basicPlayerRecord.player_icon_id,
          login_os: basicPlayerRecord.login_os,
          level: basicPlayerRecord.level,
          rank_label: basicPlayerRecord.rank_label,
          rank_color: basicPlayerRecord.rank_color,
          rank_score: basicPlayerRecord.rank_score,
          max_level: basicPlayerRecord.max_level,
          max_rank_score: basicPlayerRecord.max_rank_score,
          win_count: basicPlayerRecord.win_count,
          protect_score: basicPlayerRecord.protect_score,
          diff_score: basicPlayerRecord.diff_score
        },
        fromCache: false
      })
    }
  } catch (error) {
    console.error('Error searching player:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search player' },
      { status: 500 }
    )
  }
}

