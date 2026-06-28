import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/tenant-auth'
import { queryOne } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromCookie(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role === 'cashier') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { logo_url } = await req.json()

  // Accept: null (remove logo), a https:// URL, or a base64 data URL
  if (logo_url !== null && logo_url !== undefined) {
    if (typeof logo_url !== 'string') {
      return NextResponse.json({ error: 'logo_url must be a string or null' }, { status: 400 })
    }
    if (!logo_url.startsWith('data:image/') && !logo_url.startsWith('https://')) {
      return NextResponse.json({ error: 'logo_url must be a data URI or https URL' }, { status: 400 })
    }
    // Limit size to ~500 KB for base64
    if (logo_url.length > 700_000) {
      return NextResponse.json({ error: 'Logo too large. Please use an image under 400 KB.' }, { status: 413 })
    }
  }

  await queryOne('UPDATE tenants SET logo_url=$1, updated_at=NOW() WHERE id=$2', [logo_url ?? null, user.tenant_id])
  return NextResponse.json({ success: true, logo_url: logo_url ?? null })
}

export async function GET(req: NextRequest) {
  const user = await getSessionFromCookie(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenant = await queryOne<{ logo_url: string | null }>('SELECT logo_url FROM tenants WHERE id=$1', [user.tenant_id])
  return NextResponse.json({ logo_url: tenant?.logo_url ?? null })
}
