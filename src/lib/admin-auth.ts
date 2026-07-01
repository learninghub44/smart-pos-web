import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './tenant-auth'

const ADMIN_COOKIE_NAME = 'smartpos_admin'

function getAdminToken(req: NextRequest): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.split(';').find(c => c.trim().startsWith(`${ADMIN_COOKIE_NAME}=`))
  return match ? match.split('=')[1]?.trim() || null : null
}

/** Verifies the smartpos_admin cookie and confirms super_admin role. */
export async function verifyAdmin(req: NextRequest): Promise<JWTPayload | null> {
  const token = getAdminToken(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}
