import { NextResponse } from 'next/server'
import { getAllHeroes, getHeroStats } from '@/lib/heroes'

export const dynamic = 'force-dynamic'

function calculateRivalsDbScore(stats: any): number {
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return val
    const parsed = parseFloat(String(val))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const winRate = parseNum(stats.win_rate)
  const kda = parseNum(stats.kda)
  const sessionHitRate = parseNum(stats.session_hit_rate)
  const matches = parseNum(stats.matches)
  const kills = parseNum(stats.kills)
  const avgScore = parseNum(stats.average_score)

  const killsPerMatch = matches > 0 ? kills / matches : 0

  const confidenceMultiplier = Math.min(matches / 500, 1)

  const winRateScore = (winRate > 1 ? winRate : winRate * 100) * 0.35
  const kdaScore = Math.min((kda / 2.5) * 25, 25)
  const killsScore = Math.min((killsPerMatch / 10) * 20, 20)
  const hitRateScore = (sessionHitRate > 1 ? sessionHitRate : sessionHitRate * 100) * 0.15
  const avgScoreScore = Math.min((avgScore / 4000) * 5, 5)

  const rawScore = winRateScore + kdaScore + killsScore + hitRateScore + avgScoreScore
  const finalScore = rawScore * confidenceMultiplier

  return Math.round(finalScore * 10) / 10
}

export async function GET() {
  try {
    const heroes = await getAllHeroes()
    
    const heroesWithScores = await Promise.all(
      heroes.map(async (hero) => {
        const stats = await getHeroStats(hero.id)
        
        if (!stats) {
          return {
            ...hero,
            rivals_db_score: 0,
            win_rate: 0,
            kda: 0,
            matches: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            total_hero_damage: 0,
            total_damage_taken: 0,
            total_hero_heal: 0,
          }
        }

        const rivalsDbScore = calculateRivalsDbScore(stats)

        return {
          id: hero.id,
          name: hero.name,
          role: hero.role,
          image_url: hero.image_url,
          rivals_db_score: rivalsDbScore,
          win_rate: parseFloat(String(stats.win_rate || 0)),
          kda: parseFloat(String(stats.kda || 0)),
          matches: parseInt(String(stats.matches || 0)),
          kills: parseInt(String(stats.kills || 0)),
          deaths: parseInt(String(stats.deaths || 0)),
          assists: parseInt(String(stats.assists || 0)),
          total_hero_damage: parseInt(String(stats.total_hero_damage || 0)),
          total_damage_taken: parseInt(String(stats.total_damage_taken || 0)),
          total_hero_heal: parseInt(String(stats.total_hero_heal || 0)),
        }
      })
    )

    const filteredHeroes = heroesWithScores.filter(h => h.matches >= 200)
    filteredHeroes.sort((a, b) => b.rivals_db_score - a.rivals_db_score)

    return NextResponse.json({ heroes: filteredHeroes })
  } catch (error) {
    console.error('Error fetching hero rankings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hero rankings' },
      { status: 500 }
    )
  }
}

