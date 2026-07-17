-- ============================================
-- 00006: Status Workflow + Internal Notes
-- Refines work_orders statuses, adds payment_status & internal_notes
-- ============================================

-- ============================================
-- 1. ADD internal_notes COLUMN
-- ============================================
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- ============================================
-- 2. ADD payment_status COLUMN
-- ============================================
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refund'));

CREATE INDEX IF NOT EXISTS idx_work_orders_payment_status ON work_orders(payment_status);

-- ============================================
-- 3. REPLACE status ENUM
-- Old: draft, estimate, approved, invoiced, partially_paid, paid, closed, voided
-- New: draft, estimate, approved, in_progress, completed, released, closed, voided
-- Mapping: invoiced/partially_paid → completed, paid → released, others stay
-- ============================================
CREATE TYPE work_order_status AS ENUM (
  'draft', 'estimate', 'approved', 'in_progress',
  'completed', 'released', 'closed', 'voided'
);

ALTER TABLE work_orders
  ALTER COLUMN status TYPE work_order_status
  USING (
    CASE status::text
      WHEN 'invoiced' THEN 'completed'::work_order_status
      WHEN 'partially_paid' THEN 'completed'::work_order_status
      WHEN 'paid' THEN 'released'::work_order_status
      ELSE status::text::work_order_status
    END
  );

ALTER TABLE work_orders
  ALTER COLUMN status SET DEFAULT 'draft'::work_order_status;

DROP TYPE IF EXISTS job_status;

-- ============================================
-- 4. UPDATE getDocumentLabel LOGIC
-- embedded in invoice-pdf.tsx (handled in code),
-- but keep enum consistent for DB-level queries.
-- ============================================

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- DROP TYPE IF EXISTS work_order_status;
-- CREATE TYPE job_status AS ENUM ('draft','estimate','approved','invoiced','partially_paid','paid','closed','voided');
-- ALTER TABLE work_orders ALTER COLUMN status TYPE job_status USING (
--   CASE status::text
--     WHEN 'completed' THEN 'invoiced'::job_status
--     WHEN 'released' THEN 'paid'::job_status
--     ELSE status::text::job_status
--   END
-- );
-- ALTER TABLE work_orders ALTER COLUMN status SET DEFAULT 'draft'::job_status;
-- DROP INDEX IF EXISTS idx_work_orders_payment_status;
-- ALTER TABLE work_orders DROP COLUMN IF EXISTS payment_status;
-- ALTER TABLE work_orders DROP COLUMN IF EXISTS internal_notes;
