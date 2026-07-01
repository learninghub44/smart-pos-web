-- Allow 'pending_payment' as a valid tenant status.
-- This is the state between registration and first payment.
-- Trial starts (trial_ends_at is set) only after charge.success webhook fires.

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE tenants
  ADD CONSTRAINT tenants_status_check
    CHECK (status IN ('pending_payment', 'trial', 'active', 'suspended', 'cancelled'));
