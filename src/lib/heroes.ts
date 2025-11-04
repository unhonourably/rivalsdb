import pool, { runQuery } from "@/lib/mysql"

export interface HeroAbilityRecord {
  id: string
  hero_id: string
  ability_name: string
  ability_type?: string
  cooldown?: string
  description?: string
  icon?: string
  is_collab: boolean
  transformation_id?: string
  additional_fields?: unknown
  raw?: unknown
}

export interface HeroRecord {
  id: string
  name: string
  alias?: string
  real_name?: string
  role: string
  type?: string
  image_url?: string
  bio?: string
  lore?: string
  difficulty?: string
  attack_type?: string
  team?: string[]
  raw?: unknown
}

export interface HeroStatsRecord {
  hero_id: string
  matches?: number
  wins?: number
  losses?: number
  win_rate?: number
  kills?: number
  deaths?: number
  assists?: number
  k?: number
  d?: number
  a?: number
  kd?: number
  kda?: number
  total_hero_damage?: string
  total_damage_taken?: string
  total_hero_heal?: string
  play_time?: string
  mvps?: number
  svps?: number
  session_hit_rate?: number
  solo_kill?: number
  average_score?: number
  raw?: unknown
}

export interface HeroCostumeRecord {
  id: string
  hero_id: string
  name?: string
  icon?: string
  image_url?: string
  quality?: string
  rarity?: string
  description?: string
  appearance?: string
  raw?: unknown
}

export interface HeroLeaderboardRecord {
  id: string
  hero_id: string
  platform: string
  rank: number
  player_uid?: string
  player_name?: string
  player_icon?: string
  rank_score?: string
  rank_level?: number
  wins?: number
  matches?: number
  kills?: number
  deaths?: number
  assists?: number
  play_time?: string
  total_hero_damage?: string
  total_damage_taken?: string
  total_hero_heal?: string
  mvps?: number
  svps?: number
  raw?: unknown
}

const ensureHeroesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS heroes (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      alias VARCHAR(255),
      real_name VARCHAR(255),
      role VARCHAR(64),
      type VARCHAR(64),
      image_url VARCHAR(512),
      bio TEXT,
      lore TEXT,
      difficulty VARCHAR(64),
      attack_type VARCHAR(64),
      team_json JSON,
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

const ensureAbilitiesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hero_abilities (
      id VARCHAR(128) NOT NULL,
      hero_id VARCHAR(64) NOT NULL,
      ability_name VARCHAR(255) NOT NULL,
      ability_type VARCHAR(64),
      cooldown TEXT,
      description TEXT,
      icon VARCHAR(512),
      is_collab BOOLEAN DEFAULT FALSE,
      transformation_id VARCHAR(64) NOT NULL DEFAULT '0',
      additional_fields_json JSON,
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id, hero_id, transformation_id),
      INDEX idx_hero_id (hero_id)
    )
  `)

  try {
    await pool.query(`ALTER TABLE hero_abilities MODIFY cooldown TEXT`)
  } catch {}
  try {
    await pool.query(`ALTER TABLE hero_abilities MODIFY transformation_id VARCHAR(64) NOT NULL DEFAULT '0'`)
  } catch {}
  try {
    const [rows]: any = await pool.query(`SHOW INDEX FROM hero_abilities WHERE Key_name = 'PRIMARY'`)
    const hasComposite = Array.isArray(rows) && rows.some((r: any) => r.Column_name === 'hero_id')
    if (!hasComposite) {
      await pool.query(`ALTER TABLE hero_abilities DROP PRIMARY KEY`)
      await pool.query(`ALTER TABLE hero_abilities ADD PRIMARY KEY (id, hero_id, transformation_id)`)
    }
  } catch {}
}

const ensureStatsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hero_stats (
      hero_id VARCHAR(64) PRIMARY KEY,
      matches INT,
      wins INT,
      losses INT,
      win_rate DECIMAL(10, 4),
      kills INT,
      deaths INT,
      assists INT,
      k DECIMAL(10, 2),
      d DECIMAL(10, 2),
      a DECIMAL(10, 2),
      kd DECIMAL(10, 2),
      kda DECIMAL(10, 2),
      total_hero_damage VARCHAR(255),
      total_damage_taken VARCHAR(255),
      total_hero_heal VARCHAR(255),
      play_time VARCHAR(255),
      mvps INT,
      svps INT,
      session_hit_rate DECIMAL(10, 4),
      solo_kill DECIMAL(10, 2),
      average_score DECIMAL(10, 2),
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

const ensureCostumesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hero_costumes (
      id VARCHAR(128) PRIMARY KEY,
      hero_id VARCHAR(64) NOT NULL,
      name VARCHAR(255),
      icon VARCHAR(512),
      image_url VARCHAR(512),
      quality VARCHAR(64),
      rarity VARCHAR(64),
      description TEXT,
      appearance TEXT,
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hero_id (hero_id)
    )
  `)
}

