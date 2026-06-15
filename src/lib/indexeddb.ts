import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface SmartPosDB extends DBSchema {
  products: {
    key: string
    value: {
      id: string
      name: string
      sku: string | null
      barcode: string
      category_id: string | null
      brand_id: string | null
      unit: string | null
      cost_price: number
      selling_price: number
      tax_rate: number
      stock: number
      minimum_stock: number
      image_url: string | null
      archived: boolean
      created_at: string
      updated_at: string
    }
    indexes: {
      'by-barcode': string
      'by-sku': string
      'by-category': string
      'by-brand': string
    }
  }
  categories: {
    key: string
    value: {
      id: string
      name: string
      parent_id: string | null
      created_at: string
      updated_at: string
    }
    indexes: {
      'by-parent': string
    }
  }
  brands: {
    key: string
    value: {
      id: string
      name: string
      created_at: string
      updated_at: string
    }
  }
  customers: {
    key: string
    value: {
      id: string
      name: string
      phone: string | null
      email: string | null
      address: string | null
      loyalty_card_number: string | null
      loyalty_enrollment_date: string | null
      loyalty_status: 'active' | 'inactive'
      loyalty_points: number
      total_spent: number
      created_at: string
      updated_at: string
    }
    indexes: {
      'by-phone': string
      'by-email': string
      'by-loyalty-card': string
      'by-loyalty-status': string
    }
  }
  suppliers: {
    key: string
    value: {
      id: string
      name: string
      contact_person: string | null
      phone: string | null
      email: string | null
      address: string | null
      created_at: string
      updated_at: string
    }
  }
  sales: {
    key: string
    value: {
      id: string
      customer_id: string | null
      total_amount: number
      discount_amount: number
      discount_type: 'percentage' | 'fixed' | null
      payment_method: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit_account' | 'mixed'
      cash_amount: number | null
      mpesa_amount: number | null
      card_amount: number | null
      bank_amount: number | null
      credit_amount: number | null
      receipt_pin: string
      receipt_number: string | null
      cashier_id: string | null
      notes: string | null
      created_at: string
      synced: boolean
    }
    indexes: {
      'by-synced': number
      'by-receipt-pin': string
      'by-customer': string
      'by-cashier': string
      'by-created-at': string
    }
  }
  sale_items: {
    key: string
    value: {
      id: string
      sale_id: string
      product_id: string | null
      quantity: number
      price: number
      discount_amount: number
      created_at: string
    }
    indexes: {
      'by-sale-id': string
      'by-product-id': string
    }
  }
  returns: {
    key: string
    value: {
      id: string
      sale_id: string | null
      customer_id: string | null
      total_amount: number
      reason: string
      status: 'pending' | 'approved' | 'rejected' | 'completed'
      approved_by: string | null
      approved_at: string | null
      created_at: string
      updated_at: string
    }
    indexes: {
      'by-status': string
      'by-customer': string
      'by-sale': string
    }
  }
  return_items: {
    key: string
    value: {
      id: string
      return_id: string
      product_id: string | null
      quantity: number
      price: number
      created_at: string
    }
    indexes: {
      'by-return-id': string
    }
  }
  inventory_logs: {
    key: string
    value: {
      id: string
      product_id: string | null
      change_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'expiry'
      change_amount: number
      previous_stock: number | null
      new_stock: number | null
      reason: string | null
      user_id: string | null
      created_at: string
    }
    indexes: {
      'by-product-id': string
      'by-created-at': string
    }
  }
  offline_queue: {
    key: string
    value: {
      id: string
      action_type: string
      payload: any
      synced: boolean
      retry_count: number
      created_at: string
    }
    indexes: {
      'by-synced': number
    }
  }
  settings: {
    key: string
    value: {
      id: string
      key: string
      value: any
      updated_at: string
    }
    indexes: {
      'by-key': string
    }
  }
  audit_logs: {
    key: string
    value: {
      id: string
      user_id: string | null
      action: string
      table_name: string | null
      record_id: string | null
      old_values: any
      new_values: any
      ip_address: string | null
      user_agent: string | null
      created_at: string
    }
    indexes: {
      'by-user-id': string
      'by-created-at': string
      'by-table': string
    }
  }
  users: {
    key: string
    value: {
      id: string
      name: string
      email: string
      role: 'admin' | 'cashier'
      created_at: string
    }
  }
}

