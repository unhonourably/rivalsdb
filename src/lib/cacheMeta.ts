import pool, { runQuery } from "@/lib/mysql"

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cache_sync_meta (
      cache_key VARCHAR(64) PRIMARY KEY,
      last_synced_at DATETIME NULL,
      record_count INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export interface CacheMetaRow {
  cache_key: string
  last_synced_at: Date | null
  record_count: number | null
}

export const setCacheMeta = async (cacheKey: string, lastSynced: Date, recordCount: number) => {
  await ensureTable()
  await pool.query(
    `INSERT INTO cache_sync_meta (cache_key, last_synced_at, record_count)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       last_synced_at = VALUES(last_synced_at),
       record_count = VALUES(record_count)`
    , [cacheKey, lastSynced, recordCount]
  )
}

export const getCacheMeta = async (cacheKey: string): Promise<{ lastSynced: string | null; count: number | null }> => {
  await ensureTable()
  const rows = await runQuery<CacheMetaRow[]>(
    `SELECT cache_key, last_synced_at, record_count FROM cache_sync_meta WHERE cache_key = ? LIMIT 1`,
    [cacheKey]
  )
  if (!rows.length) {
    return { lastSynced: null, count: null }
  }
  const row = rows[0]
  return {
    lastSynced: row.last_synced_at ? new Date(row.last_synced_at).toISOString() : null,
    count: row.record_count ?? null
  }
}

export const getAllCacheMeta = async () => {
  await ensureTable()
  const rows = await runQuery<CacheMetaRow[]>(
    `SELECT cache_key, last_synced_at, record_count FROM cache_sync_meta`
  )
  const payload: Record<string, { lastSynced: string | null; count: number | null }> = {}
  rows.forEach((row) => {
    payload[row.cache_key] = {
      lastSynced: row.last_synced_at ? new Date(row.last_synced_at).toISOString() : null,
      count: row.record_count ?? null
    }
  })
  return payload
}

