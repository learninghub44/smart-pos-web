import { supabase } from './supabase'
import { 
  getUnsyncedSales, 
  getUnsyncedActions, 
  markActionAsSynced,
  getAllProducts,
  addProductToDB,
  updateProductInDB
} from './indexeddb'

export async function syncToSupabase() {
  const isOnline = navigator.onLine
  
  if (!isOnline) {
    console.log('Device is offline. Sync will happen when connection is restored.')
    return { success: false, message: 'Device is offline' }
  }

  try {
    // Sync unsynced sales
    const unsyncedSales = await getUnsyncedSales()
    
    for (const sale of unsyncedSales) {
      const { error } = await supabase
        .from('sales')
        .insert({
          id: sale.id,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method,
          receipt_pin: sale.receipt_pin,
          cashier_id: sale.cashier_id,
          synced: true
        })
      
      if (!error) {
        // Mark as synced locally
        // In production, you'd update the local record
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
            await supabase.from('products').insert(action.payload)
            break
          case 'update_product':
            await supabase.from('products').update(action.payload).eq('id', action.payload.id)
            break
          case 'delete_product':
            await supabase.from('products').delete().eq('id', action.payload.id)
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

export async function syncFromSupabase() {
  const isOnline = navigator.onLine
  
  if (!isOnline) {
    return { success: false, message: 'Device is offline' }
  }

  try {
    // Sync products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
    
    if (products && !error) {
      for (const product of products) {
        const existingProducts = await getAllProducts()
        const exists = existingProducts.find(p => p.id === product.id)
        
        if (exists) {
          await updateProductInDB(product)
        } else {
          await addProductToDB(product)
        }
      }
    }

    return { success: true, message: 'Data synced from Supabase successfully' }
  } catch (error) {
    console.error('Sync from Supabase error:', error)
    return { success: false, message: 'Sync from Supabase failed' }
  }
}

export async function fullSync() {
  console.log('Starting full sync...')
  
  // First sync local changes to Supabase
  const toSupabaseResult = await syncToSupabase()
  
  // Then sync latest data from Supabase
  const fromSupabaseResult = await syncFromSupabase()
  
  return {
    toSupabase: toSupabaseResult,
    fromSupabase: fromSupabaseResult
  }
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
    created_at: new Date().toISOString()
  })
}
