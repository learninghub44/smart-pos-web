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
  var _neonPoolConnStr: string | undefined
}

function createPool(connectionString: string) {
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

// Lazily create (and cache) the pool on first *request-time* use, never at
// module-eval time. On Cloudflare Workers, process.env is only populated
// inside a request's execution context — reading it at the top of the
// module (before any request exists) permanently bakes in `undefined` for
// that isolate's lifetime. Reading it lazily, inside a function that only
// ever runs during a request, sidesteps that entirely.
function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Set it via `wrangler secret put DATABASE_URL` (prod) ' +
      'or in .env.local (dev).'
    )
  }
  // Recreate if missing, or if the connection string changed (defensive —
  // shouldn't happen in prod, but avoids a stale pool during local dev
  // when .env.local changes without a full restart).
  if (!global._neonPool || global._neonPoolConnStr !== connectionString) {
    global._neonPool = createPool(connectionString)
    global._neonPoolConnStr = connectionString
  }
  return global._neonPool
}

// Kept as a callable export for anywhere that wants direct pool access
// (e.g. withTransaction below) — still lazy, still request-time only.
export function pool(): Pool {
  return getPool()
}

export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const client = await getPool().connect()
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
  const client: PoolClient = await getPool().connect()
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