const getHeroLeaderboardTableName = (heroId: string) => {
  if (/^\d{4}$/.test(heroId)) return `hero_leaderboard_${heroId}`
  return 'hero_leaderboard'
}

const ensureLeaderboardTable = async (heroId: string) => {
  const table = getHeroLeaderboardTableName(heroId)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id VARCHAR(256) PRIMARY KEY,
      hero_id VARCHAR(64) NOT NULL,
      platform VARCHAR(32) NOT NULL,
      rank_position INT NOT NULL,
      player_uid VARCHAR(64),
      player_name VARCHAR(255),
      player_icon VARCHAR(512),
      rank_score VARCHAR(64),
      rank_level INT,
      wins INT,
      matches INT,
      kills INT,
      deaths INT,
      assists INT,
      play_time VARCHAR(255),
      total_hero_damage VARCHAR(255),
      total_damage_taken VARCHAR(255),
      total_hero_heal VARCHAR(255),
      mvps INT,
      svps INT,
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_platform (platform),
      INDEX idx_rank (platform, rank_position)
    )
  `)
  try {
    await pool.query(`ALTER TABLE ${table} MODIFY id VARCHAR(256)`)
  } catch {}
}

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

export const getAllHeroes = async (): Promise<HeroRecord[]> => {
  await ensureHeroesTable()
  const rows = await runQuery<Array<{
    id: string
    name: string
    alias: string | null
    real_name: string | null
    role: string
    type: string | null
    image_url: string | null
    bio: string | null
    lore: string | null
    difficulty: string | null
    attack_type: string | null
    team_json: unknown
    raw_json: unknown
  }>>(`SELECT * FROM heroes ORDER BY name ASC`)
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    alias: row.alias ?? undefined,
    real_name: row.real_name ?? undefined,
    role: row.role,
    type: row.type ?? undefined,
    image_url: row.image_url ?? undefined,
    bio: row.bio ?? undefined,
    lore: row.lore ?? undefined,
    difficulty: row.difficulty ?? undefined,
    attack_type: row.attack_type ?? undefined,
    team: parseJsonField(row.team_json) as string[] ?? undefined,
    raw: parseJsonField(row.raw_json)
  }))
}

export const getHeroById = async (heroId: string): Promise<HeroRecord | null> => {
  await ensureHeroesTable()
  const rows = await runQuery<Array<{
    id: string
    name: string
    alias: string | null
    real_name: string | null
    role: string
    type: string | null
    image_url: string | null
    bio: string | null
    lore: string | null
    difficulty: string | null
    attack_type: string | null
    team_json: unknown
    raw_json: unknown
  }>>(`SELECT * FROM heroes WHERE id = ? LIMIT 1`, [heroId])
  
  if (!rows.length) return null
  const row = rows[0]
  
  return {
    id: row.id,
    name: row.name,
    alias: row.alias ?? undefined,
    real_name: row.real_name ?? undefined,
    role: row.role,
    type: row.type ?? undefined,
    image_url: row.image_url ?? undefined,
    bio: row.bio ?? undefined,
    lore: row.lore ?? undefined,
    difficulty: row.difficulty ?? undefined,
    attack_type: row.attack_type ?? undefined,
    team: parseJsonField(row.team_json) as string[] ?? undefined,
    raw: parseJsonField(row.raw_json)
  }
}

export const getHeroAbilities = async (heroId: string): Promise<HeroAbilityRecord[]> => {
  await ensureAbilitiesTable()
  const rows = await runQuery<Array<{
    id: string
    hero_id: string
    ability_name: string
    ability_type: string | null
    cooldown: string | null
    description: string | null
    icon: string | null
    is_collab: boolean
    transformation_id: string | null
    additional_fields_json: unknown
    raw_json: unknown
  }>>(`SELECT * FROM hero_abilities WHERE hero_id = ? ORDER BY is_collab ASC, id ASC`, [heroId])
  
  return rows.map(row => ({
    id: row.id,
    hero_id: row.hero_id,
    ability_name: row.ability_name,
    ability_type: row.ability_type ?? undefined,
    cooldown: row.cooldown ?? undefined,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    is_collab: row.is_collab,
    transformation_id: row.transformation_id ?? undefined,
    additional_fields: parseJsonField(row.additional_fields_json),
    raw: parseJsonField(row.raw_json)
  }))
}

export const getHeroStats = async (heroId: string): Promise<HeroStatsRecord | null> => {
  await ensureStatsTable()
  const rows = await runQuery<Array<{
    hero_id: string
    matches: number | null
    wins: number | null
    losses: number | null
    win_rate: number | null
    kills: number | null
    deaths: number | null
    assists: number | null
    k: number | null
    d: number | null
    a: number | null
    kd: number | null
    kda: number | null
    total_hero_damage: string | null
    total_damage_taken: string | null
    total_hero_heal: string | null
    play_time: string | null
    mvps: number | null
    svps: number | null
    session_hit_rate: number | null
    solo_kill: number | null
    average_score: number | null
    raw_json: unknown
  }>>(`SELECT * FROM hero_stats WHERE hero_id = ? LIMIT 1`, [heroId])
  
  if (!rows.length) return null
  const row = rows[0]
  
  return {
    hero_id: row.hero_id,
    matches: row.matches ?? undefined,
    wins: row.wins ?? undefined,
    losses: row.losses ?? undefined,
    win_rate: row.win_rate ?? undefined,
    kills: row.kills ?? undefined,
    deaths: row.deaths ?? undefined,
    assists: row.assists ?? undefined,
    k: row.k ?? undefined,
    d: row.d ?? undefined,
    a: row.a ?? undefined,
    kd: row.kd ?? undefined,
    kda: row.kda ?? undefined,
    total_hero_damage: row.total_hero_damage ?? undefined,
    total_damage_taken: row.total_damage_taken ?? undefined,
    total_hero_heal: row.total_hero_heal ?? undefined,
    play_time: row.play_time ?? undefined,
    mvps: row.mvps ?? undefined,
    svps: row.svps ?? undefined,
    session_hit_rate: row.session_hit_rate ?? undefined,
    solo_kill: row.solo_kill ?? undefined,
    average_score: row.average_score ?? undefined,
    raw: parseJsonField(row.raw_json)
  }
}

export const getHeroCostumes = async (heroId: string): Promise<HeroCostumeRecord[]> => {
  await ensureCostumesTable()
  const rows = await runQuery<Array<{
    id: string
    hero_id: string
    name: string | null
    icon: string | null
    image_url: string | null
    quality: string | null
    rarity: string | null
    description: string | null
    appearance: string | null
    raw_json: unknown
  }>>(`SELECT * FROM hero_costumes WHERE hero_id = ? ORDER BY id ASC`, [heroId])
  
  return rows.map(row => ({
    id: row.id,
    hero_id: row.hero_id,
    name: row.name ?? undefined,
    icon: row.icon ?? undefined,
    image_url: row.image_url ?? undefined,
    quality: row.quality ?? undefined,
    rarity: row.rarity ?? undefined,
    description: row.description ?? undefined,
    appearance: row.appearance ?? undefined,
    raw: parseJsonField(row.raw_json)
  }))
}

export const getHeroLeaderboard = async (heroId: string, platform: string = 'pc'): Promise<HeroLeaderboardRecord[]> => {
  await ensureLeaderboardTable(heroId)
  const table = getHeroLeaderboardTableName(heroId)
  const rows = await runQuery<Array<{
    id: string
    hero_id: string
    platform: string
    rank_position: number
    player_uid: string | null
    player_name: string | null
    player_icon: string | null
    rank_score: string | null
    rank_level: number | null
    wins: number | null
    matches: number | null
    kills: number | null
    deaths: number | null
    assists: number | null
    play_time: string | null
    total_hero_damage: string | null
    total_damage_taken: string | null
    total_hero_heal: string | null
    mvps: number | null
    svps: number | null
    raw_json: unknown
  }>>(`SELECT * FROM ${table} WHERE hero_id = ? AND platform = ? ORDER BY rank_position ASC`, [heroId, platform])
  
  return rows.map(row => ({
    id: row.id,
    hero_id: row.hero_id,
    platform: row.platform,
    rank: row.rank_position,
    player_uid: row.player_uid ?? undefined,
    player_name: row.player_name ?? undefined,
    player_icon: row.player_icon ?? undefined,
    rank_score: row.rank_score ?? undefined,
    rank_level: row.rank_level ?? undefined,
    wins: row.wins ?? undefined,
    matches: row.matches ?? undefined,
    kills: row.kills ?? undefined,
    deaths: row.deaths ?? undefined,
    assists: row.assists ?? undefined,
    play_time: row.play_time ?? undefined,
    total_hero_damage: row.total_hero_damage ?? undefined,
    total_damage_taken: row.total_damage_taken ?? undefined,
    total_hero_heal: row.total_hero_heal ?? undefined,
    mvps: row.mvps ?? undefined,
    svps: row.svps ?? undefined,
    raw: parseJsonField(row.raw_json)
  }))
}

export const saveHeroes = async (heroes: HeroRecord[]) => {
  if (heroes.length === 0) return
  await ensureHeroesTable()
  
  const values = heroes.map(hero => [
    hero.id,
    hero.name,
    hero.alias ?? null,
    hero.real_name ?? null,
    hero.role,
    hero.type ?? null,
    hero.image_url ?? null,
    hero.bio ?? null,
    hero.lore ?? null,
    hero.difficulty ?? null,
    hero.attack_type ?? null,
    hero.team ? JSON.stringify(hero.team) : null,
    hero.raw ? JSON.stringify(hero.raw) : null
  ])
  
  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'))").join(",")
  await pool.query(
    `INSERT INTO heroes (id, name, alias, real_name, role, type, image_url, bio, lore, difficulty, attack_type, team_json, raw_json)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       alias = VALUES(alias),
       real_name = VALUES(real_name),
       role = VALUES(role),
       type = VALUES(type),
       image_url = VALUES(image_url),
       bio = VALUES(bio),
       lore = VALUES(lore),
       difficulty = VALUES(difficulty),
       attack_type = VALUES(attack_type),
       team_json = VALUES(team_json),
       raw_json = VALUES(raw_json)`,
    values.flat()
  )
}

export const saveHeroAbilities = async (heroId: string, abilities: HeroAbilityRecord[]) => {
  await ensureAbilitiesTable()
  await pool.query(`DELETE FROM hero_abilities WHERE hero_id = ?`, [heroId])
  
  if (abilities.length === 0) return
  
  const values = abilities.map(ability => [
    ability.id,
    heroId,
    ability.ability_name,
    ability.ability_type ?? null,
    ability.cooldown ?? null,
    ability.description ?? null,
    ability.icon ?? null,
    ability.is_collab ? 1 : 0,
    String(ability.transformation_id ?? '0'),
    ability.additional_fields ? JSON.stringify(ability.additional_fields) : null,
    ability.raw ? JSON.stringify(ability.raw) : null
  ])
  
  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'), JSON_EXTRACT(?, '$'))").join(",")
  await pool.query(
    `INSERT INTO hero_abilities (id, hero_id, ability_name, ability_type, cooldown, description, icon, is_collab, transformation_id, additional_fields_json, raw_json)
     VALUES ${placeholders}`,
    values.flat()
  )
}

export const saveHeroStats = async (stats: HeroStatsRecord) => {
  await ensureStatsTable()
  
  const values = [
    stats.hero_id,
    stats.matches ?? null,
    stats.wins ?? null,
    stats.losses ?? null,
    stats.win_rate ?? null,
    stats.kills ?? null,
    stats.deaths ?? null,
    stats.assists ?? null,
    stats.k ?? null,
    stats.d ?? null,
    stats.a ?? null,
    stats.kd ?? null,
    stats.kda ?? null,
    stats.total_hero_damage ?? null,
    stats.total_damage_taken ?? null,
    stats.total_hero_heal ?? null,
    stats.play_time ?? null,
    stats.mvps ?? null,
    stats.svps ?? null,
    stats.session_hit_rate ?? null,
    stats.solo_kill ?? null,
    stats.average_score ?? null,
    stats.raw ? JSON.stringify(stats.raw) : null
  ]
  
  await pool.query(
    `INSERT INTO hero_stats (hero_id, matches, wins, losses, win_rate, kills, deaths, assists, k, d, a, kd, kda, total_hero_damage, total_damage_taken, total_hero_heal, play_time, mvps, svps, session_hit_rate, solo_kill, average_score, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))
     ON DUPLICATE KEY UPDATE
       matches = VALUES(matches),
       wins = VALUES(wins),
       losses = VALUES(losses),
       win_rate = VALUES(win_rate),
       kills = VALUES(kills),
       deaths = VALUES(deaths),
       assists = VALUES(assists),
       k = VALUES(k),
       d = VALUES(d),
       a = VALUES(a),
       kd = VALUES(kd),
       kda = VALUES(kda),
       total_hero_damage = VALUES(total_hero_damage),
       total_damage_taken = VALUES(total_damage_taken),
       total_hero_heal = VALUES(total_hero_heal),
       play_time = VALUES(play_time),
       mvps = VALUES(mvps),
       svps = VALUES(svps),
       session_hit_rate = VALUES(session_hit_rate),
       solo_kill = VALUES(solo_kill),
       average_score = VALUES(average_score),
       raw_json = VALUES(raw_json)`,
    values
  )
}

export const saveHeroCostumes = async (heroId: string, costumes: HeroCostumeRecord[]) => {
  await ensureCostumesTable()
  await pool.query(`DELETE FROM hero_costumes WHERE hero_id = ?`, [heroId])
  
  if (costumes.length === 0) return
  
  const deduplicated = new Map<string, HeroCostumeRecord>()
  for (const costume of costumes) {
    const id = String(costume.id)
    const existing = deduplicated.get(id)
    if (!existing) {
      deduplicated.set(id, costume)
    } else {
      const merged: HeroCostumeRecord = {
        ...existing,
        name: costume.name || existing.name,
        icon: costume.icon || existing.icon,
        image_url: costume.image_url || existing.image_url,
        quality: costume.quality || existing.quality,
        rarity: costume.rarity || existing.rarity,
        description: costume.description && costume.description !== '0' ? costume.description : (existing.description && existing.description !== '0' ? existing.description : costume.description || existing.description),
        appearance: costume.appearance && costume.appearance !== '0' ? costume.appearance : (existing.appearance && existing.appearance !== '0' ? existing.appearance : costume.appearance || existing.appearance),
        raw: costume.raw || existing.raw
      }
      deduplicated.set(id, merged)
    }
  }
  
  const uniqueCostumes = Array.from(deduplicated.values())
  const values = uniqueCostumes.map(costume => [
    costume.id,
    heroId,
    costume.name ?? null,
    costume.icon ?? null,
    costume.image_url ?? null,
    costume.quality ?? null,
    costume.rarity ?? null,
    costume.description ?? null,
    costume.appearance ?? null,
    costume.raw ? JSON.stringify(costume.raw) : null
  ])
  
  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
  await pool.query(
    `INSERT INTO hero_costumes (id, hero_id, name, icon, image_url, quality, rarity, description, appearance, raw_json)
     VALUES ${placeholders}`,
    values.flat()
  )
}

export const saveHeroLeaderboard = async (heroId: string, platform: string, entries: HeroLeaderboardRecord[]) => {
  await ensureLeaderboardTable(heroId)
  const table = getHeroLeaderboardTableName(heroId)
  await pool.query(`DELETE FROM ${table} WHERE hero_id = ? AND platform = ?`, [heroId, platform])
  
  if (entries.length === 0) return
  
  const values = entries.map(entry => {
    const playerUid = entry.player_uid ? String(entry.player_uid) : `rank-${entry.rank}`
    const compositeId = `${heroId}-${platform}-${playerUid}`
    return [
      compositeId,
      heroId,
      platform,
      entry.rank,
      entry.player_uid ?? null,
      entry.player_name ?? null,
      entry.player_icon ?? null,
      entry.rank_score ?? null,
      entry.rank_level ?? null,
      entry.wins ?? null,
      entry.matches ?? null,
      entry.kills ?? null,
      entry.deaths ?? null,
      entry.assists ?? null,
      entry.play_time ?? null,
      entry.total_hero_damage ?? null,
      entry.total_damage_taken ?? null,
      entry.total_hero_heal ?? null,
      entry.mvps ?? null,
      entry.svps ?? null,
      entry.raw ? JSON.stringify(entry.raw) : null
    ]
  })
  
  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
  await pool.query(
    `INSERT INTO ${table} (id, hero_id, platform, rank_position, player_uid, player_name, player_icon, rank_score, rank_level, wins, matches, kills, deaths, assists, play_time, total_hero_damage, total_damage_taken, total_hero_heal, mvps, svps, raw_json)
     VALUES ${placeholders}`,
    values.flat()
  )
}

export const fetchHeroesFromApi = async (): Promise<HeroRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  
  const response = await fetch(`https://marvelrivalsapi.com/api/v1/heroes`, {
    headers: { "x-api-key": apiKey }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch heroes (${response.status})`)
  }
  
  const data = await response.json()
  const heroList = Array.isArray(data?.heroes) 
    ? data.heroes 
    : Array.isArray(data)
      ? data
      : []
  
  return heroList.map((hero: any) => ({
    id: String(hero.id ?? hero.hero_id ?? hero.name),
    name: hero.name ?? 'Unknown Hero',
    alias: hero.alias ?? undefined,
    real_name: hero.real_name ?? undefined,
    role: hero.role ?? 'Unknown',
    type: hero.type ?? undefined,
    image_url: hero.imageUrl ?? hero.image_url ?? hero.icon ?? undefined,
    bio: hero.bio ?? undefined,
    lore: hero.lore ?? undefined,
    difficulty: hero.difficulty ?? undefined,
    attack_type: hero.attack_type ?? undefined,
    team: Array.isArray(hero.team) ? hero.team : undefined,
    raw: hero
  }))
}

export const fetchHeroDetailFromApi = async (heroId: string) => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  
  const response = await fetch(`https://marvelrivalsapi.com/api/v1/heroes/hero/${heroId}`, {
    headers: { "x-api-key": apiKey }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch hero detail (${response.status})`)
  }
  
  const data = await response.json()
  const hero = Array.isArray(data) ? data[0] : data
  
  const abilities: HeroAbilityRecord[] = (hero.abilities ?? []).map((ability: any, index: number) => ({
    id: String(ability.id ?? `${heroId}-ability-${index}`),
    hero_id: heroId,
    ability_name: ability.name ?? ability.ability_name ?? `Ability ${index + 1}`,
    ability_type: ability.type ?? undefined,
    cooldown: ability.cooldown ? String(ability.cooldown) : ability.additional_fields?.Cooldown ?? undefined,
    description: ability.description ?? undefined,
    icon: ability.icon ?? undefined,
    is_collab: ability.isCollab === true,
    transformation_id: ability.transformation_id ?? undefined,
    additional_fields: ability.additional_fields ?? undefined,
    raw: ability
  }))
  
  return {
    hero: {
      id: String(hero.id ?? heroId),
      name: hero.name ?? 'Unknown Hero',
      alias: hero.alias ?? undefined,
      real_name: hero.real_name ?? undefined,
      role: hero.role ?? 'Unknown',
      type: hero.type ?? undefined,
      image_url: hero.imageUrl ?? hero.image_url ?? hero.icon ?? undefined,
      bio: hero.bio ?? undefined,
      lore: hero.lore ?? undefined,
      difficulty: hero.difficulty ?? undefined,
      attack_type: hero.attack_type ?? undefined,
      team: Array.isArray(hero.team) ? hero.team : undefined,
      raw: hero
    } as HeroRecord,
    abilities,
    transformations: hero.transformations ?? []
  }
}

export const fetchHeroStatsFromApi = async (heroId: string): Promise<HeroStatsRecord | null> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const endpoints = [
    `https://marvelrivalsapi.com/api/v1/heroes/hero/${heroId}/stats`,
    `https://marvelrivalsapi.com/api/v2/heroes/hero/${heroId}/stats`
  ]

  let data: any | null = null
  for (const url of endpoints) {
    let attempt = 0
    while (attempt < 3 && data === null) {
      try {
        const response = await fetch(url, { headers: { "x-api-key": apiKey } })
        if (response.ok) {
          const parsed = await response.json()
          if (parsed && Object.keys(parsed).length > 0) {
            data = parsed
            break
          }
        }
      } catch {}
      attempt += 1
      await new Promise(r => setTimeout(r, 300 * attempt))
    }
    if (data) break
  }
  
  if (!data) return null

  const toNum = (v: any): number | undefined => {
    if (v === null || v === undefined) return undefined
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v)
    return undefined
  }

  const matches = toNum(data.matches)
  const wins = toNum(data.wins)
  const losses = toNum(data.losses) ?? (matches !== undefined && wins !== undefined ? Math.max(0, matches - wins) : undefined)
  const k = toNum(data.k)
  const d = toNum(data.d)
  const a = toNum(data.a)
  const kd = toNum(data.kd) ?? (k !== undefined && d !== undefined && d !== 0 ? k / d : undefined)
  const kda = toNum(data.kda) ?? (k !== undefined && d !== undefined && a !== undefined && d !== 0 ? (k + a) / d : undefined)
  const win_rate = toNum(data.win_rate) ?? (wins !== undefined && matches !== undefined && matches > 0 ? wins / matches : undefined)
  const kills = toNum(data.kills)
  const deaths = toNum(data.deaths)
  const assists = toNum(data.assists)
  const total_hero_damage_val = data.total_hero_damage
  const total_damage_taken_val = data.total_damage_taken
  const total_hero_heal_val = data.total_hero_heal
  const total_hero_damage = typeof total_hero_damage_val === 'string' ? total_hero_damage_val : (toNum(total_hero_damage_val) !== undefined ? String(toNum(total_hero_damage_val)) : undefined)
  const total_damage_taken = typeof total_damage_taken_val === 'string' ? total_damage_taken_val : (toNum(total_damage_taken_val) !== undefined ? String(toNum(total_damage_taken_val)) : undefined)
  const total_hero_heal = typeof total_hero_heal_val === 'string' ? total_hero_heal_val : (toNum(total_hero_heal_val) !== undefined ? String(toNum(total_hero_heal_val)) : undefined)
  const play_time = typeof data.play_time === 'string' ? data.play_time : undefined
  const mvps = toNum(data.mvps)
  const svps = toNum(data.svps)
  const session_hit_rate = toNum(data.session_hit_rate)
  const solo_kill = toNum(data.solo_kill)
  const average_score = toNum(data.average_score)

  return {
    hero_id: heroId,
    matches,
    wins,
    losses,
    win_rate,
    kills,
    deaths,
    assists,
    k,
    d,
    a,
    kd,
    kda,
    total_hero_damage,
    total_damage_taken,
    total_hero_heal,
    play_time,
    mvps,
    svps,
    session_hit_rate,
    solo_kill,
    average_score,
    raw: data
  }
}

