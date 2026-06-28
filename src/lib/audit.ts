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
      ip_address: null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      created_at: new Date().toISOString()
    }

    // Save to Railway API
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditLog),
      })
      return
    } catch (_) {}

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
    const params = new URLSearchParams()
    if (filters?.user_id) params.set('user_id', filters.user_id)
    if (filters?.table_name) params.set('table_name', filters.table_name)
    if (filters?.action) params.set('action', filters.action)
    if (filters?.limit) params.set('limit', String(filters.limit))

    const res = await fetch(`/api/audit-logs?${params}`)
    if (res.ok) {
      const json = await res.json()
      return json.data ?? json
    }
  } catch (_) {}

  // Fall back to IndexedDB
  const { getAllAuditLogs } = await import('./indexeddb')
  let filtered = await getAllAuditLogs()
  if (filters?.user_id) filtered = filtered.filter(l => l.user_id === filters.user_id)
  if (filters?.table_name) filtered = filtered.filter(l => l.table_name === filters.table_name)
  if (filters?.action) filtered = filtered.filter(l => l.action === filters.action)
  if (filters?.limit) filtered = filtered.slice(0, filters.limit)
  return filtered
}
