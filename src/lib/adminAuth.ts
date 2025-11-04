import pool, { runQuery } from "@/lib/mysql"
import crypto from 'crypto'

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_auth (
      id INT PRIMARY KEY DEFAULT 1,
      password_hash VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
  
  const rows = await runQuery<Array<{ id: number }>>(`SELECT id FROM admin_auth WHERE id = 1`)
  
  if (rows.length === 0) {
    const defaultPassword = 'haveanicelife21'
    const hash = hashPassword(defaultPassword)
    await pool.query(`INSERT INTO admin_auth (id, password_hash) VALUES (1, ?)`, [hash])
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  await ensureTable()
  const hash = hashPassword(password)
  const rows = await runQuery<Array<{ password_hash: string }>>(
    `SELECT password_hash FROM admin_auth WHERE id = 1`
  )
  
  if (rows.length === 0) return false
  return rows[0].password_hash === hash
}

export async function changeAdminPassword(oldPassword: string, newPassword: string): Promise<boolean> {
  await ensureTable()
  
  const isValid = await verifyAdminPassword(oldPassword)
  if (!isValid) return false
  
  const newHash = hashPassword(newPassword)
  await pool.query(`UPDATE admin_auth SET password_hash = ? WHERE id = 1`, [newHash])
  return true
}

