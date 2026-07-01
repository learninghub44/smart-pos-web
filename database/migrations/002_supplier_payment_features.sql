-- ─────────────────────────────────────────────
-- Migration 002: Supplier details, product-supplier link, payment methods
-- Run this in your Neon SQL editor
-- ─────────────────────────────────────────────

-- 1. Extra supplier detail fields
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS kra_pin VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;

-- 2. Link products to a supplier (the FK category_id/brand_id columns
--    already exist on products from the original schema — this just adds supplier)
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- 3. Payment methods (Till / Paybill / Send Money / Bank) are stored as a
--    JSONB array under the existing generic `settings` table with key
--    'payment_methods' — no new table needed. Example value:
--    [
--      { "id": "...", "type": "till", "label": "Main Till", "number": "123456", "active": true },
--      { "id": "...", "type": "paybill", "label": "Paybill", "number": "400200", "account_name": "0712345678", "active": true },
--      { "id": "...", "type": "send_money", "label": "Send Money", "number": "0712345678", "active": true }
--    ]
