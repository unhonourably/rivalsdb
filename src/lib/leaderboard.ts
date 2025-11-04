import pool, { runQuery } from "@/lib/mysql"

export interface LeaderboardPlayerRecord {
  uid: string
  name: string
  score: number
  rank_score?: number
  rank_label?: string
  rank_color?: string
  rank_image?: string
  win_rate?: string
  win_count?: number
  battle_count?: number
  level?: number
  season_max_level?: number
  max_level?: number
  protect_score?: number
  diff_score?: number
  max_rank_score?: number
  season_number?: number
  player_icon?: string
  raw?: unknown
  rank_position: number
}

const ensureTable = async () => {
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
}

export const getLeaderboardPage = async (page: number = 1, limit: number = 25) => {
  await ensureTable()
  const safePage = Math.max(page, 1)
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const offset = (safePage - 1) * safeLimit
  
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
    raw_json: unknown
  }>>(`SELECT * FROM leaderboard_cache ORDER BY rank_position ASC LIMIT ? OFFSET ?`, [safeLimit, offset])
  
  const countResult = await runQuery<Array<{ total: number }>>(`SELECT COUNT(*) AS total FROM leaderboard_cache`)
  const total = countResult[0]?.total ?? 0
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1)
  
  const parseJsonField = (value: unknown) => {
    if (!value) return undefined
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    }
    return value
  }
  
  return {
    players: rows.map((row) => ({
      uid: row.uid,
      name: row.name,
      score: row.score,
      rank_score: row.rank_score ?? undefined,
      rank_label: row.rank_label ?? undefined,
      rank_color: row.rank_color ?? undefined,
      rank_image: row.rank_image ?? undefined,
      win_rate: row.win_rate ?? undefined,
      win_count: row.win_count ?? undefined,
      battle_count: row.battle_count ?? undefined,
      level: row.level ?? undefined,
      season_max_level: row.season_max_level ?? undefined,
      max_level: row.max_level ?? undefined,
      protect_score: row.protect_score ?? undefined,
      diff_score: row.diff_score ?? undefined,
      max_rank_score: row.max_rank_score ?? undefined,
      season_number: row.season_number ?? undefined,
      player_icon: row.player_icon ?? undefined,
      rank_position: row.rank_position,
      raw: parseJsonField(row.raw_json)
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages
  }
}

export const saveLeaderboardPlayers = async (players: LeaderboardPlayerRecord[]) => {
  if (players.length === 0) return
  await ensureTable()
  await pool.query(`DELETE FROM leaderboard_cache`)
  
  const values = players.map((player) => [
    player.uid,
    player.name,
    player.score ?? 0,
    player.rank_score ?? null,
    player.rank_label ?? null,
    player.rank_color ?? null,
    player.rank_image ?? null,
    player.win_rate ?? null,
    player.win_count ?? null,
    player.battle_count ?? null,
    player.level ?? null,
    player.season_max_level ?? null,
    player.max_level ?? null,
    player.protect_score ?? null,
    player.diff_score ?? null,
    player.max_rank_score ?? null,
    player.season_number ?? null,
    player.player_icon ?? null,
    player.rank_position,
    player.raw ? JSON.stringify(player.raw) : null
  ])
  
  const chunkSize = 100
  for (let index = 0; index < values.length; index += chunkSize) {
    const chunk = values.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
    await pool.query(
      `INSERT INTO leaderboard_cache (
        uid, name, score, rank_score, rank_label, rank_color, rank_image, win_rate, win_count, battle_count,
        level, season_max_level, max_level, protect_score, diff_score, max_rank_score, season_number,
        player_icon, rank_position, raw_json
      ) VALUES ${placeholders}`,
      chunk.flat()
    )
  }
}

export const fetchLeaderboardFromApi = async (maxPages: number = 10): Promise<LeaderboardPlayerRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const aggregated: LeaderboardPlayerRecord[] = []
  let page = 1
  let totalPages = 1
  
  while (page <= totalPages && page <= maxPages) {
    const response = await fetch(`https://marvelrivalsapi.com/api/v2/players/leaderboard?page=${page}&limit=100`, {
      headers: { "x-api-key": apiKey }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard (${response.status})`)
    }
    const data = await response.json()
    const players = Array.isArray(data?.players) ? data.players : []
    const offset = (page - 1) * players.length
    
    players.forEach((player: any, index: number) => {
      const rankData = player.rank?.rank
      const rankLabel = typeof rankData === 'object' && rankData !== null ? rankData.rank : undefined
      const rankColor = typeof rankData === 'object' && rankData !== null ? rankData.color : undefined
      const rankImage = typeof rankData === 'object' && rankData !== null ? rankData.image : undefined
      const iconData = player.icon
      const playerIcon = typeof iconData === 'object' && iconData !== null 
        ? (iconData.player_icon ?? iconData.player_icon_id)
        : undefined
      
      aggregated.push({
        uid: String(player.uid ?? `player-${page}-${index}`),
        name: player.name ?? 'Unknown Player',
        score: Number(player.score) || 0,
        rank_score: typeof player.rank?.rank_score === 'number' ? player.rank.rank_score : undefined,
        rank_label: rankLabel,
        rank_color: rankColor,
        rank_image: rankImage,
        win_rate: player.rank?.win_rate ?? undefined,
        win_count: typeof player.rank?.win_count === 'number' ? player.rank.win_count : undefined,
        battle_count: typeof player.rank?.battle_count === 'number' ? player.rank.battle_count : undefined,
        level: typeof player.rank?.level === 'number' ? player.rank.level : undefined,
        season_max_level: typeof player.rank?.season_max_level === 'number' ? player.rank.season_max_level : undefined,
        max_level: typeof player.rank?.max_level === 'number' ? player.rank.max_level : undefined,
        protect_score: typeof player.rank?.protect_score === 'number' ? player.rank.protect_score : undefined,
        diff_score: typeof player.rank?.diff_score === 'number' ? player.rank.diff_score : undefined,
        max_rank_score: typeof player.rank?.max_rank_score === 'number' ? player.rank.max_rank_score : undefined,
        season_number: typeof player.rank?.season_number === 'number' ? player.rank.season_number : undefined,
        player_icon: playerIcon,
        rank_position: offset + index + 1,
        raw: player
      })
    })
    
    totalPages = Number(data?.total_pages) || 1
    page += 1
  }
  
  return aggregated
}

