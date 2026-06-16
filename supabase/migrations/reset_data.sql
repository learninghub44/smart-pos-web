-- ============================================
-- SMART POS — Full Data Reset (keep structure)
-- Run in Supabase SQL Editor
-- ============================================

-- Disable triggers temporarily to avoid FK issues
SET session_replication_role = replica;

-- Clear all transactional data
TRUNCATE TABLE sale_items CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE purchase_items CASCADE;
TRUNCATE TABLE purchases CASCADE;
TRUNCATE TABLE returns CASCADE;
TRUNCATE TABLE inventory_logs CASCADE;
TRUNCATE TABLE offline_queue CASCADE;

-- Clear master data
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE brands CASCADE;
TRUNCATE TABLE categories CASCADE;

-- Clear users except admin (keep your login)
DELETE FROM users WHERE role != 'admin';

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Confirm
SELECT 
  'sale_items' as table_name, COUNT(*) as rows FROM sale_items
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers;
