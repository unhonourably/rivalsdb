import { NextRequest, NextResponse } from 'next/server'
import { getAllHeroes, getHeroStats } from '@/lib/heroes'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || 'wins'
    const limit = parseInt(searchParams.get('limit') || '3', 10)

    const heroes = await getAllHeroes()
    const heroStats = await Promise.all(
      heroes.map(async (hero) => {
        const stats = await getHeroStats(hero.id)
        return { hero, stats }
      })
    )

    const parseValue = (val: string | number | undefined | null): number => {
      if (val === null || val === undefined) return 0
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.]/g, '')
        const parsed = Number(cleaned)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }

    const parsePlayTime = (val: string | undefined | null): number => {
      if (!val || typeof val !== 'string') return 0
      const hoursMatch = val.match(/(\d+)h/)
      const minutesMatch = val.match(/(\d+)m/)
      const secondsMatch = val.match(/(\d+)s/)
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0
      const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0
      return hours * 3600 + minutes * 60 + seconds
    }

    const scored = heroStats
      .filter(({ stats }) => stats !== null)
      .map(({ hero, stats }) => {
        let score = 0
        let displayValue: string | number = '-'

        switch (category) {
          case 'wins':
            score = stats?.wins ?? 0
            displayValue = score
            break
          case 'winrate':
            score = (stats?.win_rate ?? 0) * 100
            displayValue = Number.isFinite(score) ? score.toFixed(1) : 0
            break
          case 'damage':
            score = parseValue(stats?.total_hero_damage)
            displayValue = score
            break
          case 'damage_taken':
            score = parseValue(stats?.total_damage_taken)
            displayValue = score
            break
          case 'healing':
            score = parseValue(stats?.total_hero_heal)
            displayValue = score
            break
          case 'playtime':
            score = parsePlayTime(stats?.play_time)
            displayValue = stats?.play_time ?? '-'
            break
          default:
            score = stats?.wins ?? 0
            displayValue = score
        }

        return {
          id: hero.id,
          name: hero.name,
          role: hero.role,
          image_url: hero.image_url,
          score,
          displayValue,
          stats
        }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return NextResponse.json({ heroes: scored })
  } catch (error) {
    console.error('Error fetching top heroes:', error)
    return NextResponse.json({ error: 'Failed to fetch top heroes' }, { status: 500 })
  }
}

