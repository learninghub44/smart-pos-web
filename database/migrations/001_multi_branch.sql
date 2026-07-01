-- ─────────────────────────────────────────────
-- Migration 001: Multi-branch support
-- Run this in your Neon SQL editor
-- ─────────────────────────────────────────────

-- 1. Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO branches (id, name, location, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Branch', '', true)
ON CONFLICT DO NOTHING;

-- 2. branch_id on users (NULL = owner/admin who sees all branches)
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- 3. branch_id on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE products SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- 4. branch_id on sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE sales SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- 5. branch_id on returns
ALTER TABLE returns ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE returns SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- 6. branch_id on inventory_logs
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE inventory_logs SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- 7. branch_id on purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE purchases SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_returns_branch ON returns(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_branch ON inventory_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_branch ON purchases(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- 9. RLS for branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Admins can insert branches" ON branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update branches" ON branches FOR UPDATE USING (true);
CREATE POLICY "Admins can delete branches" ON branches FOR DELETE USING (true);

-- 10. Updated_at trigger for branches
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
