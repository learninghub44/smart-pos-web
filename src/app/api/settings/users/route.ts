import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'
import { checkPlanLimit, hashPassword } from '@/lib/tenant-auth'

// Staff management — list / add / remove tenant_users.
// Mirrors branches/route.ts conventions: owner/admin can manage staff,
// cashiers cannot.

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  return ok(await query(
    `SELECT tu.id, tu.name, tu.email, tu.role, tu.branch_id, tu.is_active,
            tu.last_login_at, tu.created_at, b.name as branch_name
     FROM tenant_users tu
     LEFT JOIN branches b ON b.id = tu.branch_id
     WHERE tu.tenant_id = $1
     ORDER BY tu.created_at DESC`,
    [user.tenant_id]
  ))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth

  if (user.role === 'cashier') return err('Forbidden', 403)

  const b = await req.json()
  const name = (b.name || '').trim()
  const email = (b.email || '').trim().toLowerCase()
  const password = b.password || ''
  const role = b.role || 'cashier'
  const branch_id = b.branch_id || null

  if (!name || !email || !password) {
    return err('Name, email, and password are required', 400)
  }
  if (!['owner', 'admin', 'cashier'].includes(role)) {
    return err('Invalid role', 400)
  }
  // Only an owner can create another owner or admin — mirrors the branch
  // deletion restriction (owner-only) since these roles can manage billing.
  if ((role === 'owner' || role === 'admin') && user.role !== 'owner') {
    return err('Only the owner can assign admin or owner roles', 403)
  }
  if (password.length < 6) {
    return err('Password must be at least 6 characters', 400)
  }

  const check = await checkPlanLimit(user.tenant_id, 'users')
  if (!check.allowed) {
    return err(`Plan limit reached: ${check.limit} staff member${check.limit === 1 ? '' : 's'} max`, 403)
  }

  const existing = await queryOne(
    'SELECT id FROM tenant_users WHERE tenant_id = $1 AND email = $2',
    [user.tenant_id, email]
  )
  if (existing) return err('A staff member with this email already exists', 409)

  const password_hash = await hashPassword(password)

  const created = await queryOne(
    `INSERT INTO tenant_users (tenant_id, name, email, password_hash, role, branch_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, name, email, role, branch_id, is_active, created_at`,
    [user.tenant_id, name, email, password_hash, role, branch_id]
  )
  return ok(created, 201)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth

  if (user.role === 'cashier') return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Missing id', 400)
  if (id === user.id) return err('You cannot remove your own account', 400)

  const target = await queryOne<{ role: string }>(
    'SELECT role FROM tenant_users WHERE id = $1 AND tenant_id = $2',
    [id, user.tenant_id]
  )
  if (!target) return err('Staff member not found', 404)
  if (target.role === 'owner') return err('The owner account cannot be removed', 403)
  if (target.role === 'admin' && user.role !== 'owner') {
    return err('Only the owner can remove an admin', 403)
  }

  await query('DELETE FROM tenant_users WHERE id = $1 AND tenant_id = $2', [id, user.tenant_id])
  return ok({ success: true })
}
