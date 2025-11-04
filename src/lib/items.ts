import pool, { runQuery } from "@/lib/mysql"

export interface ItemRecord {
  id: string
  name?: string
  description?: string
  long_description?: string
  summary?: string
  category?: string
  type?: string
  item_type?: string
  slot?: string
  group_name?: string
  collection?: string
  rarity?: string
  tier?: string
  quality?: string
  grade?: string
  cost_label?: string
  currency?: string
  unlock_condition?: string
  requirement?: string
  icon?: string
  image?: string
  icon_url?: string
  thumbnail?: string
  stats?: unknown
  attributes?: unknown
  effects?: unknown
  bonuses?: unknown
  passives?: unknown
  details?: unknown
  raw?: unknown
  categoryLabel?: string
  typeLabel?: string
  rarityLabel?: string
  searchText?: string
}

export interface ItemQueryOptions {
  search?: string
  category?: string
  limit?: number
  page?: number
}

const toTitleCase = (value: string | undefined | null): string | undefined => {
  if (!value) return undefined
  return value
    .toLowerCase()
    .split(" ")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const firstValue = (item: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const candidate = item[key]
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate
  }
  return undefined
}

const normalizeCost = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined
  if (typeof value === "number") return value.toString()
  if (typeof value === "string" && value.trim() !== "") return value
  return undefined
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id VARCHAR(128) PRIMARY KEY,
      name VARCHAR(255),
      description TEXT,
      long_description TEXT,
      summary TEXT,
      category VARCHAR(255),
      type VARCHAR(255),
      item_type VARCHAR(255),
      slot VARCHAR(255),
      group_name VARCHAR(255),
      collection VARCHAR(255),
      rarity VARCHAR(255),
      tier VARCHAR(255),
      quality VARCHAR(255),
      grade VARCHAR(255),
      cost_label VARCHAR(255),
      currency VARCHAR(255),
      unlock_condition TEXT,
      requirement TEXT,
      icon VARCHAR(512),
      image VARCHAR(512),
      icon_url VARCHAR(512),
      thumbnail VARCHAR(512),
      stats_json JSON,
      attributes_json JSON,
      effects_json JSON,
      bonuses_json JSON,
      passives_json JSON,
      details_json JSON,
      raw_json JSON,
      category_label VARCHAR(255),
      type_label VARCHAR(255),
      rarity_label VARCHAR(255),
      search_text TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

const mapRow = (row: {
  id: string
  name: string | null
  description: string | null
  long_description: string | null
  summary: string | null
  category: string | null
  type: string | null
  item_type: string | null
  slot: string | null
  group_name: string | null
  collection: string | null
  rarity: string | null
  tier: string | null
  quality: string | null
  grade: string | null
  cost_label: string | null
  currency: string | null
  unlock_condition: string | null
  requirement: string | null
  icon: string | null
  image: string | null
  icon_url: string | null
  thumbnail: string | null
  stats_json: unknown
  attributes_json: unknown
  effects_json: unknown
  bonuses_json: unknown
  passives_json: unknown
  details_json: unknown
  raw_json: unknown
  category_label: string | null
  type_label: string | null
  rarity_label: string | null
  search_text: string | null
}): ItemRecord => {
  const parseJson = (value: unknown) => {
    if (!value) return undefined
    if (typeof value === "string") {
      try {
        return JSON.parse(value)
      } catch (error) {
        return undefined
      }
    }
    return value
  }
  const raw = parseJson(row.raw_json)
  const record: ItemRecord = {
    id: row.id,
    name: row.name ?? undefined,
    description: row.description ?? undefined,
    long_description: row.long_description ?? undefined,
    summary: row.summary ?? undefined,
    category: row.category ?? undefined,
    type: row.type ?? undefined,
    item_type: row.item_type ?? undefined,
    slot: row.slot ?? undefined,
    group_name: row.group_name ?? undefined,
    collection: row.collection ?? undefined,
    rarity: row.rarity ?? undefined,
    tier: row.tier ?? undefined,
    quality: row.quality ?? undefined,
    grade: row.grade ?? undefined,
    cost_label: row.cost_label ?? undefined,
    currency: row.currency ?? undefined,
    unlock_condition: row.unlock_condition ?? undefined,
    requirement: row.requirement ?? undefined,
    icon: row.icon ?? undefined,
    image: row.image ?? undefined,
    icon_url: row.icon_url ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    stats: parseJson(row.stats_json),
    attributes: parseJson(row.attributes_json),
    effects: parseJson(row.effects_json),
    bonuses: parseJson(row.bonuses_json),
    passives: parseJson(row.passives_json),
    details: parseJson(row.details_json),
    raw,
    categoryLabel: row.category_label ?? undefined,
    typeLabel: row.type_label ?? undefined,
    rarityLabel: row.rarity_label ?? undefined,
    searchText: row.search_text ?? undefined
  }
  if (raw && typeof raw === "object") {
    const source = raw as Record<string, unknown>
    record.cost_label = record.cost_label ?? normalizeCost(firstValue(source, ["cost", "price", "shop_price", "purchase_cost", "credit_cost"]))
    record.currency = record.currency ?? (typeof source.currency === "string" ? source.currency : undefined)
  }
  return record
}

