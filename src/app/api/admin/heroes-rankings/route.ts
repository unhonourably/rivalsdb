import { NextResponse } from 'next/server'
import { getAllHeroes, getHeroStats } from '@/lib/heroes'

export const dynamic = 'force-dynamic'

const calculateRivalsDbScore = (stats: any): number => {
  if (!stats) return 0
  
  let totalScore = 0
  
  const winRate = Number(stats.win_rate) || 0
  totalScore += (winRate / 100) * 40
  
  const kda = Number(stats.kda) || 0
  const normalizedKda = Math.min(kda / 2.0, 1)
  totalScore += normalizedKda * 25
  
  const sessionHitRate = Number(stats.session_hit_rate) || 0
  totalScore += (sessionHitRate / 100) * 15
  
  const kills = Number(stats.kills) || 0
  const assists = Number(stats.assists) || 0
  const matches = Number(stats.matches) || 1
  const eliminationsPerMatch = (kills + assists) / matches
  const normalizedElims = Math.min(eliminationsPerMatch / 8, 1)
  totalScore += normalizedElims * 15
  
  const avgScore = Number(stats.average_score) || 0
  const normalizedAvgScore = Math.min(avgScore / 3000, 1)
  totalScore += normalizedAvgScore * 5
  
  return totalScore
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

