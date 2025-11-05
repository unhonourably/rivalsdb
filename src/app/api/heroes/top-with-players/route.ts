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
      let score = 0
      
      const winRate = Number(stats.win_rate) || 0
      score += winRate * 40
      
      const kda = Number(stats.kda) || 0
      score += Math.min(kda * 5, 30)
      
      if (stats.matches && stats.mvps) {
        const mvpRate = (Number(stats.mvps) / Number(stats.matches)) * 100
        score += mvpRate * 15
      }
      
      if (stats.matches && stats.svps) {
        const svpRate = (Number(stats.svps) / Number(stats.matches)) * 100
        score += svpRate * 10
      }
      
      const avgScore = Number(stats.average_score) || 0
      score += (avgScore / 100) * 5
      
      return score
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
        const mvpRate = stats.matches && stats.mvps ? (Number(stats.mvps) / Number(stats.matches)) * 100 : 0
        const svpRate = stats.matches && stats.svps ? (Number(stats.svps) / Number(stats.matches)) * 100 : 0

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
            mvps: stats.mvps ? Number(stats.mvps) : undefined,
            svps: stats.svps ? Number(stats.svps) : undefined,
            mvp_rate: mvpRate,
            svp_rate: svpRate,
            average_score: stats.average_score ? Number(stats.average_score) : undefined,
            overall_score: overallScore
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