export const saveItems = async (items: ItemRecord[]) => {
  if (items.length === 0) return
  await ensureTable()
  const values = items.map(item => {
    const raw = item.raw && typeof item.raw === "object" ? item.raw : undefined
    const base: Record<string, unknown> = raw ? (raw as Record<string, unknown>) : {}
    const categoryLabel = item.categoryLabel ?? toTitleCase(firstValue(base, ["category", "group", "collection", "slot", "type", "item_type"]))
    const typeLabel = item.typeLabel ?? toTitleCase(firstValue(base, ["type", "item_type", "slot"]))
    const rarityLabel = item.rarityLabel ?? toTitleCase(firstValue(base, ["rarity", "tier", "quality", "grade"]))
    const costLabel = item.cost_label ?? normalizeCost(firstValue(base, ["cost", "price", "shop_price", "purchase_cost", "credit_cost"]))
    const searchParts = [
      item.name,
      item.description,
      item.long_description,
      item.summary,
      categoryLabel,
      typeLabel,
      rarityLabel
    ].filter(Boolean)
    const searchText = searchParts.join(" ").toLowerCase()
    return [
      item.id,
      item.name ?? null,
      item.description ?? null,
      item.long_description ?? null,
      item.summary ?? null,
      item.category ?? null,
      item.type ?? null,
      item.item_type ?? null,
      item.slot ?? null,
      item.group_name ?? null,
      item.collection ?? null,
      item.rarity ?? null,
      item.tier ?? null,
      item.quality ?? null,
      item.grade ?? null,
      costLabel ?? null,
      item.currency ?? null,
      item.unlock_condition ?? null,
      item.requirement ?? null,
      item.icon ?? null,
      item.image ?? null,
      item.icon_url ?? null,
      item.thumbnail ?? null,
      item.stats ? JSON.stringify(item.stats) : null,
      item.attributes ? JSON.stringify(item.attributes) : null,
      item.effects ? JSON.stringify(item.effects) : null,
      item.bonuses ? JSON.stringify(item.bonuses) : null,
      item.passives ? JSON.stringify(item.passives) : null,
      item.details ? JSON.stringify(item.details) : null,
      raw ? JSON.stringify(raw) : null,
      categoryLabel ?? null,
      typeLabel ?? null,
      rarityLabel ?? null,
      searchText
    ]
  })
  const chunkSize = 100
  for (let index = 0; index < values.length; index += chunkSize) {
    const chunk = values.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'), ?, ?, ?, ?)").join(",")
    await pool.query(
      `INSERT INTO items (
        id, name, description, long_description, summary, category, type, item_type, slot, group_name, collection, rarity, tier, quality, grade, cost_label,
        currency, unlock_condition, requirement, icon, image, icon_url, thumbnail,
        stats_json, attributes_json, effects_json, bonuses_json, passives_json, details_json, raw_json,
        category_label, type_label, rarity_label, search_text
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        long_description = VALUES(long_description),
        summary = VALUES(summary),
        category = VALUES(category),
        type = VALUES(type),
        item_type = VALUES(item_type),
        slot = VALUES(slot),
        group_name = VALUES(group_name),
        collection = VALUES(collection),
        rarity = VALUES(rarity),
        tier = VALUES(tier),
        quality = VALUES(quality),
        grade = VALUES(grade),
        cost_label = VALUES(cost_label),
        currency = VALUES(currency),
        unlock_condition = VALUES(unlock_condition),
        requirement = VALUES(requirement),
        icon = VALUES(icon),
        image = VALUES(image),
        icon_url = VALUES(icon_url),
        thumbnail = VALUES(thumbnail),
        stats_json = VALUES(stats_json),
        attributes_json = VALUES(attributes_json),
        effects_json = VALUES(effects_json),
        bonuses_json = VALUES(bonuses_json),
        passives_json = VALUES(passives_json),
        details_json = VALUES(details_json),
        raw_json = VALUES(raw_json),
        category_label = VALUES(category_label),
        type_label = VALUES(type_label),
        rarity_label = VALUES(rarity_label),
        search_text = VALUES(search_text)
      `,
      chunk.flat()
    )
  }
}

type DbRow = Parameters<typeof mapRow>[0]

