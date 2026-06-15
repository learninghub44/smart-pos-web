import { supabase } from './supabase'
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

export async function syncToSupabase() {
  if (!navigator.onLine) {
    console.log('Device is offline. Sync will happen when connection is restored.')
    return { success: false, message: 'Device is offline' }
  }

  try {
    // Sync unsynced sales
    const unsyncedSales = await getUnsyncedSales()

    for (const sale of unsyncedSales) {
      const { error } = await supabase.from('sales').upsert({
        id: sale.id,
        customer_id: sale.customer_id,
        total_amount: sale.total_amount,
        discount_amount: sale.discount_amount,
        discount_type: sale.discount_type,
        payment_method: sale.payment_method,
        cash_amount: sale.cash_amount,
        mpesa_amount: sale.mpesa_amount,
        card_amount: sale.card_amount,
        bank_amount: sale.bank_amount,
        credit_amount: sale.credit_amount,
        receipt_pin: sale.receipt_pin,
        receipt_number: sale.receipt_number,
        cashier_id: sale.cashier_id,
        notes: sale.notes,
        created_at: sale.created_at,
        synced: true,
      })

      if (!error) {
        await updateSaleInDB({ ...sale, synced: true })
        console.log(`Sale ${sale.id} synced successfully`)
      } else {
        console.error(`Failed to sync sale ${sale.id}:`, error)
      }
    }

    // Sync offline queue actions
    const unsyncedActions = await getUnsyncedActions()

    for (const action of unsyncedActions) {
      try {
        switch (action.action_type) {
          case 'add_product':
            await supabase.from('products').insert(action.payload as any)
            break
          case 'update_product':
            await supabase.from('products').update(action.payload as any).eq('id', (action.payload as any).id)
            break
          case 'delete_product':
            await supabase.from('products').delete().eq('id', (action.payload as any).id)
            break
          case 'add_category':
            await supabase.from('categories').insert(action.payload as any)
            break
          case 'update_category':
            await supabase.from('categories').update(action.payload as any).eq('id', (action.payload as any).id)
            break
          case 'delete_category':
            await supabase.from('categories').delete().eq('id', (action.payload as any).id)
            break
          case 'add_brand':
            await supabase.from('brands').insert(action.payload as any)
            break
          case 'update_brand':
            await supabase.from('brands').update(action.payload as any).eq('id', (action.payload as any).id)
            break
          case 'delete_brand':
            await supabase.from('brands').delete().eq('id', (action.payload as any).id)
            break
          case 'add_customer':
            await supabase.from('customers').insert(action.payload as any)
            break
          case 'update_customer':
            await supabase.from('customers').update(action.payload as any).eq('id', (action.payload as any).id)
            break
          case 'delete_customer':
            await supabase.from('customers').delete().eq('id', (action.payload as any).id)
            break
          case 'add_supplier':
            await supabase.from('suppliers').insert(action.payload as any)
            break
          case 'update_supplier':
            await supabase.from('suppliers').update(action.payload as any).eq('id', (action.payload as any).id)
            break
          case 'delete_supplier':
            await supabase.from('suppliers').delete().eq('id', (action.payload as any).id)
            break
          default:
            console.log(`Unknown action type: ${action.action_type}`)
        }

        await markActionAsSynced(action.id)
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error)
      }
    }

    return { success: true, message: 'Sync completed successfully' }
  } catch (error) {
    console.error('Sync error:', error)
    return { success: false, message: 'Sync failed' }
  }
}

async function upsertLocalRecords<T extends { id: string }>(
  localGetAll: () => Promise<T[]>,
  localAdd: (item: T) => Promise<any>,
  localUpdate: (item: T) => Promise<any>,
  remoteData: T[]
) {
  const existing = await localGetAll()
  const existingIds = new Set(existing.map(e => e.id))

  for (const item of remoteData) {
    if (existingIds.has(item.id)) {
      await localUpdate(item)
    } else {
      await localAdd(item)
    }
  }
}

export async function syncFromSupabase() {
  if (!navigator.onLine) {
    return { success: false, message: 'Device is offline' }
  }

  try {
    // Sync products
    const { data: products, error: productsError } = await supabase.from('products').select('*')
    if (products && !productsError) {
      await upsertLocalRecords(getAllProducts, addProductToDB, updateProductInDB, products)
    }

    // Sync categories
    const { data: categories, error: categoriesError } = await supabase.from('categories').select('*')
    if (categories && !categoriesError) {
      await upsertLocalRecords(getAllCategories, addCategoryToDB, updateCategoryInDB, categories)
    }

    // Sync brands
    const { data: brands, error: brandsError } = await supabase.from('brands').select('*')
    if (brands && !brandsError) {
      await upsertLocalRecords(getAllBrands, addBrandToDB, updateBrandInDB, brands)
    }

    // Sync customers
    const { data: customers, error: customersError } = await supabase.from('customers').select('*')
    if (customers && !customersError) {
      await upsertLocalRecords(getAllCustomers, addCustomerToDB, updateCustomerInDB, customers)
    }

    // Sync suppliers
    const { data: suppliers, error: suppliersError } = await supabase.from('suppliers').select('*')
    if (suppliers && !suppliersError) {
      await upsertLocalRecords(getAllSuppliers, addSupplierToDB, updateSupplierInDB, suppliers)
    }

    return { success: true, message: 'Data synced from Supabase successfully' }
  } catch (error) {
    console.error('Sync from Supabase error:', error)
    return { success: false, message: 'Sync from Supabase failed' }
  }
}

export async function fullSync() {
  console.log('Starting full sync...')
  const toSupabaseResult = await syncToSupabase()
  const fromSupabaseResult = await syncFromSupabase()
  return { toSupabase: toSupabaseResult, fromSupabase: fromSupabaseResult }
}

// Set up automatic sync when connection is restored
export function setupAutoSync() {
  window.addEventListener('online', async () => {
    console.log('Connection restored. Starting sync...')
    await fullSync()
  })

  // Periodic sync every 5 minutes
  setInterval(async () => {
    if (navigator.onLine) {
      await fullSync()
    }
  }, 5 * 60 * 1000)
}

// Queue an action for offline sync
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
