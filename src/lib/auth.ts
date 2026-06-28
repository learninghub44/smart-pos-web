// Tenant-aware auth client — uses JWT cookie via /api/auth/*
// Replaces the old Supabase-based auth

export interface User {
  id: string
  tenant_id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'cashier'
  branch_id: string | null
  branch_name: string | null
  business_name?: string
  logo_url?: string | null
}

const BRANCH_KEY = 'smartpos_active_branch'
const BRAND_KEY = 'smartpos_brand'

export interface RememberedBrand {
  business_name: string | null
  logo_url: string | null
}

export function getRememberedBrand(): RememberedBrand | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BRAND_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function rememberBrand(user: User): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BRAND_KEY, JSON.stringify({
      business_name: user.business_name || null,
      logo_url: user.logo_url || null,
    }))
  } catch {}
}

export function updateRememberedLogo(logo_url: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const current = getRememberedBrand()
    localStorage.setItem(BRAND_KEY, JSON.stringify({
      business_name: current?.business_name || null,
      logo_url,
    }))
  } catch {}
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'Login failed' }
    if (data.user) rememberBrand(data.user)
    return { success: true, user: data.user }
  } catch {
    return { success: false, error: 'Cannot connect. Check your internet.' }
  }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
  sessionStorage.removeItem(BRANCH_KEY)
  try { localStorage.removeItem(BRAND_KEY) } catch {}
}

export async function getCurrentAuthUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return null
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}

export function getActiveBranchId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(BRANCH_KEY) || null
}

export function setActiveBranchId(id: string | null): void {
  if (typeof window === 'undefined') return
  if (id) sessionStorage.setItem(BRANCH_KEY, id)
  else sessionStorage.removeItem(BRANCH_KEY)
}

export function isAdmin(user: User | null) { return user?.role === 'admin' || user?.role === 'owner' }
export function isCashier(user: User | null) { return user?.role === 'cashier' }
export function isOwner(user: User | null) { return user?.role === 'owner' }
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'owner') return true
  return ['pos', 'sales_history', 'receipts', 'customers'].includes(permission)
}
