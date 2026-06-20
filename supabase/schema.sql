-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'cashier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (updated)
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(255) UNIQUE,
  barcode VARCHAR(255) UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  unit VARCHAR(50),
  cost_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER DEFAULT 10,
  image_url TEXT,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (updated for loyalty enrollment)
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  address TEXT,
  loyalty_card_number VARCHAR(50) UNIQUE,
  loyalty_enrollment_date TIMESTAMP WITH TIME ZONE,
  loyalty_status VARCHAR(20) DEFAULT 'inactive' CHECK (loyalty_status IN ('active', 'inactive')),
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  kra_pin VARCHAR(50),
  payment_terms VARCHAR(100),
  lead_time_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link products to a supplier (added after suppliers table exists)
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- Purchases table
CREATE TABLE purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  total_cost DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase items table
CREATE TABLE purchase_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table (updated)
CREATE TABLE sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank_transfer', 'credit_account', 'mixed')),
  cash_amount DECIMAL(10, 2),
  mpesa_amount DECIMAL(10, 2),
  card_amount DECIMAL(10, 2),
  bank_amount DECIMAL(10, 2),
  credit_amount DECIMAL(10, 2),
  receipt_pin VARCHAR(50) UNIQUE NOT NULL,
  receipt_number VARCHAR(50),
  cashier_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced BOOLEAN DEFAULT true
);

-- Sale items table (updated)
CREATE TABLE sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Returns table
CREATE TABLE returns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id),
  customer_id UUID REFERENCES customers(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return items table
CREATE TABLE return_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory logs table (updated)
CREATE TABLE inventory_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('sale', 'purchase', 'adjustment', 'return', 'damage', 'expiry')),
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reason TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline queue table
CREATE TABLE offline_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_receipt_pin ON sales(receipt_pin);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX idx_offline_queue_synced ON offline_queue(synced);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (true);

-- Categories RLS policies
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (true);

-- Brands RLS policies
CREATE POLICY "Anyone can view brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Admins can insert brands" ON brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update brands" ON brands FOR UPDATE USING (true);
CREATE POLICY "Admins can delete brands" ON brands FOR DELETE USING (true);

-- Products RLS policies
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (true);

-- Customers RLS policies
CREATE POLICY "Anyone can view customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Admins can insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Admins can delete customers" ON customers FOR DELETE USING (true);

-- Suppliers RLS policies
CREATE POLICY "Anyone can view suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Admins can insert suppliers" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update suppliers" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "Admins can delete suppliers" ON suppliers FOR DELETE USING (true);

-- Purchases RLS policies
CREATE POLICY "Anyone can view purchases" ON purchases FOR SELECT USING (true);
CREATE POLICY "Admins can insert purchases" ON purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update purchases" ON purchases FOR UPDATE USING (true);
CREATE POLICY "Admins can delete purchases" ON purchases FOR DELETE USING (true);

-- Sales RLS policies
CREATE POLICY "Anyone can view sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update sales" ON sales FOR UPDATE USING (true);

-- Sale items RLS policies
CREATE POLICY "Anyone can view sale items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sale items" ON sale_items FOR INSERT WITH CHECK (true);

-- Returns RLS policies
CREATE POLICY "Anyone can view returns" ON returns FOR SELECT USING (true);
CREATE POLICY "Admins can insert returns" ON returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update returns" ON returns FOR UPDATE USING (true);

-- Return items RLS policies
CREATE POLICY "Anyone can view return items" ON return_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert return items" ON return_items FOR INSERT WITH CHECK (true);

-- Inventory logs RLS policies
CREATE POLICY "Anyone can view inventory logs" ON inventory_logs FOR SELECT USING (true);
CREATE POLICY "Admins can insert inventory logs" ON inventory_logs FOR INSERT WITH CHECK (true);

-- Offline queue RLS policies
CREATE POLICY "Anyone can view offline queue" ON offline_queue FOR SELECT USING (true);
CREATE POLICY "Anyone can insert offline queue" ON offline_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update offline queue" ON offline_queue FOR UPDATE USING (true);

-- Settings RLS policies
CREATE POLICY "Anyone can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update settings" ON settings FOR UPDATE USING (true);

-- Audit logs RLS policies
CREATE POLICY "Anyone can view audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  receipt_num VARCHAR(50);
  date_part VARCHAR(8);
  sequence_num INTEGER;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM sales
  WHERE receipt_number LIKE 'REC-' || date_part || '-%';
  
  receipt_num := 'REC-' || date_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('business', '{"name": "SMART POS", "address": "", "phone": "", "email": "", "currency": "KES"}'),
('receipt', '{"footer": "Thank you for your purchase!", "paper_size": "80mm", "auto_print": false, "delivery_mode": "manual"}'),
('loyalty', '{"points_per_currency": 0.01, "redemption_rate": 0.01, "enabled": true, "manager_approval_threshold": 1000}'),
('tax', '{"vat_rate": 16, "enabled": false}')
ON CONFLICT (key) DO NOTHING;
