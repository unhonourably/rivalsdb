import { NextRequest, NextResponse } from 'next/server'
import { getAllHeroes, getHeroStats, getHeroLeaderboard } from '@/lib/heroes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '6', 10)
    
    const heroes = await getAllHeroes()
    const heroesWithStats = await Promise.all(
      heroes.map(async (hero) => {
        try {
          const stats = await getHeroStats(hero.id)
          return { hero, stats }
        } catch {
          return null
        }
      })
    )

    const validHeroes = heroesWithStats.filter((item): item is { hero: any; stats: any } => {
      if (item === null) return false
      if (!item.stats) return false
      const matches = Number(item.stats.matches)
      if (isNaN(matches)) return false
      return matches > 100
    })

    const calculateHeroScore = (stats: any): number => {
      let totalScore = 0
      
      const winRate = Number(stats.win_rate) || 0
      const winRatePercent = winRate > 1 ? winRate : winRate * 100
      totalScore += Math.min(winRatePercent, 100) * 0.35
      
      const kda = Number(stats.kda) || 0
      const kdaScore = Math.min(kda / 2.5, 1) * 25
      totalScore += kdaScore
      
      const sessionHitRate = Number(stats.session_hit_rate) || 0
      const hitRatePercent = sessionHitRate > 1 ? sessionHitRate : sessionHitRate * 100
      totalScore += Math.min(hitRatePercent, 100) * 0.15
      
      const kills = Number(stats.kills) || 0
      const assists = Number(stats.assists) || 0
      const matches = Number(stats.matches) || 1
      const eliminationsPerMatch = (kills + assists) / matches
      const elimsScore = Math.min(eliminationsPerMatch / 10, 1) * 20
      totalScore += elimsScore
      
      const avgScore = Number(stats.average_score) || 0
      const avgScoreNormalized = Math.min(avgScore / 4000, 1) * 5
      totalScore += avgScoreNormalized
      
      return Math.min(totalScore, 100)
    }

    validHeroes.sort((a, b) => {
      const scoreA = calculateHeroScore(a.stats)
      const scoreB = calculateHeroScore(b.stats)
      return scoreB - scoreA
    })

    const topHeroes = validHeroes.slice(0, limit)

    const result = await Promise.all(
      topHeroes.map(async ({ hero, stats }) => {
        let bestPlayer = null
        try {
          const leaderboard = await getHeroLeaderboard(hero.id, 'pc')
          if (leaderboard && leaderboard.length > 0) {
            const topPlayer = leaderboard[0]
            bestPlayer = {
              name: topPlayer.player_name,
              uid: topPlayer.player_uid,
              icon: topPlayer.player_icon,
              wins: topPlayer.wins,
              matches: topPlayer.matches,
              kills: topPlayer.kills,
              deaths: topPlayer.deaths,
              assists: topPlayer.assists,
              rank: topPlayer.rank
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch leaderboard for hero ${hero.id}:`, error)
        }

        const overallScore = calculateHeroScore(stats)
        
        const parseStatValue = (val: any): number => {
          if (!val) return 0
          const str = String(val).replace(/[^0-9.]/g, '')
          return Number(str) || 0
        }

        const totalDamage = parseStatValue(stats.total_hero_damage)
        const totalDamageTaken = parseStatValue(stats.total_damage_taken)
        const totalHealing = parseStatValue(stats.total_hero_heal)

        return {
          hero: {
            id: hero.id,
            name: hero.name,
            role: hero.role,
            image_url: hero.image_url
          },
          stats: {
            matches: stats.matches ? Number(stats.matches) : undefined,
            wins: stats.wins ? Number(stats.wins) : undefined,
            losses: stats.losses ? Number(stats.losses) : undefined,
            win_rate: stats.win_rate ? Number(stats.win_rate) : undefined,
            kda: stats.kda ? Number(stats.kda) : undefined,
            kills: stats.kills ? Number(stats.kills) : undefined,
            assists: stats.assists ? Number(stats.assists) : undefined,
            session_hit_rate: stats.session_hit_rate ? Number(stats.session_hit_rate) : undefined,
            total_hero_damage: totalDamage,
            total_damage_taken: totalDamageTaken,
            total_hero_heal: totalHealing,
            average_score: stats.average_score ? Number(stats.average_score) : undefined,
            rivals_db_score: overallScore
          },
          bestPlayer
        }
      })
    )

    return NextResponse.json({ heroes: result })
  } catch (error) {
    console.error('Error fetching top heroes with players:', error)
    return NextResponse.json({ error: 'Failed to fetch top heroes' }, { status: 500 })
  }
}

