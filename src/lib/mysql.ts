import mysql from "mysql2/promise"

declare global {
  var __mysqlPool: mysql.Pool | undefined
}

const pool = global.__mysqlPool ?? mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? "3306"),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? "10"),
  maxIdle: Number(process.env.MYSQL_MAX_IDLE ?? "10"),
  idleTimeout: Number(process.env.MYSQL_IDLE_TIMEOUT ?? "60000"),
  enableKeepAlive: true,
  keepAliveInitialDelay: Number(process.env.MYSQL_KEEP_ALIVE_DELAY ?? "0")
})

if (!global.__mysqlPool) {
  global.__mysqlPool = pool
}

export default pool

export const runQuery = async <T = mysql.RowDataPacket[]>(sql: string, params?: Array<string | number | boolean | null>) => {
  const [rows] = await pool.query(sql, params)
  return rows as T
}

