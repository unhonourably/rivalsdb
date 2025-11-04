import pool, { runQuery } from "@/lib/mysql"

export interface BattlePassItemRecord {
  name?: string
  image?: string
  cost?: string | number
  isLuxury?: boolean
  raw?: unknown
}

export interface BattlePassSeasonRecord {
  season: number
  season_name?: string
  items: BattlePassItemRecord[]
  raw?: unknown
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS battle_pass_seasons (
      season INT PRIMARY KEY,
      season_name VARCHAR(255),
      items_json JSON,
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

const normalizeItem = (item: Record<string, unknown>): BattlePassItemRecord => ({
  name: typeof item.name === "string" ? item.name : undefined,
  image: typeof item.image === "string" ? item.image : undefined,
  cost: typeof item.cost === "number" || typeof item.cost === "string" ? item.cost : undefined,
  isLuxury: Boolean(item.isLuxury ?? item.luxury ?? item.is_luxury ?? false),
  raw: item
})

const normalizeSeason = (payload: Record<string, unknown>): BattlePassSeasonRecord | null => {
  const season = Number(payload.season ?? payload.season_id)
  if (!Number.isFinite(season)) {
    return null
  }
  const itemsArray = Array.isArray(payload.items) ? payload.items : []
  const items = itemsArray
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map(normalizeItem)

  return {
    season,
    season_name: typeof payload.season_name === "string" ? payload.season_name : undefined,
    items,
    raw: payload
  }
}

const extractSeasons = (payload: unknown): BattlePassSeasonRecord[] => {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map(normalizeSeason)
      .filter((entry): entry is BattlePassSeasonRecord => Boolean(entry))
  }
  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.data)) {
      return extractSeasons(record.data)
    }
    const direct = normalizeSeason(record)
    return direct ? [direct] : []
  }
  return []
}

export const saveBattlePassSeasons = async (seasons: BattlePassSeasonRecord[]) => {
  if (seasons.length === 0) return
  await ensureTable()
  const values = seasons.map((season) => [
    season.season,
    season.season_name ?? null,
    JSON.stringify(season.items ?? []),
    season.raw ? JSON.stringify(season.raw) : null
  ])
  const placeholders = values.map(() => "(?, ?, JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'))").join(",")
  await pool.query(
    `INSERT INTO battle_pass_seasons (season, season_name, items_json, raw_json)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       season_name = VALUES(season_name),
       items_json = VALUES(items_json),
       raw_json = VALUES(raw_json)`,
    values.flat()
  )
}

export const getBattlePassSeason = async (season?: number) => {
  await ensureTable()
  let rows: Array<{
    season: number
    season_name: string | null
    items_json: unknown
    raw_json: unknown
  }>
  if (season && Number.isFinite(season)) {
    rows = await runQuery(
      `SELECT season, season_name, items_json, raw_json FROM battle_pass_seasons WHERE season = ? LIMIT 1`,
      [season]
    )
  } else {
    rows = await runQuery(
      `SELECT season, season_name, items_json, raw_json FROM battle_pass_seasons ORDER BY season DESC LIMIT 1`
    )
  }
  if (!rows.length) return null
  const row = rows[0]
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
    season: row.season,
    season_name: row.season_name ?? undefined,
    items: parseJsonField(row.items_json) as BattlePassItemRecord[] ?? [],
    raw: parseJsonField(row.raw_json)
  } as BattlePassSeasonRecord
}

export const getBattlePassSeasons = async () => {
  await ensureTable()
  const rows = await runQuery<Array<{
    season: number
    season_name: string | null
    items_json: unknown
    raw_json: unknown
  }>>(`SELECT season, season_name, items_json, raw_json FROM battle_pass_seasons ORDER BY season ASC`)
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
  return rows.map((row) => ({
    season: row.season,
    season_name: row.season_name ?? undefined,
    items: parseJsonField(row.items_json) as BattlePassItemRecord[] ?? [],
    raw: parseJsonField(row.raw_json)
  }) as BattlePassSeasonRecord)
}

export const fetchBattlePassFromApi = async (): Promise<BattlePassSeasonRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const response = await fetch("https://marvelrivalsapi.com/api/v1/battlepass", {
    headers: { "x-api-key": apiKey }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch battle pass seasons (${response.status})`)
  }
  const payload = await response.json()
  return extractSeasons(payload)
}

export const fetchBattlePassSeasonFromApi = async (season: number) => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const response = await fetch(`https://marvelrivalsapi.com/api/v1/battlepass?season=${season}`, {
    headers: { "x-api-key": apiKey }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch battle pass season ${season} (${response.status})`)
  }
  const payload = await response.json()
  const seasons = extractSeasons(payload)
  return seasons.find((entry) => entry.season === season) ?? null
}

