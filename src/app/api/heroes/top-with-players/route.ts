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
      if (typeof item.stats.matches !== 'number') return false
      return item.stats.matches > 100
    })

    const calculateHeroScore = (stats: any): number => {
      let score = 0
      
      const winRate = stats.win_rate || 0
      score += winRate * 40
      
      const kda = stats.kda || 0
      score += Math.min(kda * 5, 30)
      
      if (stats.matches && stats.mvps) {
        const mvpRate = (stats.mvps / stats.matches) * 100
        score += mvpRate * 15
      }
      
      if (stats.matches && stats.svps) {
        const svpRate = (stats.svps / stats.matches) * 100
        score += svpRate * 10
      }
      
      const avgScore = stats.average_score || 0
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
        const mvpRate = stats.matches && stats.mvps ? (stats.mvps / stats.matches) * 100 : 0
        const svpRate = stats.matches && stats.svps ? (stats.svps / stats.matches) * 100 : 0

        return {
          hero: {
            id: hero.id,
            name: hero.name,
            role: hero.role,
            image_url: hero.image_url
          },
          stats: {
            matches: stats.matches,
            wins: stats.wins,
            losses: stats.losses,
            win_rate: stats.win_rate,
            kda: stats.kda,
            mvps: stats.mvps,
            svps: stats.svps,
            mvp_rate: mvpRate,
            svp_rate: svpRate,
            average_score: stats.average_score,
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

