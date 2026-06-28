import {
  getUnsyncedSales,
  getUnsyncedActions,
  markActionAsSynced,
  getAllProducts,
  addProductToDB,
  updateProductInDB,
  getAllCategories,
  addCategoryToDB,
  updateCategoryInDB,
  getAllBrands,
  addBrandToDB,
  updateBrandInDB,
  getAllCustomers,
  addCustomerToDB,
  updateCustomerInDB,
  getAllSuppliers,
  addSupplierToDB,
  updateSupplierInDB,
  updateSaleInDB,
} from './indexeddb'

async function api(path: string, method = 'GET', body?: any) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`)
  const json = await res.json()
  return json.data ?? json
}

export async function syncToServer() {
  if (!navigator.onLine) return { success: false, message: 'Device is offline' }

  try {
    // Sync unsynced sales
    const unsyncedSales = await getUnsyncedSales()
    for (const sale of unsyncedSales) {
      try {
        await api('/api/sales', 'POST', sale)
        await updateSaleInDB({ ...sale, synced: true })
      } catch (e) {
        console.error(`Failed to sync sale ${sale.id}:`, e)
      }
    }

    // Sync offline queue actions
    const unsyncedActions = await getUnsyncedActions()
    for (const action of unsyncedActions) {
      try {
        switch (action.action_type) {
          case 'add_product':    await api('/api/products', 'POST', action.payload); break
          case 'update_product': await api('/api/products', 'PUT', action.payload); break
          case 'delete_product': await api('/api/products', 'DELETE', { id: (action.payload as any).id }); break
          case 'add_category':    await api('/api/categories', 'POST', action.payload); break
          case 'update_category': await api('/api/categories', 'PUT', action.payload); break
          case 'delete_category': await api('/api/categories', 'DELETE', { id: (action.payload as any).id }); break
          case 'add_brand':    await api('/api/brands', 'POST', action.payload); break
          case 'update_brand': await api('/api/brands', 'PUT', action.payload); break
          case 'delete_brand': await api('/api/brands', 'DELETE', { id: (action.payload as any).id }); break
          case 'add_customer':    await api('/api/customers', 'POST', action.payload); break
          case 'update_customer': await api('/api/customers', 'PUT', action.payload); break
          case 'delete_customer': await api('/api/customers', 'DELETE', { id: (action.payload as any).id }); break
          case 'add_supplier':    await api('/api/suppliers', 'POST', action.payload); break
          case 'update_supplier': await api('/api/suppliers', 'PUT', action.payload); break
          case 'delete_supplier': await api('/api/suppliers', 'DELETE', { id: (action.payload as any).id }); break
        }
        await markActionAsSynced(action.id)
      } catch (e) {
        console.error(`Failed to sync action ${action.id}:`, e)
      }
    }

    return { success: true, message: 'Sync completed successfully' }
  } catch (error) {
    console.error('Sync error:', error)
    return { success: false, message: 'Sync failed' }
  }
}

// Keep old name as alias
export const syncToSupabase = syncToServer

async function upsertLocalRecords<T extends { id: string }>(
  localGetAll: () => Promise<T[]>,
  localAdd: (item: T) => Promise<any>,
  localUpdate: (item: T) => Promise<any>,
  remoteData: T[]
) {
  const existing = await localGetAll()
  const existingIds = new Set(existing.map(e => e.id))
  for (const item of remoteData) {
    if (existingIds.has(item.id)) await localUpdate(item)
    else await localAdd(item)
  }
}

export async function syncFromServer() {
  if (!navigator.onLine) return { success: false, message: 'Device is offline' }

  try {
    const [products, categories, brands, customers, suppliers] = await Promise.allSettled([
      api('/api/products'),
      api('/api/categories'),
      api('/api/brands'),
      api('/api/customers'),
      api('/api/suppliers'),
    ])

    if (products.status === 'fulfilled') await upsertLocalRecords(getAllProducts, addProductToDB, updateProductInDB, products.value)
    if (categories.status === 'fulfilled') await upsertLocalRecords(getAllCategories, addCategoryToDB, updateCategoryInDB, categories.value)
    if (brands.status === 'fulfilled') await upsertLocalRecords(getAllBrands, addBrandToDB, updateBrandInDB, brands.value)
    if (customers.status === 'fulfilled') await upsertLocalRecords(getAllCustomers, addCustomerToDB, updateCustomerInDB, customers.value)
    if (suppliers.status === 'fulfilled') await upsertLocalRecords(getAllSuppliers, addSupplierToDB, updateSupplierInDB, suppliers.value)

    return { success: true, message: 'Data synced from server successfully' }
  } catch (error) {
    console.error('Sync from server error:', error)
    return { success: false, message: 'Sync from server failed' }
  }
}

export const syncFromSupabase = syncFromServer

export async function fullSync() {
  console.log('Starting full sync...')
  const toServer = await syncToServer()
  const fromServer = await syncFromServer()
  return { toSupabase: toServer, fromSupabase: fromServer }
}

export function setupAutoSync() {
  window.addEventListener('online', async () => {
    console.log('Connection restored. Starting sync...')
    await fullSync()
  })
  setInterval(async () => {
    if (navigator.onLine) await fullSync()
  }, 5 * 60 * 1000)
}

export async function queueOfflineAction(actionType: string, payload: any) {
  const { addToOfflineQueue } = await import('./indexeddb')
  await addToOfflineQueue({
    id: crypto.randomUUID(),
    action_type: actionType,
    payload,
    synced: false,
    retry_count: 0,
    created_at: new Date().toISOString(),
  })
}
