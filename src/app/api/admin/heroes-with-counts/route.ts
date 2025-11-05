import { NextResponse } from 'next/server'
import { getAllHeroes } from '@/lib/heroes'
import { runQuery } from '@/lib/mysql'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const heroes = await getAllHeroes()
    
    const heroesWithCounts = await Promise.all(
      heroes.map(async (hero) => {
        try {
          const countResult = await runQuery<Array<{ total: number }>>(
            'SELECT COUNT(*) as total FROM hero_leaderboard WHERE hero_id = ?',
            [hero.id]
          )
          
          const count = countResult[0]?.total || 0
          
          return {
            id: hero.id,
            name: hero.name,
            role: hero.role,
            image_url: hero.image_url,
            leaderboard_count: count
          }
        } catch (error) {
          return {
            id: hero.id,
            name: hero.name,
            role: hero.role,
            image_url: hero.image_url,
            leaderboard_count: 0
          }
        }
      })
    )
    
    return NextResponse.json({ heroes: heroesWithCounts })
  } catch (error) {
    console.error('Error fetching heroes with counts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch heroes' },
      { status: 500 }
    )
  }
}

