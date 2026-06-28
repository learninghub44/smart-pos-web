-- ═══════════════════════════════════════════════════════════════
-- Smart POS  ·  FULL MIGRATION  (run once on fresh Railway DB)
-- ═══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. PLANS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id            VARCHAR(50) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_once    INTEGER NOT NULL DEFAULT 0,
  max_branches  INTEGER NOT NULL DEFAULT 1,
  max_users     INTEGER NOT NULL DEFAULT 3,
  max_products  INTEGER NOT NULL DEFAULT 500,
  features      JSONB NOT NULL DEFAULT '[]',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (id, name, price_monthly, price_once, max_branches, max_users, max_products, features) VALUES
('starter',    'Starter',    250,   0,    1,  3,   500,  '["POS","Inventory","Sales Reports","Barcode Scanning","M-Pesa Payments","Email Receipts"]'),
('business',   'Business',   999,   0,    5,  15,  5000, '["Everything in Starter","Multi-Branch","Loyalty Program","Advanced Reports","Supplier Management","Priority Support"]'),
('enterprise', 'Enterprise', 2000,  0,   -1, -1,  -1,   '["Everything in Business","Unlimited Branches","API Access","Custom Branding","Dedicated Support","SLA Guarantee"]'),
('lifetime',   'Lifetime',   0,  16000, -1, -1,  -1,   '["Everything in Enterprise","One-Time Payment","Lifetime Updates","No Monthly Fees"]')
ON CONFLICT (id) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_once    = EXCLUDED.price_once,
  max_branches  = EXCLUDED.max_branches,
  max_users     = EXCLUDED.max_users,
  max_products  = EXCLUDED.max_products,
  features      = EXCLUDED.features;

-- ─────────────────────────────────────────────
-- 2. TENANTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name   VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(30),
  logo_url        TEXT,
  currency        VARCHAR(10) DEFAULT 'KES',
  country         VARCHAR(100) DEFAULT 'Kenya',
  plan_id         VARCHAR(50) REFERENCES plans(id) DEFAULT 'starter',
  trial_ends_at   TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_email  ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ─────────────────────────────────────────────
-- 3. SUBSCRIPTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id              VARCHAR(50) NOT NULL REFERENCES plans(id),
  billing_type         VARCHAR(20) NOT NULL DEFAULT 'monthly'
    CHECK (billing_type IN ('monthly', 'lifetime')),
  amount_paid          INTEGER NOT NULL,
  paystack_ref         VARCHAR(255),
  paystack_sub_code    VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  status               VARCHAR(30) DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'lifetime')),
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);

-- ─────────────────────────────────────────────
-- 4. INVOICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount          INTEGER NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paystack_ref    VARCHAR(255) UNIQUE,
  paystack_event  JSONB,
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_ref    ON invoices(paystack_ref);

-- ─────────────────────────────────────────────
-- 5. TENANT USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_users (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'admin'
    CHECK (role IN ('owner', 'admin', 'cashier')),
  branch_id     UUID,
  is_active     BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_tu_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tu_email  ON tenant_users(email);

-- ─────────────────────────────────────────────
-- 6. BRANCHES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  location    TEXT,
  phone       VARCHAR(30),
  email       VARCHAR(255),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);

-- Add FK now that branches exists
ALTER TABLE tenant_users
  ADD CONSTRAINT fk_tu_branch
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
  NOT VALID;

-- ─────────────────────────────────────────────
-- 7. CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  parent_id   UUID REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cat_tenant ON categories(tenant_id);

-- ─────────────────────────────────────────────
-- 8. BRANDS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_brands_tenant ON brands(tenant_id);

-- ─────────────────────────────────────────────
-- 9. SUPPLIERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  contact_person  VARCHAR(255),
  phone           VARCHAR(30),
  email           VARCHAR(255),
  address         TEXT,
  kra_pin         VARCHAR(50),
  payment_terms   VARCHAR(100),
  lead_time_days  INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sup_tenant ON suppliers(tenant_id);

-- ─────────────────────────────────────────────
-- 10. PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  category_id     UUID REFERENCES categories(id),
  brand_id        UUID REFERENCES brands(id),
  supplier_id     UUID REFERENCES suppliers(id),
  name            VARCHAR(255) NOT NULL,
  sku             VARCHAR(255),
  barcode         VARCHAR(255) NOT NULL,
  unit            VARCHAR(50),
  cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price   NUMERIC(12,2) NOT NULL,
  tax_rate        NUMERIC(5,2) DEFAULT 0,
  stock           INTEGER NOT NULL DEFAULT 0,
  minimum_stock   INTEGER DEFAULT 10,
  image_url       TEXT,
  archived        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, barcode)
);
CREATE INDEX IF NOT EXISTS idx_prod_tenant  ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prod_branch  ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_prod_barcode ON products(tenant_id, barcode);

