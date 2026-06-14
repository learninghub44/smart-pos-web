import { getCurrentAuthUser } from './auth'

export async function logAuditEvent(params: {
  action: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
}) {
  try {
    const user = await getCurrentAuthUser()
    
    const auditLog = {
      id: crypto.randomUUID(),
      user_id: user?.id || null,
      action: params.action,
      table_name: params.table_name || null,
      record_id: params.record_id || null,
      old_values: params.old_values || null,
      new_values: params.new_values || null,
      ip_address: null, // Could be enhanced with real IP detection
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      created_at: new Date().toISOString()
    }
    
    // Try to save to Supabase
    try {
      const { supabase } = await import('./supabase')
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditLog)
      
      if (!error) {
        // Also save to IndexedDB for offline backup
        const { addAuditLogToDB } = await import('./indexeddb')
        await addAuditLogToDB(auditLog)
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB only')
    }
    
    // Fall back to IndexedDB only
    const { addAuditLogToDB } = await import('./indexeddb')
    await addAuditLogToDB(auditLog)
  } catch (error) {
    console.error('Error logging audit event:', error)
  }
}

export async function getAuditLogs(filters?: {
  user_id?: string
  table_name?: string
  action?: string
  limit?: number
}) {
  try {
    const { supabase } = await import('./supabase')
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.table_name) {
      query = query.eq('table_name', filters.table_name)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query
    
    if (data && !error) {
      return data
    }
  } catch (error) {
    console.log('Supabase not available, using IndexedDB')
  }
  
  // Fall back to IndexedDB
  const { getAllAuditLogs } = await import('./indexeddb')
  const allLogs = await getAllAuditLogs()
  
  let filtered = allLogs
  
  if (filters?.user_id) {
    filtered = filtered.filter(log => log.user_id === filters.user_id)
  }
  if (filters?.table_name) {
    filtered = filtered.filter(log => log.table_name === filters.table_name)
  }
  if (filters?.action) {
    filtered = filtered.filter(log => log.action === filters.action)
  }
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit)
  }
  
  return filtered
}
