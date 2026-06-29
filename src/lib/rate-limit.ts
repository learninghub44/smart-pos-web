/**
 * In-memory rate limiter for Next.js API routes.
 * Keyed by IP + endpoint. Resets on server restart — sufficient for
 * Railway/Render single-instance deployments. For multi-instance, swap
 * the Map for a Redis store using the same interface.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 10 minutes to avoid memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

/**
 * Returns true if the request should be blocked.
 * @param key       unique key, e.g. `login:${ip}`
 * @param maxHits   max allowed hits in the window
 * @param windowMs  window length in ms
 */
export function isRateLimited(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count++
  if (entry.count > maxHits) return true
  return false
}

/** Extract best-effort IP from a Next.js request. */
export function getClientIp(req: Request): string {
  const fwd = (req as any).headers?.get?.('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return 'unknown'
}
