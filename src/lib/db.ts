import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

// Singleton pool — reused across hot-reloads in dev
export const pool = global._pgPool ?? createPool()
if (process.env.NODE_ENV !== 'production') global._pgPool = pool

export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, values)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

export async function queryOne<T = any>(sql: string, values?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, values)
  return rows[0] ?? null
}
