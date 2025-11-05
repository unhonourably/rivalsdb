import { NextRequest, NextResponse } from 'next/server'
import pool, { runQuery } from '@/lib/mysql'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || 'score'
    const limit = parseInt(searchParams.get('limit') || '3', 10)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_cache (
        uid VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        score DECIMAL(20, 2) DEFAULT 0,
        rank_score DECIMAL(20, 2),
        rank_label VARCHAR(255),
        rank_color VARCHAR(64),
        rank_image VARCHAR(512),
        win_rate VARCHAR(64),
        win_count INT,
        battle_count INT,
        level INT,
        season_max_level INT,
        max_level INT,
        protect_score DECIMAL(20, 2),
        diff_score DECIMAL(20, 2),
        max_rank_score DECIMAL(20, 2),
        season_number INT,
        player_icon VARCHAR(512),
        rank_position INT NOT NULL,
        raw_json JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rank_position (rank_position)
      )
    `)

    const rows = await runQuery<Array<{
      uid: string
      name: string
      score: number
      rank_score: number | null
      rank_label: string | null
      rank_color: string | null
      rank_image: string | null
      win_rate: string | null
      win_count: number | null
      battle_count: number | null
      level: number | null
      season_max_level: number | null
      max_level: number | null
      protect_score: number | null
      diff_score: number | null
      max_rank_score: number | null
      season_number: number | null
      player_icon: string | null
      rank_position: number
    }>>(`SELECT * FROM leaderboard_cache`)

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

    const parseWinRate = (val: string | undefined | null): number => {
      if (!val || typeof val !== 'string') return 0
      const cleaned = val.replace(/[^0-9.]/g, '')
      const parsed = Number(cleaned)
      if (Number.isFinite(parsed)) {
        if (parsed <= 1) return parsed * 100
        return parsed
      }
      return 0
    }

    const scored = rows
      .map((row) => {
        let score = 0
        let displayValue: string | number = '-'

        switch (category) {
          case 'score':
            score = parseValue(row.score)
            displayValue = score
            break
          case 'winrate':
            score = parseWinRate(row.win_rate)
            displayValue = score
            break
          case 'win_count':
            score = parseValue(row.win_count)
            displayValue = score
            break
          case 'max_level':
            score = parseValue(row.max_level ?? row.season_max_level ?? row.level)
            displayValue = score
            break
          case 'battle_count':
            score = parseValue(row.battle_count)
            displayValue = score
            break
          case 'max_rank_score':
            score = parseValue(row.max_rank_score ?? row.rank_score)
            displayValue = score
            break
          default:
            score = parseValue(row.score)
            displayValue = score
        }

        return {
          uid: row.uid,
          name: row.name,
          rank_label: row.rank_label,
          rank_color: row.rank_color,
          player_icon: row.player_icon,
          score,
          displayValue,
          win_count: row.win_count,
          battle_count: row.battle_count,
          win_rate: row.win_rate,
          level: row.level,
          max_level: row.max_level ?? row.season_max_level,
          rank_score: row.rank_score,
          max_rank_score: row.max_rank_score
        }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return NextResponse.json({ players: scored })
  } catch (error) {
    console.error('Error fetching top players:', error)
    return NextResponse.json({ error: 'Failed to fetch top players' }, { status: 500 })
  }
}

