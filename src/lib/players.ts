import pool, { runQuery } from "@/lib/mysql"

export interface PlayerRecord {
  uid: string
  name: string
  player_icon?: string
  player_icon_id?: string
  login_os?: string
  level?: number
  rank_label?: string
  rank_color?: string
  rank_score?: string
  max_level?: number
  max_rank_score?: string
  win_count?: number
  protect_score?: number
  diff_score?: string
  raw_json?: unknown
  stats_json?: unknown
  full_profile_json?: unknown
  updated_at?: Date
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players_cache (
      uid VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      player_icon VARCHAR(512),
      player_icon_id VARCHAR(64),
      login_os VARCHAR(32),
      level INT,
      rank_label VARCHAR(255),
      rank_color VARCHAR(64),
      rank_score DECIMAL(20, 2),
      max_level INT,
      max_rank_score DECIMAL(20, 2),
      win_count INT,
      protect_score DECIMAL(20, 2),
      diff_score DECIMAL(20, 2),
      raw_json JSON,
      stats_json JSON,
      full_profile_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_updated_at (updated_at)
    )
  `)
  
  try {
    await pool.query(`ALTER TABLE players_cache ADD COLUMN full_profile_json JSON`)
  } catch {}
}

export const getPlayerByUid = async (uid: string): Promise<PlayerRecord | null> => {
  await ensureTable()
  const rows = await runQuery<PlayerRecord[]>(
    `SELECT * FROM players_cache WHERE uid = ?`,
    [uid]
  )
  return rows.length > 0 ? rows[0] : null
}

export const getPlayerByName = async (name: string): Promise<PlayerRecord | null> => {
  await ensureTable()
  const rows = await runQuery<PlayerRecord[]>(
    `SELECT * FROM players_cache WHERE name = ? LIMIT 1`,
    [name]
  )
  return rows.length > 0 ? rows[0] : null
}

export const searchPlayer = async (query: string): Promise<PlayerRecord[]> => {
  await ensureTable()
  const rows = await runQuery<PlayerRecord[]>(
    `SELECT * FROM players_cache WHERE name LIKE ? OR uid LIKE ? LIMIT 10`,
    [`%${query}%`, `%${query}%`]
  )
  return rows
}

export const getAllPlayers = async (): Promise<PlayerRecord[]> => {
  await ensureTable()
  const rows = await runQuery<PlayerRecord[]>(
    `SELECT * FROM players_cache ORDER BY updated_at DESC`
  )
  return rows
}

export const getPlayerCount = async (): Promise<number> => {
  await ensureTable()
  const rows = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM players_cache`
  )
  return rows[0]?.count || 0
}

export const savePlayer = async (player: PlayerRecord): Promise<void> => {
  await ensureTable()
  
  const existingPlayer = await getPlayerByUid(player.uid)
  
  const playerData = {
    uid: player.uid,
    name: player.name || existingPlayer?.name || null,
    player_icon: player.player_icon || existingPlayer?.player_icon || null,
    player_icon_id: player.player_icon_id || existingPlayer?.player_icon_id || null,
    login_os: player.login_os || existingPlayer?.login_os || null,
    level: player.level !== null && player.level !== undefined ? player.level : existingPlayer?.level || null,
    rank_label: player.rank_label || existingPlayer?.rank_label || null,
    rank_color: player.rank_color || existingPlayer?.rank_color || null,
    rank_score: player.rank_score ? parseFloat(player.rank_score.toString()) : (existingPlayer?.rank_score ? parseFloat(existingPlayer.rank_score.toString()) : null),
    max_level: player.max_level !== null && player.max_level !== undefined ? player.max_level : existingPlayer?.max_level || null,
    max_rank_score: player.max_rank_score ? parseFloat(player.max_rank_score.toString()) : (existingPlayer?.max_rank_score ? parseFloat(existingPlayer.max_rank_score.toString()) : null),
    win_count: player.win_count !== null && player.win_count !== undefined ? player.win_count : existingPlayer?.win_count || null,
    protect_score: player.protect_score !== null && player.protect_score !== undefined ? player.protect_score : existingPlayer?.protect_score || null,
    diff_score: player.diff_score ? parseFloat(player.diff_score.toString()) : (existingPlayer?.diff_score ? parseFloat(existingPlayer.diff_score.toString()) : null),
    raw_json: player.raw_json ? JSON.stringify(player.raw_json) : (existingPlayer?.raw_json ? JSON.stringify(existingPlayer.raw_json) : null),
    stats_json: player.stats_json ? JSON.stringify(player.stats_json) : (existingPlayer?.stats_json ? JSON.stringify(existingPlayer.stats_json) : null),
    full_profile_json: player.full_profile_json ? JSON.stringify(player.full_profile_json) : (existingPlayer?.full_profile_json ? JSON.stringify(existingPlayer.full_profile_json) : null)
  }

  await pool.query(`
    INSERT INTO players_cache (
      uid, name, player_icon, player_icon_id, login_os, level,
      rank_label, rank_color, rank_score, max_level, max_rank_score,
      win_count, protect_score, diff_score, raw_json, stats_json, full_profile_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = COALESCE(VALUES(name), name),
      player_icon = COALESCE(VALUES(player_icon), player_icon),
      player_icon_id = COALESCE(VALUES(player_icon_id), player_icon_id),
      login_os = COALESCE(VALUES(login_os), login_os),
      level = COALESCE(VALUES(level), level),
      rank_label = COALESCE(VALUES(rank_label), rank_label),
      rank_color = COALESCE(VALUES(rank_color), rank_color),
      rank_score = COALESCE(VALUES(rank_score), rank_score),
      max_level = COALESCE(VALUES(max_level), max_level),
      max_rank_score = COALESCE(VALUES(max_rank_score), max_rank_score),
      win_count = COALESCE(VALUES(win_count), win_count),
      protect_score = COALESCE(VALUES(protect_score), protect_score),
      diff_score = COALESCE(VALUES(diff_score), diff_score),
      raw_json = COALESCE(VALUES(raw_json), raw_json),
      stats_json = COALESCE(VALUES(stats_json), stats_json),
      full_profile_json = COALESCE(VALUES(full_profile_json), full_profile_json),
      updated_at = CURRENT_TIMESTAMP
  `, [
    playerData.uid,
    playerData.name,
    playerData.player_icon,
    playerData.player_icon_id,
    playerData.login_os,
    playerData.level,
    playerData.rank_label,
    playerData.rank_color,
    playerData.rank_score,
    playerData.max_level,
    playerData.max_rank_score,
    playerData.win_count,
    playerData.protect_score,
    playerData.diff_score,
    playerData.raw_json,
    playerData.stats_json,
    playerData.full_profile_json
  ])
}