let db: IDBPDatabase<SmartPosDB> | null = null

export async function getDB(): Promise<IDBPDatabase<SmartPosDB>> {
  if (db) return db

  db = await openDB<SmartPosDB>('smart-pos-db', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' })
        productStore.createIndex('by-barcode', 'barcode', { unique: true })
        productStore.createIndex('by-sku', 'sku', { unique: true })
        productStore.createIndex('by-category', 'category_id')
        productStore.createIndex('by-brand', 'brand_id')
      } else if (oldVersion < 2) {
        const productStore = transaction.objectStore('products')
        if (!productStore.indexNames.contains('by-sku')) {
          productStore.createIndex('by-sku', 'sku', { unique: true })
        }
        if (!productStore.indexNames.contains('by-category')) {
          productStore.createIndex('by-category', 'category_id')
        }
        if (!productStore.indexNames.contains('by-brand')) {
          productStore.createIndex('by-brand', 'brand_id')
        }
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
        categoryStore.createIndex('by-parent', 'parent_id')
      }

      // Brands store
      if (!db.objectStoreNames.contains('brands')) {
        db.createObjectStore('brands', { keyPath: 'id' })
      }

      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' })
        customerStore.createIndex('by-phone', 'phone')
        customerStore.createIndex('by-email', 'email')
      }

      // Suppliers store
      if (!db.objectStoreNames.contains('suppliers')) {
        db.createObjectStore('suppliers', { keyPath: 'id' })
      }

      // Sales store
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', { keyPath: 'id' })
        salesStore.createIndex('by-synced', 'synced')
        salesStore.createIndex('by-receipt-pin', 'receipt_pin', { unique: true })
        salesStore.createIndex('by-customer', 'customer_id')
        salesStore.createIndex('by-cashier', 'cashier_id')
        salesStore.createIndex('by-created-at', 'created_at')
      } else if (oldVersion < 2) {
        const salesStore = transaction.objectStore('sales')
        if (!salesStore.indexNames.contains('by-customer')) {
          salesStore.createIndex('by-customer', 'customer_id')
        }
        if (!salesStore.indexNames.contains('by-cashier')) {
          salesStore.createIndex('by-cashier', 'cashier_id')
        }
        if (!salesStore.indexNames.contains('by-created-at')) {
          salesStore.createIndex('by-created-at', 'created_at')
        }
      }

      // Sale items store
      if (!db.objectStoreNames.contains('sale_items')) {
        const saleItemsStore = db.createObjectStore('sale_items', { keyPath: 'id' })
        saleItemsStore.createIndex('by-sale-id', 'sale_id')
        saleItemsStore.createIndex('by-product-id', 'product_id')
      } else if (oldVersion < 2) {
        const saleItemsStore = transaction.objectStore('sale_items')
        if (!saleItemsStore.indexNames.contains('by-product-id')) {
          saleItemsStore.createIndex('by-product-id', 'product_id')
        }
      }

      // Returns store
      if (!db.objectStoreNames.contains('returns')) {
        const returnsStore = db.createObjectStore('returns', { keyPath: 'id' })
        returnsStore.createIndex('by-status', 'status')
        returnsStore.createIndex('by-customer', 'customer_id')
        returnsStore.createIndex('by-sale', 'sale_id')
      }

      // Return items store
      if (!db.objectStoreNames.contains('return_items')) {
        const returnItemsStore = db.createObjectStore('return_items', { keyPath: 'id' })
        returnItemsStore.createIndex('by-return-id', 'return_id')
      }

      // Inventory logs store
      if (!db.objectStoreNames.contains('inventory_logs')) {
        const inventoryLogsStore = db.createObjectStore('inventory_logs', { keyPath: 'id' })
        inventoryLogsStore.createIndex('by-product-id', 'product_id')
        inventoryLogsStore.createIndex('by-created-at', 'created_at')
      } else if (oldVersion < 2) {
        const inventoryLogsStore = transaction.objectStore('inventory_logs')
        if (!inventoryLogsStore.indexNames.contains('by-created-at')) {
          inventoryLogsStore.createIndex('by-created-at', 'created_at')
        }
      }

      // Offline queue store
      if (!db.objectStoreNames.contains('offline_queue')) {
        const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' })
        queueStore.createIndex('by-synced', 'synced')
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' })
        settingsStore.createIndex('by-key', 'key', { unique: true })
      }

      // Audit logs store
      if (!db.objectStoreNames.contains('audit_logs')) {
        const auditLogsStore = db.createObjectStore('audit_logs', { keyPath: 'id' })
        auditLogsStore.createIndex('by-user-id', 'user_id')
        auditLogsStore.createIndex('by-created-at', 'created_at')
        auditLogsStore.createIndex('by-table', 'table_name')
      }

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' })
      }
    },
  })

  return db
}

