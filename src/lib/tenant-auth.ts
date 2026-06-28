import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query, queryOne } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const COOKIE_NAME = 'smartpos_token'

export interface TenantUser {
  id: string
  tenant_id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'cashier'
  branch_id: string | null
  branch_name: string | null
}

export interface Tenant {
  id: string
  business_name: string
  slug: string
  plan_id: string
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at: string | null
  currency: string
}

export interface JWTPayload {
  userId: string
  tenantId: string
  role: string
  tenantStatus?: string   // included so middleware can guard without a DB call
  iat?: number
  exp?: number
}

// ── Server-side only ──────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSessionFromCookie(cookieHeader: string | null): Promise<TenantUser | null> {
  if (!cookieHeader) return null
  const match = cookieHeader.split(';').find(c => c.trim().startsWith(COOKIE_NAME + '='))
  if (!match) return null
  const token = match.split('=')[1]?.trim()
  if (!token) return null
  return getSessionFromToken(token)
}

export async function getSessionFromToken(token: string): Promise<TenantUser | null> {
  const payload = verifyToken(token)
  if (!payload) return null

  const user = await queryOne<any>(`
    SELECT tu.*, b.name as branch_name
    FROM tenant_users tu
    LEFT JOIN branches b ON b.id = tu.branch_id
    WHERE tu.id = $1 AND tu.is_active = true
  `, [payload.userId])

  if (!user) return null

  return {
    id: user.id,
    tenant_id: user.tenant_id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch_id: user.branch_id,
    branch_name: user.branch_name,
  }
}

export function makeCookie(token: string): string {
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`
}

export function clearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

// ── Tenant helpers ────────────────────────────────────────────

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  return queryOne<Tenant>(
    'SELECT id, business_name, slug, plan_id, status, trial_ends_at, currency FROM tenants WHERE id = $1',
    [tenantId]
  )
}

export async function getTenantPlan(tenantId: string) {
  return queryOne<any>(`
    SELECT p.*, t.status as tenant_status, t.trial_ends_at
    FROM tenants t
    JOIN plans p ON p.id = t.plan_id
    WHERE t.id = $1
  `, [tenantId])
}

export function isTenantActive(tenant: { status: string; trial_ends_at: string | null }): boolean {
  if (tenant.status === 'active') return true
  if (tenant.status === 'pending_payment') return false  // must pay first
  if (tenant.status === 'trial') {
    if (!tenant.trial_ends_at) return true  // trial started, no end date set yet
    return new Date(tenant.trial_ends_at) > new Date()
  }
  return false
}

// ── Slug generator ────────────────────────────────────────────

export function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

// ── Plan limits guard ─────────────────────────────────────────

export async function checkPlanLimit(
  tenantId: string,
  resource: 'branches' | 'users' | 'products'
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const plan = await getTenantPlan(tenantId)
  if (!plan) return { allowed: false, limit: 0, current: 0 }

  const limitKey: Record<string, string> = {
    branches: 'max_branches',
    users: 'max_users',
    products: 'max_products',
  }
  const limit: number = plan[limitKey[resource]]
  if (limit === -1) return { allowed: true, limit: -1, current: 0 }

  const tableMap: Record<string, string> = {
    branches: 'branches',
    users: 'tenant_users',
    products: 'products',
  }
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM ${tableMap[resource]} WHERE tenant_id = $1`,
    [tenantId]
  )
  const current = parseInt(row?.count || '0')
  return { allowed: current < limit, limit, current }
}