export const savePlayerStats = async (uid: string, stats: unknown): Promise<void> => {
  await ensureTable()
  
  await pool.query(`
    UPDATE players_cache
    SET stats_json = ?,
        full_profile_json = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE uid = ?
  `, [JSON.stringify(stats), JSON.stringify(stats), uid])
}

export const saveFullPlayerProfile = async (uid: string, fullProfile: unknown): Promise<void> => {
  await ensureTable()
  
  const profileJson = typeof fullProfile === 'string' ? fullProfile : JSON.stringify(fullProfile)
  
  await pool.query(`
    UPDATE players_cache
    SET full_profile_json = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE uid = ?
  `, [profileJson, uid])
}

export const fetchPlayerFromApi = async (query: string, apiKey: string): Promise<any> => {
  const API_BASE = 'https://marvelrivalsapi.com/api/v1'
  const response = await fetch(
    `${API_BASE}/find-player/${encodeURIComponent(query)}`,
    {
      headers: {
        'x-api-key': apiKey
      }
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`API Error: ${response.status}`)
  }

  const data = await response.json()
  
  if (Array.isArray(data) && data.length > 0) {
    return data[0]
  } else if (data.uid || data.name || data.player_uid || data.info) {
    return data
  } else if (data.player) {
    return data.player
  } else if (data.data) {
    return Array.isArray(data.data) ? data.data[0] : data.data
  }
  
  return data
}

export const fetchPlayerStatsFromApi = async (uid: string, apiKey: string): Promise<any> => {
  const API_BASE = 'https://marvelrivalsapi.com/api/v1'
  const API_BASE_V2 = 'https://marvelrivalsapi.com/api/v2'
  
  const isConsolePlayer = uid.length <= 9
  const endpointOrder = isConsolePlayer
    ? [`${API_BASE}/player/${uid}`, `${API_BASE_V2}/player/${uid}`]
    : [`${API_BASE_V2}/player/${uid}`, `${API_BASE}/player/${uid}`]
  
  let lastError: Error | null = null
  let has403 = false
  
  for (const endpoint of endpointOrder) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'x-api-key': apiKey }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`fetchPlayerStatsFromApi success from ${endpoint}:`, {
          uid,
          isConsolePlayer,
          hasOverallStats: !!data.overall_stats,
          hasRolesPlayed: !!data.overall_stats?.roles_played,
          overallStatsKeys: data.overall_stats ? Object.keys(data.overall_stats) : [],
          dataKeys: Object.keys(data)
        })
        return data
      }

      if (response.status === 403) {
        has403 = true
        console.log(`fetchPlayerStatsFromApi 403 from ${endpoint}, trying next...`)
        continue
      }

      if (response.status === 404) {
        console.log(`fetchPlayerStatsFromApi 404 from ${endpoint}, trying next...`)
        continue
      }

      lastError = new Error(`API Error: ${response.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error')
      console.warn(`fetchPlayerStatsFromApi error from ${endpoint}:`, lastError.message)
      continue
    }
  }

  if (has403) {
    const error = new Error('403: Player profile is private')
    ;(error as any).isPrivate = true
    throw error
  }

  if (lastError) {
    throw lastError
  }

  return null
}