-- ─────────────────────────────────────────────
-- 11. CUSTOMERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                    VARCHAR(255) NOT NULL,
  phone                   VARCHAR(30),
  email                   VARCHAR(255),
  address                 TEXT,
  loyalty_card_number     VARCHAR(50),
  loyalty_enrollment_date TIMESTAMPTZ,
  loyalty_status          VARCHAR(20) DEFAULT 'inactive',
  loyalty_points          INTEGER DEFAULT 0,
  total_spent             NUMERIC(12,2) DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cust_tenant ON customers(tenant_id);

-- ─────────────────────────────────────────────
-- 12. SALES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id),
  customer_id     UUID REFERENCES customers(id),
  cashier_id      UUID REFERENCES tenant_users(id),
  total_amount    NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  discount_type   VARCHAR(20) CHECK (discount_type IN ('percentage','fixed')),
  payment_method  VARCHAR(50) NOT NULL,
  cash_amount     NUMERIC(12,2),
  mpesa_amount    NUMERIC(12,2),
  card_amount     NUMERIC(12,2),
  bank_amount     NUMERIC(12,2),
  credit_amount   NUMERIC(12,2),
  receipt_pin     VARCHAR(50) NOT NULL,
  receipt_number  VARCHAR(50),
  notes           TEXT,
  synced          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, receipt_pin)
);
CREATE INDEX IF NOT EXISTS idx_sales_tenant     ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch     ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(tenant_id, created_at);

-- ─────────────────────────────────────────────
-- 13. SALE ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  quantity        INTEGER NOT NULL,
  price           NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_si_sale    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_si_product ON sale_items(product_id);

-- ─────────────────────────────────────────────
-- 14. PURCHASES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id     UUID REFERENCES branches(id),
  supplier_id   UUID REFERENCES suppliers(id),
  total_cost    NUMERIC(12,2) NOT NULL,
  status        VARCHAR(30) DEFAULT 'draft'
    CHECK (status IN ('draft','ordered','received','cancelled')),
  delivery_date DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purch_tenant ON purchases(tenant_id);

CREATE TABLE IF NOT EXISTS purchase_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  cost_price  NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 15. RETURNS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id    UUID REFERENCES branches(id),
  sale_id      UUID REFERENCES sales(id),
  customer_id  UUID REFERENCES customers(id),
  total_amount NUMERIC(12,2) NOT NULL,
  reason       TEXT NOT NULL,
  status       VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','completed')),
  approved_by  UUID REFERENCES tenant_users(id),
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ret_tenant ON returns(tenant_id);

CREATE TABLE IF NOT EXISTS return_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  return_id   UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  price       NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 16. INVENTORY LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_logs (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id      UUID REFERENCES branches(id),
  product_id     UUID REFERENCES products(id),
  change_type    VARCHAR(30) NOT NULL
    CHECK (change_type IN ('sale','purchase','adjustment','return','damage','expiry')),
  change_amount  INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock      INTEGER,
  reason         TEXT,
  user_id        UUID REFERENCES tenant_users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_tenant  ON inventory_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inv_product ON inventory_logs(product_id);

-- ─────────────────────────────────────────────
-- 17. SETTINGS (per-tenant key-value)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key         VARCHAR(255) NOT NULL,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON settings(tenant_id);

-- ─────────────────────────────────────────────
-- 18. AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES tenant_users(id),
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(100),
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ─────────────────────────────────────────────
-- 19. SUPER ADMINS (platform-level, full columns)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);

-- ─────────────────────────────────────────────
-- 20. updated_at trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'tenants','subscriptions','tenant_users','branches',
    'categories','brands','suppliers','products','customers',
    'purchases','returns','settings'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_upd ON %I;
       CREATE TRIGGER trg_%I_upd BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t, t, t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- SEED FIRST SUPER ADMIN
-- Replace the hash below with your own bcrypt hash (cost 12):
--   node -e "const b=require('bcryptjs'); b.hash('YourPass123!',12).then(console.log)"
-- ═══════════════════════════════════════════════════════════════
-- INSERT INTO super_admins (email, name, password_hash) VALUES (
--   'admin@zetupos.co.ke',
--   'Zetu Admin',
--   '$2a$12$REPLACE_WITH_YOUR_HASH'
-- );
