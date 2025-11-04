import pool, { runQuery } from "@/lib/mysql"

export interface GameVersionRecord {
  id: string
  version_label: string
  release_label?: string
  patch_notes_url?: string
  raw?: unknown
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_versions (
      id VARCHAR(128) PRIMARY KEY,
      version_label VARCHAR(255) NOT NULL,
      release_label VARCHAR(255),
      patch_notes_url VARCHAR(512),
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export const getAllGameVersions = async (): Promise<GameVersionRecord[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    id: string
    version_label: string
    release_label: string | null
    patch_notes_url: string | null
    raw_json: unknown
  }>>(`SELECT id, version_label, release_label, patch_notes_url, raw_json FROM game_versions ORDER BY version_label DESC`)
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
    id: row.id,
    version_label: row.version_label,
    release_label: row.release_label ?? undefined,
    patch_notes_url: row.patch_notes_url ?? undefined,
    raw: parseJsonField(row.raw_json)
  }))
}

export const saveGameVersions = async (items: GameVersionRecord[]) => {
  if (items.length === 0) return
  await ensureTable()
  const values = items.map((item) => [
    item.id,
    item.version_label,
    item.release_label ?? null,
    item.patch_notes_url ?? null,
    item.raw ? JSON.stringify(item.raw) : null
  ])
  const chunkSize = 100
  for (let index = 0; index < values.length; index += chunkSize) {
    const chunk = values.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => "(?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
    await pool.query(
      `INSERT INTO game_versions (id, version_label, release_label, patch_notes_url, raw_json)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         version_label = VALUES(version_label),
         release_label = VALUES(release_label),
         patch_notes_url = VALUES(patch_notes_url),
         raw_json = VALUES(raw_json)`,
      chunk.flat()
    )
  }
}

export const fetchGameVersionsFromApi = async (): Promise<GameVersionRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const aggregated: GameVersionRecord[] = []
  let page = 1
  let totalPages = 1
  
  while (page <= totalPages && page <= 10) {
    const response = await fetch(`https://marvelrivalsapi.com/api/v1/game-versions?page=${page}&limit=100`, {
      headers: { "x-api-key": apiKey }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch game versions (${response.status})`)
    }
    const data = await response.json()
    if (page === 1) {
      console.log('Game versions API response:', data)
    }
    const versions = Array.isArray(data?.formatted_versions)
      ? data.formatted_versions
      : Array.isArray(data?.versions)
        ? data.versions
        : Array.isArray(data?.game_versions)
          ? data.game_versions
          : Array.isArray(data)
            ? data
            : []
    
    if (page === 1) {
      console.log('Parsed versions array:', versions)
    }
    
    versions.forEach((entry: any, index: number) => {
      const id = entry.id ?? entry.version ?? `version-${page}-${index}`
      aggregated.push({
        id: String(id),
        version_label: entry.version ? String(entry.version) : 'Version',
        release_label: entry.release ?? undefined,
        patch_notes_url: entry.patchNotesUrl ?? undefined,
        raw: entry
      })
    })
    
    const reportedPages = Number(data?.total_pages)
    const reportedCount = Number(data?.total_versions)
    if (Number.isFinite(reportedPages) && reportedPages > 0) {
      totalPages = reportedPages
    } else if (Number.isFinite(reportedCount) && versions.length > 0) {
      totalPages = Math.ceil(reportedCount / versions.length)
    } else {
      totalPages = page
    }
    page += 1
  }
  
  const unique = new Map<string, GameVersionRecord>()
  aggregated.forEach((item) => {
    unique.set(item.id, item)
  })
  return Array.from(unique.values())
}

