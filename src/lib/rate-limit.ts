/**
 * Rate limiter backed by Neon Postgres.
 *
 * An in-memory Map does NOT work on Cloudflare Workers: each request can
 * land on a different isolate with its own memory, so a per-isolate
 * counter never actually limits anything across the fleet. Postgres is the
 * one store every isolate can see consistently, and Neon's HTTP/WebSocket
 * driver is already Workers-compatible (see db.ts) — no new infra needed.
 */

import { query } from './db'

export interface RateLimitRule {
  key: string        // e.g. `login:ip:${ip}` or `login:email:${email}`
  maxHits: number     // max attempts allowed within windowMs
  windowMs: number
}

// Opportunistic cleanup so the table doesn't grow unbounded — cheap and
// runs on a small fraction of calls rather than a background timer, since
// Workers isolates can be evicted at any time and a setInterval-based
// cleanup (the old approach) is not guaranteed to ever fire.
async function maybeCleanup(): Promise<void> {
  if (Math.random() > 0.02) return
  try {
    await query(`DELETE FROM rate_limit_hits WHERE created_at < NOW() - INTERVAL '1 day'`)
  } catch {
    // Non-fatal — table may not exist yet on a fresh DB; see ensureTable() below.
  }
}

let ensured = false
async function ensureTable(): Promise<void> {
  if (ensured) return
  await query(`
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`
    CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_key_time
    ON rate_limit_hits (key, created_at)
  `)
  ensured = true
}

/**
 * Checks one or more rules and records this attempt. Returns true if ANY
 * rule is already over its limit (request should be blocked). Records the
 * hit regardless, so repeated blocked attempts keep extending the window
 * rather than resetting it.
 */
export async function checkRateLimit(rules: RateLimitRule[]): Promise<boolean> {
  await ensureTable()
  void maybeCleanup()

  let blocked = false

  for (const rule of rules) {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM rate_limit_hits
       WHERE key = $1 AND created_at > NOW() - ($2 || ' milliseconds')::interval`,
      [rule.key, rule.windowMs]
    )
    const count = parseInt(rows[0]?.count || '0', 10)
    if (count >= rule.maxHits) {
      blocked = true
    }
  }

  // Record this attempt for every rule so the window keeps advancing.
  await Promise.all(
    rules.map(rule =>
      query(`INSERT INTO rate_limit_hits (key) VALUES ($1)`, [rule.key])
    )
  )

  return blocked
}

/** Extract best-effort client IP from a Next.js/Workers request. */
export function getClientIp(req: Request): string {
  const h = (req as any).headers
  const fwd = h?.get?.('cf-connecting-ip') || h?.get?.('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return 'unknown'
}