export const getItemsPage = async ({ search, category, limit = 30, page = 1 }: ItemQueryOptions) => {
  await ensureTable()
  const filters: string[] = []
  const params: Array<string | number> = []
  if (search) {
    const term = `%${search.toLowerCase()}%`
    filters.push("search_text LIKE ?")
    params.push(term)
  }
  if (category) {
    filters.push("LOWER(category_label) = ?")
    params.push(category.toLowerCase())
  }
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safePage = Math.max(page, 1)
  const offset = (safePage - 1) * safeLimit
  const rows = await runQuery<DbRow[]>(
    `SELECT
      id, name, description, long_description, summary, category, type, item_type, slot, group_name, collection,
      rarity, tier, quality, grade, cost_label, currency, unlock_condition, requirement, icon, image, icon_url, thumbnail,
      stats_json, attributes_json, effects_json, bonuses_json, passives_json, details_json, raw_json,
      category_label, type_label, rarity_label, search_text
    FROM items
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  )
  const count = await runQuery<Array<{ total: number }>>(
    `SELECT COUNT(*) AS total FROM items ${whereClause}`,
    params
  )
  const total = count[0]?.total ?? 0
  const mapped = rows.map(mapRow)
  return {
    rows: mapped,
    total,
    limit: safeLimit,
    page: safePage
  }
}

export const getItemCategories = async (): Promise<string[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{ category_label: string | null }>>(
    "SELECT DISTINCT category_label FROM items WHERE category_label IS NOT NULL AND category_label <> '' ORDER BY category_label ASC"
  )
  return rows
    .map(row => row.category_label?.trim())
    .filter((value): value is string => Boolean(value))
}

const gatherPages = <T>(value: unknown, fallback: T[]): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (!value) return fallback
  return fallback
}

export const fetchItemsFromApi = async (): Promise<ItemRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const aggregated: ItemRecord[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const response = await fetch(`https://marvelrivalsapi.com/api/v1/items?page=${page}&limit=100`, {
      headers: { "x-api-key": apiKey }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch items (${response.status})`)
    }
    const data = await response.json()
    const list = gatherPages<Record<string, unknown>>(data?.items, gatherPages<Record<string, unknown>>(data?.data, Array.isArray(data) ? data : []))
    list.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return
      const itemData = entry as Record<string, unknown>
      const idSource = itemData.id ?? itemData.item_id ?? itemData.slug ?? `${itemData.name ?? "item"}-${page}-${index}`
      const id = String(idSource)
      const categoryLabel = toTitleCase(firstValue(itemData, ["category", "group", "collection", "slot", "type", "item_type"]))
      const typeLabel = toTitleCase(firstValue(itemData, ["type", "item_type", "slot"]))
      const rarityLabel = toTitleCase(firstValue(itemData, ["rarity", "tier", "quality", "grade"]))
      const costLabel = normalizeCost(firstValue(itemData, ["cost", "price", "shop_price", "purchase_cost", "credit_cost"]))
      aggregated.push({
        id,
        name: typeof itemData.name === "string" ? itemData.name : undefined,
        description: typeof itemData.description === "string" ? itemData.description : undefined,
        long_description: typeof itemData.long_description === "string" ? itemData.long_description : undefined,
        summary: typeof itemData.summary === "string" ? itemData.summary : undefined,
        category: typeof itemData.category === "string" ? itemData.category : undefined,
        type: typeof itemData.type === "string" ? itemData.type : undefined,
        item_type: typeof itemData.item_type === "string" ? itemData.item_type : undefined,
        slot: typeof itemData.slot === "string" ? itemData.slot : undefined,
        group_name: typeof itemData.group === "string" ? itemData.group : undefined,
        collection: typeof itemData.collection === "string" ? itemData.collection : undefined,
        rarity: typeof itemData.rarity === "string" ? itemData.rarity : undefined,
        tier: typeof itemData.tier === "string" ? itemData.tier : undefined,
        quality: typeof itemData.quality === "string" ? itemData.quality : undefined,
        grade: typeof itemData.grade === "string" ? itemData.grade : undefined,
        cost_label: costLabel,
        currency: typeof itemData.currency === "string" ? itemData.currency : undefined,
        unlock_condition: typeof itemData.unlock_condition === "string" ? itemData.unlock_condition : undefined,
        requirement: typeof itemData.requirement === "string" ? itemData.requirement : undefined,
        icon: typeof itemData.icon === "string" ? itemData.icon : undefined,
        image: typeof itemData.image === "string" ? itemData.image : undefined,
        icon_url: typeof itemData.icon_url === "string" ? itemData.icon_url : undefined,
        thumbnail: typeof itemData.thumbnail === "string" ? itemData.thumbnail : undefined,
        stats: itemData.stats,
        attributes: itemData.attributes,
        effects: itemData.effects,
        bonuses: itemData.bonuses,
        passives: itemData.passives,
        details: itemData.details,
        raw: itemData,
        categoryLabel,
        typeLabel,
        rarityLabel,
        searchText: undefined
      })
    })
    const reportedPages = Number(data?.total_pages)
    const reportedCount = Number(data?.total_items)
    if (Number.isFinite(reportedPages) && reportedPages > 0) {
      totalPages = reportedPages
    } else if (Number.isFinite(reportedCount) && list.length > 0) {
      totalPages = Math.ceil(reportedCount / list.length)
    } else {
      totalPages = page
    }
    page += 1
  }
  const unique = new Map<string, ItemRecord>()
  aggregated.forEach(item => {
    unique.set(item.id, item)
  })
  return Array.from(unique.values())
}

