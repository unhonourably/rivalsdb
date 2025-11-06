import { NextResponse } from 'next/server'
import { getAllHeroes, getHeroStats } from '@/lib/heroes'

export const dynamic = 'force-dynamic'

const calculateRivalsDbScore = (stats: any): number => {
  if (!stats) return 0
  
  const matches = Number(stats.matches) || 0
  
  const confidenceMultiplier = Math.min(matches / 500, 1)
  
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
  const eliminationsPerMatch = matches > 0 ? (kills + assists) / matches : 0
  const elimsScore = Math.min(eliminationsPerMatch / 10, 1) * 20
  totalScore += elimsScore
  
  const avgScore = Number(stats.average_score) || 0
  const avgScoreNormalized = Math.min(avgScore / 4000, 1) * 5
  totalScore += avgScoreNormalized
  
  return Math.min(totalScore * confidenceMultiplier, 100)
}

export async function GET() {
  try {
    const heroes = await getAllHeroes()
    
    const heroesWithScores = await Promise.all(
      heroes.map(async (hero) => {
        try {
          const stats = await getHeroStats(hero.id)
          const rivals_db_score = calculateRivalsDbScore(stats)
          
          return {
            hero_id: hero.id,
            name: hero.name,
            role: hero.role,
            image_url: hero.image_url,
            win_rate: stats?.win_rate ? Number(stats.win_rate) : null,
            kda: stats?.kda ? Number(stats.kda) : null,
            matches: stats?.matches ? Number(stats.matches) : null,
            rivals_db_score
          }
        } catch (error) {
          return {
            hero_id: hero.id,
            name: hero.name,
            role: hero.role,
            image_url: hero.image_url,
            win_rate: null,
            kda: null,
            matches: null,
            rivals_db_score: 0
          }
        }
      })
    )
    
    heroesWithScores.sort((a, b) => b.rivals_db_score - a.rivals_db_score)
    
    return NextResponse.json({ heroes: heroesWithScores })
  } catch (error) {
    console.error('Error fetching hero rankings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hero rankings' },
      { status: 500 }
    )
  }
}

