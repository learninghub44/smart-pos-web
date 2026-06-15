import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — avoids calling createClient() at module load time during
// Vercel's build phase when NEXT_PUBLIC_* env vars are not yet injected.
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    )
  }

  _supabase = createClient(url, key)
  return _supabase
}

// Convenience proxy so existing `supabase.from(...)` call sites keep working
// without changing every import. Accesses are deferred until runtime.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})


export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'cashier'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'admin' | 'cashier'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'cashier'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          sku?: string | null
          barcode: string
          category_id?: string | null
          brand_id?: string | null
          unit?: string | null
          cost_price: number
          selling_price: number
          tax_rate?: number
          stock?: number
          minimum_stock?: number
          image_url?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          barcode?: string
          category_id?: string | null
          brand_id?: string | null
          unit?: string | null
          cost_price?: number
          selling_price?: number
          tax_rate?: number
          stock?: number
          minimum_stock?: number
          image_url?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          loyalty_points: number
          total_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          loyalty_points?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          loyalty_points?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          supplier_id: string | null
          total_cost: number
          status: 'draft' | 'ordered' | 'received' | 'cancelled'
          delivery_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id?: string | null
          total_cost: number
          status: 'draft' | 'ordered' | 'received' | 'cancelled'
          delivery_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string | null
          total_cost?: number
          status?: 'draft' | 'ordered' | 'received' | 'cancelled'
          delivery_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string | null
          quantity: number
          cost_price: number
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id?: string | null
          quantity: number
          cost_price: number
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string | null
          quantity?: number
          cost_price?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          customer_id: string | null
          total_amount: number
          discount_amount: number
          discount_type: 'percentage' | 'fixed' | null
          payment_method: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'mixed'
          cash_amount: number | null
          mpesa_amount: number | null
          card_amount: number | null
          bank_amount: number | null
          receipt_pin: string
          receipt_number: string | null
          cashier_id: string | null
          notes: string | null
          created_at: string
          synced: boolean
        }
        Insert: {
          id?: string
          customer_id?: string | null
          total_amount: number
          discount_amount?: number
          discount_type?: 'percentage' | 'fixed' | null
          payment_method: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'mixed'
          cash_amount?: number | null
          mpesa_amount?: number | null
          card_amount?: number | null
          bank_amount?: number | null
          receipt_pin: string
          receipt_number?: string | null
          cashier_id?: string | null
          notes?: string | null
          created_at?: string
          synced?: boolean
        }
        Update: {
          id?: string
          customer_id?: string | null
          total_amount?: number
          discount_amount?: number
          discount_type?: 'percentage' | 'fixed' | null
          payment_method?: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'mixed'
          cash_amount?: number | null
          mpesa_amount?: number | null
          card_amount?: number | null
          bank_amount?: number | null
          receipt_pin?: string
          receipt_number?: string | null
          cashier_id?: string | null
          notes?: string | null
          created_at?: string
          synced?: boolean
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          quantity: number
          price: number
          discount_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          quantity: number
          price: number
          discount_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          quantity?: number
          price?: number
          discount_amount?: number
          created_at?: string
        }
      }
      returns: {
        Row: {
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
        Insert: {
          id?: string
          sale_id?: string | null
          customer_id?: string | null
          total_amount: number
          reason: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string | null
          customer_id?: string | null
          total_amount?: number
          reason?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      return_items: {
        Row: {
          id: string
          return_id: string
          product_id: string | null
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          return_id: string
          product_id?: string | null
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          return_id?: string
          product_id?: string | null
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      inventory_logs: {
        Row: {
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
        Insert: {
          id?: string
          product_id?: string | null
          change_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'expiry'
          change_amount: number
          previous_stock?: number | null
          new_stock?: number | null
          reason?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          change_type?: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'expiry'
          change_amount?: number
          previous_stock?: number | null
          new_stock?: number | null
          reason?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      offline_queue: {
        Row: {
          id: string
          action_type: string
          payload: any
          synced: boolean
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          action_type: string
          payload: any
          synced?: boolean
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          action_type?: string
          payload?: any
          synced?: boolean
          retry_count?: number
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: any
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
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
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_values?: any
          new_values?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_values?: any
          new_values?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}
