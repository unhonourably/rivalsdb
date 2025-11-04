import pool, { runQuery } from "@/lib/mysql"

export interface AchievementTierRecord {
  tier?: number
  requirement?: string
  reward?: string
  description?: string
}

export interface AchievementRecord {
  id: string
  name: string
  description?: string
  category?: string
  icon?: string
  rarity?: string
  points?: number
  tiers?: AchievementTierRecord[]
}

export interface AchievementQueryOptions {
  search?: string
  category?: string
  limit?: number
  page?: number
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(255),
      icon VARCHAR(512),
      rarity VARCHAR(255),
      points INT,
      tiers_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export const getAllAchievements = async (): Promise<AchievementRecord[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    id: string
    name: string
    description: string | null
    category: string | null
    icon: string | null
    rarity: string | null
    points: number | null
    tiers_json: unknown
  }>>("SELECT id, name, description, category, icon, rarity, points, tiers_json FROM achievements ORDER BY name ASC")
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    icon: row.icon ?? undefined,
    rarity: row.rarity ?? undefined,
    points: row.points ?? undefined,
    tiers: typeof row.tiers_json === "string"
      ? JSON.parse(row.tiers_json)
      : row.tiers_json && typeof row.tiers_json === "object"
        ? (row.tiers_json as AchievementTierRecord[])
        : undefined
  }))
}

export const saveAchievements = async (items: AchievementRecord[]) => {
  if (items.length === 0) return
  await ensureTable()
  const values = items.map((item) => [
    item.id,
    item.name,
    item.description ?? null,
    item.category ?? null,
    item.icon ?? null,
    item.rarity ?? null,
    item.points ?? null,
    item.tiers ? JSON.stringify(item.tiers) : null
  ])

  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
  await pool.query(
    `INSERT INTO achievements (id, name, description, category, icon, rarity, points, tiers_json)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       category = VALUES(category),
       icon = VALUES(icon),
       rarity = VALUES(rarity),
       points = VALUES(points),
       tiers_json = VALUES(tiers_json)`
    , values.flat()
  )
}

export const getAchievementsPage = async ({ search, category, limit = 24, page = 1 }: AchievementQueryOptions) => {
  await ensureTable()
  const filters: string[] = []
  const params: Array<string | number> = []
  if (search) {
    const term = `%${search.toLowerCase()}%`
    filters.push("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)")
    params.push(term, term)
  }
  if (category) {
    filters.push("LOWER(category) = ?")
    params.push(category.toLowerCase())
  }
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safePage = Math.max(page, 1)
  const offset = (safePage - 1) * safeLimit
  const rows = await runQuery<Array<{
    id: string
    name: string
    description: string | null
    category: string | null
    icon: string | null
    rarity: string | null
    points: number | null
    tiers_json: unknown
  }>>(
    `SELECT id, name, description, category, icon, rarity, points, tiers_json FROM achievements ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  )
  const countResult = await runQuery<Array<{ total: number }>>(
    `SELECT COUNT(*) AS total FROM achievements ${whereClause}`,
    params
  )
  const total = countResult[0]?.total ?? 0
  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      icon: row.icon ?? undefined,
      rarity: row.rarity ?? undefined,
      points: row.points ?? undefined,
      tiers: typeof row.tiers_json === "string"
        ? JSON.parse(row.tiers_json)
        : row.tiers_json && typeof row.tiers_json === "object"
          ? (row.tiers_json as AchievementTierRecord[])
          : undefined
    })),
    total,
    limit: safeLimit,
    page: safePage
  }
}

export const getAchievementCategories = async (): Promise<string[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{ category: string | null }>>(
    "SELECT DISTINCT category FROM achievements WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC"
  )
  return rows
    .map((row) => row.category?.trim())
    .filter((value): value is string => Boolean(value))
}

const normalizeArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (!value) return []
  return [value as T]
}

export const fetchAchievementsFromApi = async (): Promise<AchievementRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const aggregated: AchievementRecord[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await fetch(`https://marvelrivalsapi.com/api/v1/achievements?page=${page}&limit=100`, {
      headers: { "x-api-key": apiKey }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch achievements (${response.status})`)
    }
    const data = await response.json()
    const list = normalizeArray<AchievementRecord>(data?.achievements ?? data?.data ?? data)
    list.forEach((item) => {
      const id = String((item as any).id ?? `${(item as any).name ?? ""}-${(item as any).category ?? ""}`)
      aggregated.push({
        id,
        name: String((item as any).name ?? id),
        description: (item as any).description ?? (item as any).mission ?? undefined,
        category: (item as any).category ?? undefined,
        icon: (item as any).icon ?? undefined,
        rarity: (item as any).rarity ?? undefined,
        points: typeof (item as any).points === "number" ? (item as any).points : Number((item as any).points) || undefined,
        tiers: normalizeArray<AchievementTierRecord>((item as any).tiers ?? [])
      })
    })

    const reportedPages = Number(data?.total_pages)
    const reportedCount = Number(data?.total_achievements)
    if (Number.isFinite(reportedPages) && reportedPages > 0) {
      totalPages = reportedPages
    } else if (Number.isFinite(reportedCount) && list.length > 0) {
      totalPages = Math.ceil(reportedCount / list.length)
    } else {
      totalPages = page
    }
    page += 1
  }

  const unique = new Map<string, AchievementRecord>()
  aggregated.forEach((item) => {
    unique.set(item.id, item)
  })
  return Array.from(unique.values())
}

