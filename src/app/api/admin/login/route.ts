import { NextRequest, NextResponse } from 'next/server'
import { signToken, verifyPassword } from '@/lib/tenant-auth'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const admin = await queryOne<any>(
      `SELECT id, email, password_hash, name FROM super_admins WHERE email = $1 AND is_active = true`,
      [email.toLowerCase().trim()]
    )

    if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await verifyPassword(password, admin.password_hash)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

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