export const fetchHeroCostumesFromApi = async (heroId: string): Promise<HeroCostumeRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  
  const response = await fetch(`https://marvelrivalsapi.com/api/v2/heroes/hero/${heroId}/costumes`, {
    headers: { "x-api-key": apiKey }
  })
  
  if (!response.ok) {
    return []
  }
  
  const data = await response.json()
  const costumesList = Array.isArray(data) ? data : data.costumes ?? data.data ?? []
  
  return costumesList.map((costume: any, index: number) => ({
    id: String(costume.id ?? `${heroId}-costume-${index}`),
    hero_id: heroId,
    name: costume.name ?? undefined,
    icon: costume.icon ?? undefined,
    image_url: costume.imageUrl ?? costume.image_url ?? undefined,
    quality: costume.quality ?? undefined,
    rarity: costume.rarity ?? undefined,
    description: costume.description ?? undefined,
    appearance: costume.appearance ?? undefined,
    raw: costume
  }))
}

export const fetchHeroLeaderboardFromApi = async (heroId: string, platform: string = 'pc'): Promise<HeroLeaderboardRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  
  const response = await fetch(`https://marvelrivalsapi.com/api/v1/heroes/leaderboard/${heroId}?platform=${platform}`, {
    headers: { "x-api-key": apiKey }
  })
  
  if (!response.ok) {
    return []
  }
  
  const data = await response.json()
  const players = Array.isArray(data?.players) 
    ? data.players 
    : Array.isArray(data?.leaderboard)
      ? data.leaderboard
      : Array.isArray(data)
        ? data
        : []
  
  return players.slice(0, 75).map((entry: any, index: number) => ({
    id: String(entry.player_uid ?? `${heroId}-${platform}-${index}`),
    hero_id: heroId,
    platform,
    rank: index + 1,
    player_uid: entry.player_uid ? String(entry.player_uid) : undefined,
    player_name: entry.info?.name ?? undefined,
    player_icon: entry.info?.icon?.player_icon ?? undefined,
    rank_score: entry.info?.rank_season?.rank_score ?? undefined,
    rank_level: typeof entry.info?.rank_season?.level === 'number' ? entry.info.rank_season.level : undefined,
    wins: typeof entry.wins === 'number' ? entry.wins : undefined,
    matches: typeof entry.matches === 'number' ? entry.matches : undefined,
    kills: typeof entry.kills === 'number' ? entry.kills : undefined,
    deaths: typeof entry.deaths === 'number' ? entry.deaths : undefined,
    assists: typeof entry.assists === 'number' ? entry.assists : undefined,
    play_time: typeof entry.play_time === 'string' ? entry.play_time : undefined,
    total_hero_damage: typeof entry.total_hero_damage === 'string' ? entry.total_hero_damage : undefined,
    total_damage_taken: typeof entry.total_damage_taken === 'string' ? entry.total_damage_taken : undefined,
    total_hero_heal: typeof entry.total_hero_heal === 'string' ? entry.total_hero_heal : undefined,
    mvps: typeof entry.mvps === 'number' ? entry.mvps : undefined,
    svps: typeof entry.svps === 'number' ? entry.svps : undefined,
    raw: entry
  }))
}

