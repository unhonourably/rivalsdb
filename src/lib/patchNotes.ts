import pool, { runQuery } from "@/lib/mysql"

export interface PatchNoteRecord {
  id: string
  title: string
  date_label?: string
  preview?: string
  content?: string
  html?: string
  image_path?: string
  raw?: unknown
}

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patch_notes (
      id VARCHAR(128) PRIMARY KEY,
      title VARCHAR(512) NOT NULL,
      date_label VARCHAR(255),
      preview TEXT,
      content TEXT,
      html TEXT,
      image_path VARCHAR(512),
      raw_json JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export const getAllPatchNotes = async (): Promise<PatchNoteRecord[]> => {
  await ensureTable()
  const rows = await runQuery<Array<{
    id: string
    title: string
    date_label: string | null
    preview: string | null
    content: string | null
    html: string | null
    image_path: string | null
    raw_json: unknown
  }>>(`SELECT id, title, date_label, preview, content, html, image_path, raw_json FROM patch_notes ORDER BY date_label DESC`)
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
    html: row.html ?? undefined,
    image_path: row.image_path ?? undefined,
    raw: parseJsonField(row.raw_json)
  }))
}

export const savePatchNotes = async (items: PatchNoteRecord[]) => {
  if (items.length === 0) return
  await ensureTable()
  const values = items.map((item) => [
    item.id,
    item.title,
    item.date_label ?? null,
    item.preview ?? null,
    item.content ?? null,
    item.html ?? null,
    item.image_path ?? null,
    item.raw ? JSON.stringify(item.raw) : null
  ])
  const chunkSize = 100
  for (let index = 0; index < values.length; index += chunkSize) {
    const chunk = values.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, JSON_EXTRACT(?, '$'))").join(",")
    await pool.query(
      `INSERT INTO patch_notes (id, title, date_label, preview, content, html, image_path, raw_json)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         date_label = VALUES(date_label),
         preview = VALUES(preview),
         content = VALUES(content),
         html = VALUES(html),
         image_path = VALUES(image_path),
         raw_json = VALUES(raw_json)`,
      chunk.flat()
    )
  }
}

export const fetchPatchNotesFromApi = async (): Promise<PatchNoteRecord[]> => {
  const apiKey = process.env.MARVEL_API_KEY
  if (!apiKey) throw new Error("MARVEL_API_KEY is not set")
  const aggregated: PatchNoteRecord[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const response = await fetch(`https://marvelrivalsapi.com/api/v1/patch-notes?page=${page}&limit=100`, {
      headers: { "x-api-key": apiKey }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch patch notes (${response.status})`)
    }
    const data = await response.json()
    const patches = Array.isArray(data?.formatted_patches) ? data.formatted_patches : []
    if (page === 1 && patches.length > 0) {
      console.log('Sample patch note entry:', JSON.stringify(patches[0], null, 2))
    }
    patches.forEach((patch: any, index: number) => {
      const id = patch.id ?? patch.patchTitle ?? `patch-${page}-${index}`
      const dateValue = patch.patchDate ?? patch.date ?? patch.releaseDate ?? patch.release_date ?? patch.published_at ?? patch.created_at
      const previewValue = patch.previewText ?? patch.preview ?? patch.description ?? patch.summary ?? patch.overview
      const contentValue = patch.fullContent ?? patch.content ?? patch.body ?? patch.text
      const htmlValue = patch.htmlContent ?? patch.html ?? patch.html_content
      const imageValue = patch.imagePath ?? patch.image ?? patch.image_path ?? patch.thumbnail ?? patch.icon
      
      aggregated.push({
        id: String(id),
        title: patch.patchTitle ?? patch.title ?? patch.patchType ?? 'Patch Update',
        date_label: dateValue,
        preview: previewValue,
        content: contentValue,
        html: htmlValue,
        image_path: imageValue,
        raw: patch
      })
    })
    const reportedPages = Number(data?.total_pages)
    const reportedCount = Number(data?.total_patches)
    if (Number.isFinite(reportedPages) && reportedPages > 0) {
      totalPages = reportedPages
    } else if (Number.isFinite(reportedCount) && patches.length > 0) {
      totalPages = Math.ceil(reportedCount / patches.length)
    } else {
      totalPages = page
    }
    page += 1
  }
  const unique = new Map<string, PatchNoteRecord>()
  aggregated.forEach((item) => {
    unique.set(item.id, item)
  })
  return Array.from(unique.values())
}

