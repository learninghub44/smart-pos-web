import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, getTenant } from '@/lib/tenant-auth'

export async function GET(req: NextRequest) {
  const user = await getSessionFromCookie(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  const tenant = await getTenant(user.tenant_id)
  return NextResponse.json({ user, tenant })
}