// Product operations
export async function addProductToDB(product: any) {
  const db = await getDB()
  return db.add('products', product)
}

export async function updateProductInDB(product: any) {
  const db = await getDB()
  return db.put('products', product)
}

export async function deleteProductFromDB(id: string) {
  const db = await getDB()
  return db.delete('products', id)
}

export async function getProductByBarcode(barcode: string) {
  const db = await getDB()
  return db.getFromIndex('products', 'by-barcode', barcode)
}

export async function getProductBySKU(sku: string) {
  const db = await getDB()
  return db.getFromIndex('products', 'by-sku', sku)
}

export async function getAllProducts() {
  const db = await getDB()
  return db.getAll('products')
}

// Category operations
export async function addCategoryToDB(category: any) {
  const db = await getDB()
  return db.add('categories', category)
}

export async function updateCategoryInDB(category: any) {
  const db = await getDB()
  return db.put('categories', category)
}

export async function deleteCategoryFromDB(id: string) {
  const db = await getDB()
  return db.delete('categories', id)
}

export async function getAllCategories() {
  const db = await getDB()
  return db.getAll('categories')
}

// Brand operations
export async function addBrandToDB(brand: any) {
  const db = await getDB()
  return db.add('brands', brand)
}

export async function updateBrandInDB(brand: any) {
  const db = await getDB()
  return db.put('brands', brand)
}

export async function deleteBrandFromDB(id: string) {
  const db = await getDB()
  return db.delete('brands', id)
}

export async function getAllBrands() {
  const db = await getDB()
  return db.getAll('brands')
}

// Customer operations
export async function addCustomerToDB(customer: any) {
  const db = await getDB()
  return db.add('customers', customer)
}

export async function updateCustomerInDB(customer: any) {
  const db = await getDB()
  return db.put('customers', customer)
}

export async function deleteCustomerFromDB(id: string) {
  const db = await getDB()
  return db.delete('customers', id)
}

export async function getAllCustomers() {
  const db = await getDB()
  return db.getAll('customers')
}

export async function getCustomerByPhone(phone: string) {
  const db = await getDB()
  return db.getFromIndex('customers', 'by-phone', phone)
}

// Supplier operations
export async function addSupplierToDB(supplier: any) {
  const db = await getDB()
  return db.add('suppliers', supplier)
}

export async function updateSupplierInDB(supplier: any) {
  const db = await getDB()
  return db.put('suppliers', supplier)
}

export async function deleteSupplierFromDB(id: string) {
  const db = await getDB()
  return db.delete('suppliers', id)
}

export async function getAllSuppliers() {
  const db = await getDB()
  return db.getAll('suppliers')
}

// Sales operations
export async function addSaleToDB(sale: any) {
  const db = await getDB()
  return db.add('sales', sale)
}

