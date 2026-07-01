-- Super Admins table for the internal admin panel
-- Run this once in your Neon SQL editor

CREATE TABLE IF NOT EXISTS super_admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login  TIMESTAMPTZ
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);

-- ─────────────────────────────────────────────────────────────────
-- HOW TO CREATE YOUR FIRST SUPER ADMIN
-- ─────────────────────────────────────────────────────────────────
-- 1. Generate a bcrypt hash for your password (cost 12):
--    node -e "const b=require('bcryptjs'); b.hash('YourPassword123!',12).then(console.log)"
--
-- 2. Insert the super admin:
--    INSERT INTO super_admins (email, name, password_hash) VALUES (
--      'admin@zetupos.co.ke',
--      'Zetu Admin',
--      '$2a$12$your_bcrypt_hash_here'
--    );
-- ─────────────────────────────────────────────────────────────────
