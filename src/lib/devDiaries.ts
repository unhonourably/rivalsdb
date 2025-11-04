import pool, { runQuery } from "@/lib/mysql"

export interface DevDiaryRecord {
  id: string
  title: string
  date_label?: string
  preview?: string
  content?: string
  image_path?: string
  raw?: unknown
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dev_diaries (
      id VARCHAR(128) PRIMARY KEY,
      title VARCHAR(512) NOT NULL,
      date_label VARCHAR(255),
      preview TEXT,
      content TEXT,
      image_path VARCHAR(512),
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export const getAllDevDiaries = async (): Promise<DevDiaryRecord[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    id: string
    title: string
    date_label: string | null
    preview: string | null
    content: string | null
    image_path: string | null
    raw_json: unknown
  }>>(`SELECT id, title, date_label, preview, content, image_path, raw_json FROM dev_diaries ORDER BY date_label DESC`)
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
    title: row.title,
    date_label: row.date_label ?? undefined,
    preview: row.preview ?? undefined,
    content: row.content ?? undefined,
    image_path: row.image_path ?? undefined,
    raw: parseJsonField(row.raw_json)
  }))
}

export const saveDevDiaries = async (items: DevDiaryRecord[]) => {
  if (items.length === 0) return
  await ensureTable()
  const values = items.map((item) => [
    item.id,
    item.title,
    item.date_label ?? null,
    item.preview ?? null,
    item.content ?? null,
    item.image_path ?? null,
    item.raw ? JSON.stringify(item.raw) : null
  ])
  const chunkSize = 100
  for (let index = 0; index < values.length; index += chunkSize) {
    const chunk = values.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
    await pool.query(
      `INSERT INTO dev_diaries (id, title, date_label, preview, content, image_path, raw_json)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         date_label = VALUES(date_label),
         preview = VALUES(preview),
         content = VALUES(content),
         image_path = VALUES(image_path),
         raw_json = VALUES(raw_json)`,
      chunk.flat()
    )
  }
}

export const fetchDevDiariesFromApi = async (): Promise<DevDiaryRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const aggregated: DevDiaryRecord[] = []
  let page = 1
  let totalPages = 1
  
  while (page <= totalPages && page <= 10) {
    const response = await fetch(`https://marvelrivalsapi.com/api/v1/dev-diaries?page=${page}&limit=100`, {
      headers: { "x-api-key": apiKey }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch dev diaries (${response.status})`)
    }
    const data = await response.json()
    if (page === 1) {
      console.log('Dev diaries API response:', data)
    }
    const diaries = Array.isArray(data?.formatted_entries)
      ? data.formatted_entries
      : Array.isArray(data?.entries)
        ? data.entries
        : Array.isArray(data?.dev_diaries)
          ? data.dev_diaries
          : Array.isArray(data)
            ? data
            : []
    
    if (page === 1) {
      console.log('Parsed diaries array:', diaries)
      if (diaries.length > 0) {
        console.log('Sample dev diary entry:', JSON.stringify(diaries[0], null, 2))
      }
    }
    
    diaries.forEach((diary: any, index: number) => {
      const id = diary.id ?? diary.title ?? `dev-diary-${page}-${index}`
      const dateValue = diary.date ?? diary.patchDate ?? diary.releaseDate ?? diary.release_date ?? diary.published_at ?? diary.created_at
      const previewValue = diary.overview ?? diary.preview ?? diary.previewText ?? diary.description ?? diary.summary
      const contentValue = diary.fullContent ?? diary.content ?? diary.body ?? diary.text
      const imageValue = diary.imagePath ?? diary.image ?? diary.image_path ?? diary.thumbnail ?? diary.icon
      
      aggregated.push({
        id: String(id),
        title: diary.title ?? 'Dev Diary',
        date_label: dateValue,
        preview: previewValue,
        content: contentValue,
        image_path: imageValue,
        raw: diary
      })
    })
    
    const reportedPages = Number(data?.total_pages)
    const reportedCount = Number(data?.total_entries)
    if (Number.isFinite(reportedPages) && reportedPages > 0) {
      totalPages = reportedPages
    } else if (Number.isFinite(reportedCount) && diaries.length > 0) {
      totalPages = Math.ceil(reportedCount / diaries.length)
    } else {
      totalPages = page
    }
    page += 1
  }
  
  const unique = new Map<string, DevDiaryRecord>()
  aggregated.forEach((item) => {
    unique.set(item.id, item)
  })
  return Array.from(unique.values())
}

