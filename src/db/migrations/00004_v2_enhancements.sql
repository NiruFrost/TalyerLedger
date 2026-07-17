-- ============================================
-- 00004: V2 Schema Enhancements
-- Adds voided status, payer_type, insurance fields,
-- linked_job_id on jobs; payment_type on payments;
-- Business Registration fields on shop_settings
-- ============================================

-- Extend job_status enum with 'voided'
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'voided';

-- Add new columns to jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS payer_type TEXT CHECK (payer_type IN ('customer', 'insurance', 'both')),
  ADD COLUMN IF NOT EXISTS insurance_company TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_no TEXT,
  ADD COLUMN IF NOT EXISTS insurance_claim_no TEXT,
  ADD COLUMN IF NOT EXISTS linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_linked_job ON jobs(linked_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_payer_type ON jobs(payer_type);

-- Add payment_type to payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'regular' CHECK (payment_type IN ('deposit', 'regular'));

-- Add Business Registration fields to shop_settings
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS tin TEXT,
  ADD COLUMN IF NOT EXISTS dti_bn TEXT,
  ADD COLUMN IF NOT EXISTS business_permit TEXT;

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE shop_settings DROP COLUMN IF EXISTS business_permit;
-- ALTER TABLE shop_settings DROP COLUMN IF EXISTS dti_bn;
-- ALTER TABLE shop_settings DROP COLUMN IF EXISTS tin;
-- ALTER TABLE payments DROP COLUMN IF EXISTS payment_type;
-- DROP INDEX IF EXISTS idx_jobs_payer_type;
-- DROP INDEX IF EXISTS idx_jobs_linked_job;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS linked_job_id;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS insurance_claim_no;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS insurance_policy_no;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS insurance_company;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS payer_type;
-- -- Note: cannot easily remove a value from an enum in PostgreSQL
-- -- ALTER TYPE job_status RENAME TO job_status_old;
-- -- CREATE TYPE job_status AS ENUM ('draft','estimate','approved','invoiced','partially_paid','paid','closed');
-- -- ALTER TABLE jobs ALTER COLUMN status TYPE job_status USING status::text::job_status;
-- -- DROP TYPE job_status_old;
