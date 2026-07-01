import { Pool, neonConfig, type PoolClient } from '@neondatabase/serverless'

// On Cloudflare Workers/Pages the global WebSocket is already available, so no
// extra config is needed there. In local dev / Node.js runtimes we need the
// `ws` package as a WebSocket polyfill for the pooled (transaction-capable) driver.
if (typeof WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  neonConfig.webSocketConstructor = require('ws')
}

declare global {
  // eslint-disable-next-line no-var
  var _neonPool: Pool | undefined
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

// Singleton pool — reused across hot-reloads in dev / warm invocations in prod
export const pool = global._neonPool ?? createPool()
if (process.env.NODE_ENV !== 'production') global._neonPool = pool

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

// Use this for multi-statement transactions (BEGIN/COMMIT/ROLLBACK) — same
// client for the whole block, same API as node-postgres.
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