export async function updateSaleInDB(sale: any) {
  const db = await getDB()
  return db.put('sales', sale)
}

export async function getSaleByReceiptPin(receiptPin: string) {
  const db = await getDB()
  return db.getFromIndex('sales', 'by-receipt-pin', receiptPin)
}

export async function getUnsyncedSales() {
  const db = await getDB()
  return db.getAllFromIndex('sales', 'by-synced', 0)
}

export async function getAllSales() {
  const db = await getDB()
  return db.getAll('sales')
}

export async function getSalesByDateRange(startDate: string, endDate: string) {
  const db = await getDB()
  const allSales = await db.getAll('sales')
  return allSales.filter(sale => {
    const saleDate = new Date(sale.created_at)
    return saleDate >= new Date(startDate) && saleDate <= new Date(endDate)
  })
}

// Sale items operations
export async function addSaleItemToDB(item: any) {
  const db = await getDB()
  return db.add('sale_items', item)
}

export async function getSaleItemsBySaleId(saleId: string) {
  const db = await getDB()
  return db.getAllFromIndex('sale_items', 'by-sale-id', saleId)
}

// Returns operations
export async function addReturnToDB(returnData: any) {
  const db = await getDB()
  return db.add('returns', returnData)
}

export async function updateReturnInDB(returnData: any) {
  const db = await getDB()
  return db.put('returns', returnData)
}

export async function getAllReturns() {
  const db = await getDB()
  return db.getAll('returns')
}

export async function getReturnsByStatus(status: string) {
  const db = await getDB()
  return db.getAllFromIndex('returns', 'by-status', status)
}

// Return items operations
export async function addReturnItemToDB(item: any) {
  const db = await getDB()
  return db.add('return_items', item)
}

export async function getReturnItemsByReturnId(returnId: string) {
  const db = await getDB()
  return db.getAllFromIndex('return_items', 'by-return-id', returnId)
}

// Inventory logs operations
export async function addInventoryLogToDB(log: any) {
  const db = await getDB()
  return db.add('inventory_logs', log)
}

export async function getInventoryLogsByProductId(productId: string) {
  const db = await getDB()
  return db.getAllFromIndex('inventory_logs', 'by-product-id', productId)
}

export async function getAllInventoryLogs() {
  const db = await getDB()
  return db.getAll('inventory_logs')
}

// Offline queue operations
export async function addToOfflineQueue(action: any) {
  const db = await getDB()
  return db.add('offline_queue', action)
}

export async function getUnsyncedActions() {
  const db = await getDB()
  return db.getAllFromIndex('offline_queue', 'by-synced', 0)
}

export async function markActionAsSynced(id: string) {
  const db = await getDB()
  const action = await db.get('offline_queue', id)
  if (action) {
    action.synced = true
    return db.put('offline_queue', action)
  }
}

// Settings operations
export async function addSettingToDB(setting: any) {
  const db = await getDB()
  return db.add('settings', setting)
}

export async function updateSettingToDB(setting: any) {
  const db = await getDB()
  return db.put('settings', setting)
}

export async function getSettingByKey(key: string) {
  const db = await getDB()
  return db.getFromIndex('settings', 'by-key', key)
}

export async function getAllSettings() {
  const db = await getDB()
  return db.getAll('settings')
}

// Audit logs operations
export async function addAuditLogToDB(log: any) {
  const db = await getDB()
  return db.add('audit_logs', log)
}

export async function getAuditLogsByUserId(userId: string) {
  const db = await getDB()
  return db.getAllFromIndex('audit_logs', 'by-user-id', userId)
}

export async function getAllAuditLogs() {
  const db = await getDB()
  return db.getAll('audit_logs')
}

// User operations
export async function addUserToDB(user: any) {
  const db = await getDB()
  return db.add('users', user)
}

export async function getCurrentUser() {
  const db = await getDB()
  const users = await db.getAll('users')
  return users[0] || null
}

export async function clearCurrentUser() {
  const db = await getDB()
  return db.clear('users')
}
