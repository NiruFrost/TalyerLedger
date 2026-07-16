-- Migration 00001: Initial Schema
-- Description: Creates all core tables for TalyerLedger
-- Reversible: Yes (see down migration at bottom)

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE job_status AS ENUM ('draft', 'estimate', 'approved', 'invoiced', 'partially_paid', 'paid', 'closed');
CREATE TYPE line_item_category AS ENUM ('fluids', 'parts', 'accessories', 'labor', 'other');
CREATE TYPE currency_code AS ENUM ('PHP', 'USD', 'EUR');
CREATE TYPE photo_type AS ENUM ('before', 'after', 'damage', 'vehicle_overview', 'odometer');

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_deleted ON customers(deleted_at);

-- ============================================
-- VEHICLES
-- ============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  engine TEXT,
  transmission TEXT,
  vin TEXT,
  plate TEXT,
  color TEXT,
  cover_photo TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_deleted ON vehicles(deleted_at);

-- ============================================
-- JOBS (Estimates / Repair Orders / Invoices)
-- ============================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_no TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'draft',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  prepared_by TEXT,
  odometer INTEGER,
  currency currency_code NOT NULL DEFAULT 'PHP',
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_vehicle ON jobs(vehicle_id);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_estimate_no ON jobs(estimate_no);
CREATE INDEX idx_jobs_date ON jobs(date);
CREATE INDEX idx_jobs_deleted ON jobs(deleted_at);

-- ============================================
-- LINE ITEMS
-- ============================================
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  category line_item_category NOT NULL,
  item TEXT NOT NULL,
  specification TEXT,
  part_number TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pc',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  installation_status TEXT,
  notes TEXT,
  source_url TEXT,
  is_inventory BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_line_items_job ON line_items(job_id);
CREATE INDEX idx_line_items_category ON line_items(category);
CREATE INDEX idx_line_items_deleted ON line_items(deleted_at);

-- ============================================
-- PHOTOS
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES line_items(id) ON DELETE CASCADE,
  photo_type photo_type NOT NULL DEFAULT 'vehicle_overview',
  caption TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_photos_vehicle ON photos(vehicle_id);
CREATE INDEX idx_photos_job ON photos(job_id);
CREATE INDEX idx_photos_type ON photos(photo_type);
CREATE INDEX idx_photos_deleted ON photos(deleted_at);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_job ON payments(job_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_deleted ON payments(deleted_at);

-- ============================================
-- SHOP SETTINGS (for single-owner, extendable to multi-tenant)
-- ============================================
CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL DEFAULT 'My Repair Shop',
  address TEXT,
  contact_number TEXT,
  email TEXT,
  logo_url TEXT,
  tax_id TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insert default shop settings
INSERT INTO shop_settings (shop_name) VALUES ('My Repair Shop');

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data (single-owner mode)
-- Future: scope by user_id or tenant_id

CREATE POLICY "Users can read customers" ON customers
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert customers" ON customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update customers" ON customers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can soft-delete customers" ON customers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read vehicles" ON vehicles
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert vehicles" ON vehicles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update vehicles" ON vehicles
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read jobs" ON jobs
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert jobs" ON jobs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update jobs" ON jobs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read line_items" ON line_items
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert line_items" ON line_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update line_items" ON line_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read photos" ON photos
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert photos" ON photos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update photos" ON photos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read payments" ON payments
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update payments" ON payments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read shop_settings" ON shop_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update shop_settings" ON shop_settings
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_line_items_updated_at
  BEFORE UPDATE ON line_items FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-SET created_by / updated_by
-- ============================================
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customers_created_by
  BEFORE INSERT ON customers FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_customers_updated_by
  BEFORE UPDATE ON customers FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_vehicles_created_by
  BEFORE INSERT ON vehicles FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_vehicles_updated_by
  BEFORE UPDATE ON vehicles FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_jobs_created_by
  BEFORE INSERT ON jobs FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_jobs_updated_by
  BEFORE UPDATE ON jobs FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_line_items_created_by
  BEFORE INSERT ON line_items FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_line_items_updated_by
  BEFORE UPDATE ON line_items FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_payments_created_by
  BEFORE INSERT ON payments FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_payments_updated_by
  BEFORE UPDATE ON payments FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- ============================================
-- DOWN MIGRATION (for reversibility)
-- ============================================
-- DROP TRIGGER IF EXISTS set_payments_updated_by ON payments;
-- DROP TRIGGER IF EXISTS set_payments_created_by ON payments;
-- DROP TRIGGER IF EXISTS set_line_items_updated_by ON line_items;
-- DROP TRIGGER IF EXISTS set_line_items_created_by ON line_items;
-- DROP TRIGGER IF EXISTS set_jobs_updated_by ON jobs;
-- DROP TRIGGER IF EXISTS set_jobs_created_by ON jobs;
-- DROP TRIGGER IF EXISTS set_vehicles_updated_by ON vehicles;
-- DROP TRIGGER IF EXISTS set_vehicles_created_by ON vehicles;
-- DROP TRIGGER IF EXISTS set_customers_updated_by ON customers;
-- DROP TRIGGER IF EXISTS set_customers_created_by ON customers;
-- DROP FUNCTION IF EXISTS set_updated_by();
-- DROP FUNCTION IF EXISTS set_created_by();
-- DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON shop_settings;
-- DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
-- DROP TRIGGER IF EXISTS update_line_items_updated_at ON line_items;
-- DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
-- DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
-- DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
-- DROP FUNCTION IF EXISTS update_updated_at();
-- DROP TABLE IF EXISTS shop_settings CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS photos CASCADE;
-- DROP TABLE IF EXISTS line_items CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS vehicles CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TYPE IF EXISTS photo_type;
-- DROP TYPE IF EXISTS currency_code;
-- DROP TYPE IF EXISTS line_item_category;
-- DROP TYPE IF EXISTS job_status;
