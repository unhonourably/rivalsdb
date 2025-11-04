import pool, { runQuery } from "@/lib/mysql"

export interface AutoSyncConfig {
  cache_type: string
  enabled: boolean
  interval_count: number
  interval_unit: 'hour' | 'day' | 'week' | 'month'
  last_auto_synced: Date | null
  next_sync_at: Date | null
  batch_size: number | null
  batch_delay: number | null
  updated_at: Date
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auto_sync_config (
      cache_type VARCHAR(64) PRIMARY KEY,
      enabled BOOLEAN DEFAULT FALSE,
      interval_count INT DEFAULT 1,
      interval_unit ENUM('hour', 'day', 'week', 'month') DEFAULT 'day',
      last_auto_synced DATETIME NULL,
      next_sync_at DATETIME NULL,
      batch_size INT NULL,
      batch_delay INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export const getAutoSyncConfig = async (cacheType: string): Promise<AutoSyncConfig | null> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    cache_type: string
    enabled: number | boolean
    interval_count: number
    interval_unit: string
    last_auto_synced: Date | null
    next_sync_at: Date | null
    batch_size: number | null
    batch_delay: number | null
    updated_at: Date
  }>>(`SELECT * FROM auto_sync_config WHERE cache_type = ?`, [cacheType])
  
  if (rows.length === 0) return null
  
  const row = rows[0]
  return {
    cache_type: row.cache_type,
    enabled: row.enabled === 1 || row.enabled === true,
    interval_count: row.interval_count,
    interval_unit: row.interval_unit as 'hour' | 'day' | 'week' | 'month',
    last_auto_synced: row.last_auto_synced ? new Date(row.last_auto_synced) : null,
    next_sync_at: row.next_sync_at ? new Date(row.next_sync_at) : null,
    batch_size: row.batch_size,
    batch_delay: row.batch_delay,
    updated_at: new Date(row.updated_at)
  }
}

export const getAllAutoSyncConfigs = async (): Promise<AutoSyncConfig[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    cache_type: string
    enabled: number | boolean
    interval_count: number
    interval_unit: string
    last_auto_synced: Date | null
    next_sync_at: Date | null
    batch_size: number | null
    batch_delay: number | null
    updated_at: Date
  }>>(`SELECT * FROM auto_sync_config`)
  
  return rows.map(row => ({
    cache_type: row.cache_type,
    enabled: row.enabled === 1 || row.enabled === true,
    interval_count: row.interval_count,
    interval_unit: row.interval_unit as 'hour' | 'day' | 'week' | 'month',
    last_auto_synced: row.last_auto_synced ? new Date(row.last_auto_synced) : null,
    next_sync_at: row.next_sync_at ? new Date(row.next_sync_at) : null,
    batch_size: row.batch_size,
    batch_delay: row.batch_delay,
    updated_at: new Date(row.updated_at)
  }))
}

export const saveAutoSyncConfig = async (config: Omit<AutoSyncConfig, 'updated_at' | 'last_auto_synced' | 'next_sync_at'> & { next_sync_at?: Date | null }): Promise<void> => {
  await ensureTable()
  
  const calculateNextSync = (intervalCount: number, intervalUnit: string, fromDate?: Date): Date => {
    const base = fromDate || new Date()
    const next = new Date(base)
    
    switch (intervalUnit) {
      case 'hour':
        next.setHours(next.getHours() + intervalCount)
        break
      case 'day':
        next.setDate(next.getDate() + intervalCount)
        break
      case 'week':
        next.setDate(next.getDate() + (intervalCount * 7))
        break
      case 'month':
        next.setMonth(next.getMonth() + intervalCount)
        break
    }
    
    return next
  }
  
  let nextSync: Date | null = null
  
  if (config.enabled) {
    if (config.next_sync_at !== undefined) {
      nextSync = config.next_sync_at ? new Date(config.next_sync_at) : calculateNextSync(config.interval_count, config.interval_unit)
    } else {
      const existing = await getAutoSyncConfig(config.cache_type)
      if (existing?.next_sync_at && existing.enabled) {
        nextSync = existing.next_sync_at
      } else {
        nextSync = calculateNextSync(config.interval_count, config.interval_unit)
      }
    }
  }
  
  await pool.query(`
    INSERT INTO auto_sync_config (
      cache_type, enabled, interval_count, interval_unit, next_sync_at, batch_size, batch_delay
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      enabled = VALUES(enabled),
      interval_count = VALUES(interval_count),
      interval_unit = VALUES(interval_unit),
      next_sync_at = VALUES(next_sync_at),
      batch_size = VALUES(batch_size),
      batch_delay = VALUES(batch_delay)
  `, [
    config.cache_type,
    config.enabled,
    config.interval_count,
    config.interval_unit,
    nextSync,
    (config as any).batch_size || null,
    (config as any).batch_delay || null
  ])
}

export const updateLastAutoSynced = async (cacheType: string): Promise<void> => {
  await ensureTable()
  
  const config = await getAutoSyncConfig(cacheType)
  if (!config || !config.enabled) return
  
  const calculateNextSync = (intervalCount: number, intervalUnit: string): Date => {
    const now = new Date()
    const next = new Date(now)
    
    switch (intervalUnit) {
      case 'hour':
        next.setHours(next.getHours() + intervalCount)
        break
      case 'day':
        next.setDate(next.getDate() + intervalCount)
        break
      case 'week':
        next.setDate(next.getDate() + (intervalCount * 7))
        break
      case 'month':
        next.setMonth(next.getMonth() + intervalCount)
        break
    }
    
    return next
  }
  
  const nextSync = calculateNextSync(config.interval_count, config.interval_unit)
  
  await pool.query(`
    UPDATE auto_sync_config
    SET last_auto_synced = NOW(),
        next_sync_at = ?
    WHERE cache_type = ?
  `, [nextSync, cacheType])
}

export const getDueSyncs = async (): Promise<AutoSyncConfig[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    cache_type: string
    enabled: number | boolean
    interval_count: number
    interval_unit: string
    last_auto_synced: Date | null
    next_sync_at: Date | null
    batch_size: number | null
    batch_delay: number | null
    updated_at: Date
  }>>(`
    SELECT * FROM auto_sync_config
    WHERE enabled = TRUE
    AND (next_sync_at IS NULL OR next_sync_at <= NOW())
  `)
  
  return rows.map(row => ({
    cache_type: row.cache_type,
    enabled: row.enabled === 1 || row.enabled === true,
    interval_count: row.interval_count,
    interval_unit: row.interval_unit as 'hour' | 'day' | 'week' | 'month',
    last_auto_synced: row.last_auto_synced ? new Date(row.last_auto_synced) : null,
    next_sync_at: row.next_sync_at ? new Date(row.next_sync_at) : null,
    batch_size: row.batch_size,
    batch_delay: row.batch_delay,
    updated_at: new Date(row.updated_at)
  }))
}

