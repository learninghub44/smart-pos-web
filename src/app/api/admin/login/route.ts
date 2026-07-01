import { NextRequest, NextResponse } from 'next/server'
import { signToken, verifyPassword, DUMMY_HASH } from '@/lib/tenant-auth'
import { queryOne } from '@/lib/db'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const emailLower = email.toLowerCase().trim()
    const ip = getClientIp(req)

    // Admin accounts are high-value targets — tighter limits than tenant login.
    const limited = await checkRateLimit([
      { key: `admin-login:ip:${ip}`, maxHits: 10, windowMs: 15 * 60 * 1000 },
      { key: `admin-login:email:${emailLower}`, maxHits: 5, windowMs: 15 * 60 * 1000 },
    ])
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const admin = await queryOne<any>(
      `SELECT id, email, password_hash, name FROM super_admins WHERE email = $1 AND is_active = true`,
      [emailLower]
    )

    // Always await verifyPassword so response time doesn't reveal whether
    // an admin account exists for this email.
    const valid = await verifyPassword(password, admin?.password_hash || DUMMY_HASH)
    if (!admin || !valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = signToken({ userId: admin.id, tenantId: 'super', role: 'super_admin' })

    const cookie = `smartpos_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`

    return NextResponse.json(
      { success: true, name: admin.name },
      { headers: { 'Set-Cookie': cookie } }
    )
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
