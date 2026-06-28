import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/tenant-auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getSessionFromCookie(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await query(
    'SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20',
    [user.tenant_id]
  )
  return NextResponse.json({ invoices })
}
