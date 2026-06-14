import { supabase } from './supabase'
import { addUserToDB, getCurrentUser, clearCurrentUser } from './indexeddb'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'cashier'
}

// Simple password hashing for demo (use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Try Supabase authentication first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError) {
      console.error('User lookup error:', userError)
    }
    
    if (userData) {
      // Verify password hash
      const isValid = await verifyPassword(password, userData.password_hash)
      
      if (isValid) {
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        }
        
        // Store in IndexedDB for offline access
        await addUserToDB(user)
        
        return { success: true, user }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    }
    
    // Fallback to demo credentials for initial setup
    // These should be removed in production
    if (email === 'admin@smartpos.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-001',
        name: 'Admin User',
        email: 'admin@smartpos.com',
        role: 'admin'
      }
      
      // Store in IndexedDB for offline access
      await addUserToDB(adminUser)
      
      return { success: true, user: adminUser }
    }
    
    if (email === 'cashier@smartpos.com' && password === 'cashier123') {
      const cashierUser: User = {
        id: 'cashier-001',
        name: 'Cashier User',
        email: 'cashier@smartpos.com',
        role: 'cashier'
      }
      
      // Store in IndexedDB for offline access
      await addUserToDB(cashierUser)
      
      return { success: true, user: cashierUser }
    }
    
    return { success: false, error: 'Invalid credentials' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

export async function register(name: string, email: string, password: string, role: 'admin' | 'cashier'): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role
      })
      .select()
      .single()
    
    if (createError || !newUser) {
      return { success: false, error: 'Failed to create user' }
    }
    
    const user: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
    
    return { success: true, user }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

export async function logout(): Promise<void> {
  await clearCurrentUser()
  // In production, also call Supabase auth logout if using Supabase Auth
}

export async function getCurrentAuthUser(): Promise<User | null> {
  // Try to get from IndexedDB first (offline support)
  const localUser = await getCurrentUser()
  if (localUser) {
    return localUser
  }
  
  // If no local user, return null
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
  
  // Admin has all permissions
  if (user.role === 'admin') return true
  
  // Cashier permissions
  const cashierPermissions = ['pos', 'sales_history', 'profile']
  return cashierPermissions.includes(permission)
}
