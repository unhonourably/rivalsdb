import pool from './mysql'

export interface MatchHistoryRecord {
  match_uid: string
  player_uid: number
  map_id: number
  map_thumbnail?: string
  map_name?: string
  duration?: number
  season?: number
  winner_side?: number
  mvp_uid?: number
  svp_uid?: number
  match_time_stamp: number
  play_mode_id?: number
  game_mode_id?: number
  score_info?: Record<string, number>
  player_performance?: {
    player_uid: number
    hero_id: number
    hero_name: string
    hero_type: string
    kills: number
    deaths: number
    assists: number
    is_win: { score: number; is_win: boolean }
    disconnected: boolean
    camp: number
    score_change: number
    level: number
    new_level: number
    new_score: number
  }
  raw?: unknown
  created_at?: Date
}

const ensureMatchHistoryTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_history (
      match_uid VARCHAR(64) NOT NULL,
      player_uid BIGINT NOT NULL,
      map_id INT,
      map_thumbnail VARCHAR(512),
      map_name VARCHAR(255),
      duration INT,
      season INT,
      winner_side INT,
      mvp_uid BIGINT,
      svp_uid BIGINT,
      match_time_stamp BIGINT NOT NULL,
      play_mode_id INT,
      game_mode_id INT,
      score_info JSON,
      player_performance JSON,
      raw_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (match_uid, player_uid),
      INDEX idx_player_uid (player_uid),
      INDEX idx_match_time (player_uid, match_time_stamp DESC)
    )
  `)
}

export const getMatchHistory = async (playerUid: number): Promise<MatchHistoryRecord[]> => {
  await ensureMatchHistoryTable()
  
  const rows = await pool.query<Array<{
    match_uid: string
    player_uid: number
    map_id: number | null
    map_thumbnail: string | null
    map_name: string | null
    duration: number | null
    season: number | null
    winner_side: number | null
    mvp_uid: number | null
    svp_uid: number | null
    match_time_stamp: number
    play_mode_id: number | null
    game_mode_id: number | null
    score_info: unknown
    player_performance: unknown
    raw_json: unknown
    created_at: Date
  }>>('SELECT * FROM match_history WHERE player_uid = ? ORDER BY match_time_stamp DESC', [playerUid])
  
  const [matches] = rows
  
  return matches.map(row => ({
    match_uid: row.match_uid,
    player_uid: row.player_uid,
    map_id: row.map_id ?? 0,
    map_thumbnail: row.map_thumbnail ?? undefined,
    map_name: row.map_name ?? undefined,
    duration: row.duration ?? undefined,
    season: row.season ?? undefined,
    winner_side: row.winner_side ?? undefined,
    mvp_uid: row.mvp_uid ?? undefined,
    svp_uid: row.svp_uid ?? undefined,
    match_time_stamp: row.match_time_stamp,
    play_mode_id: row.play_mode_id ?? undefined,
    game_mode_id: row.game_mode_id ?? undefined,
    score_info: parseJsonField(row.score_info),
    player_performance: parseJsonField(row.player_performance),
    raw: parseJsonField(row.raw_json),
    created_at: row.created_at
  }))
}

export const saveMatchHistory = async (playerUid: number, matches: MatchHistoryRecord[]) => {
  if (matches.length === 0) return
  
  await ensureMatchHistoryTable()
  
  for (const match of matches) {
    const values = [
      match.match_uid,
      playerUid,
      match.map_id ?? null,
      match.map_thumbnail ?? null,
      match.map_name ?? null,
      match.duration ?? null,
      match.season ?? null,
      match.winner_side ?? null,
      match.mvp_uid ?? null,
      match.svp_uid ?? null,
      match.match_time_stamp,
      match.play_mode_id ?? null,
      match.game_mode_id ?? null,
      match.score_info ? JSON.stringify(match.score_info) : null,
      match.player_performance ? JSON.stringify(match.player_performance) : null,
      match.raw ? JSON.stringify(match.raw) : null
    ]
    
    await pool.query(
      `INSERT INTO match_history 
        (match_uid, player_uid, map_id, map_thumbnail, map_name, duration, season, winner_side, 
         mvp_uid, svp_uid, match_time_stamp, play_mode_id, game_mode_id, score_info, 
         player_performance, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         map_thumbnail = VALUES(map_thumbnail),
         map_name = VALUES(map_name),
         duration = VALUES(duration),
         season = VALUES(season),
         winner_side = VALUES(winner_side),
         mvp_uid = VALUES(mvp_uid),
         svp_uid = VALUES(svp_uid),
         play_mode_id = VALUES(play_mode_id),
         game_mode_id = VALUES(game_mode_id),
         score_info = VALUES(score_info),
         player_performance = VALUES(player_performance),
         raw_json = VALUES(raw_json)`,
      values
    )
  }
}

export const fetchMatchHistoryFromApi = async (playerUid: number): Promise<MatchHistoryRecord[] | null> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  
  try {
    const response = await fetch(`https://marvelrivalsapi.com/api/v1/player/${playerUid}`, {
      headers: { "x-api-key": apiKey },
      cache: 'no-store'
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const matchHistory = data?.match_history || data?.player?.match_history
    
    if (!Array.isArray(matchHistory)) return null
    
    return matchHistory.map((match: any) => ({
      match_uid: String(match.match_uid),
      player_uid: playerUid,
      map_id: match.map_id,
      map_thumbnail: match.map_thumbnail,
      map_name: match.map_name,
      duration: match.duration,
      season: match.season,
      winner_side: match.winner_side,
      mvp_uid: match.mvp_uid,
      svp_uid: match.svp_uid,
      match_time_stamp: match.match_time_stamp,
      play_mode_id: match.play_mode_id,
      game_mode_id: match.game_mode_id,
      score_info: match.score_info,
      player_performance: match.player_performance,
      raw: match
    }))
  } catch (error) {
    console.error('Error fetching match history from API:', error)
    return null
  }
}

const parseJsonField = (value: unknown) => {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  if (typeof value === 'object') return value
  return undefined
}

