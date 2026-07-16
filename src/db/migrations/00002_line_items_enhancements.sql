-- Migration 00002: Line Items Enhancements
-- Description: Adds discount support to line_items and jobs
-- Reversible: Yes
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kgzhhvfousjgadbninfq/sql/new

ALTER TABLE line_items ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('amount', 'percent'));
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS overall_discount_type TEXT CHECK (overall_discount_type IN ('amount', 'percent'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS overall_discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;

-- After running this migration, restart the app.
-- The discount fields in the form UI will then persist to the database.

-- Down migration:
-- ALTER TABLE line_items DROP COLUMN IF EXISTS discount_value;
-- ALTER TABLE line_items DROP COLUMN IF EXISTS discount_type;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS overall_discount_value;
-- ALTER TABLE jobs DROP COLUMN IF EXISTS overall_discount_type;
