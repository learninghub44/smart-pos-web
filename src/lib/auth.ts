// Auth uses sessionStorage to track the current logged-in user.
// User lookup and password verification is done against Supabase.
// IndexedDB stores user records for offline fallback.

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'cashier'
}

const SESSION_KEY = 'smartpos_user'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { supabase } = await import('./supabase')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (userError || !userData) {
      // Also try without lowercasing in case email was stored differently
      const { data: userData2 } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .single()

      if (!userData2) {
        return { success: false, error: 'No account found with this email.' }
      }

      const isValid = await hashPassword(password).then(h => h === userData2.password_hash)
      if (!isValid) return { success: false, error: 'Incorrect password.' }

      const user: User = { id: userData2.id, name: userData2.name, email: userData2.email, role: userData2.role }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
      return { success: true, user }
    }

    const passwordHash = await hashPassword(password)
    if (passwordHash !== userData.password_hash) {
      return { success: false, error: 'Incorrect password.' }
    }

    const user: User = { id: userData.id, name: userData.name, email: userData.email, role: userData.role }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))

    // Cache in IndexedDB for offline use
    try {
      const { storeCurrentUser } = await import('./indexeddb')
      await storeCurrentUser(user)
    } catch (_) {}

    return { success: true, user }

  } catch (error: any) {
    console.error('Login error:', error)

    // Offline fallback — check IndexedDB
    try {
      const { getCachedUser } = await import('./indexeddb')
      const cachedUser = await getCachedUser(email.trim())
      if (cachedUser) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(cachedUser))
        return { success: true, user: cachedUser }
      }
    } catch (_) {}

    return { success: false, error: 'Could not connect. Check your internet connection.' }
  }
}

export async function logout(): Promise<void> {
  sessionStorage.removeItem(SESSION_KEY)
  try {
    const { clearCurrentUser } = await import('./indexeddb')
    await clearCurrentUser()
  } catch (_) {}
}

export function getCurrentAuthUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) return JSON.parse(stored) as User
  } catch (_) {}
  return null
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function isCashier(user: User | null): boolean {
  return user?.role === 'cashier'
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  const cashierPermissions = ['pos', 'sales_history', 'receipts', 'customers']
  return cashierPermissions.includes(permission)
}

// Helper for creating users (run once from admin)
export async function register(name: string, email: string, password: string, role: 'admin' | 'cashier'): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { supabase } = await import('./supabase')
    const passwordHash = await hashPassword(password)

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email: email.trim().toLowerCase(), password_hash: passwordHash, role })
      .select()
      .single()

    if (error || !newUser) return { success: false, error: error?.message || 'Failed to create user' }

    const user: User = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' }
  }
}
