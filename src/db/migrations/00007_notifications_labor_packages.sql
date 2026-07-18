-- ============================================
-- 00007: Notifications, Labor Catalog, Service Packages
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_work_order ON notifications(work_order_id);
CREATE INDEX idx_notifications_event_type ON notifications(event_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_deleted ON notifications(deleted_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 2. LABOR ITEMS TABLE
-- ============================================
CREATE TABLE labor_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'labor' CHECK (category IN ('fluids', 'parts', 'accessories', 'labor', 'other')),
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'service',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_labor_items_category ON labor_items(category);
CREATE INDEX idx_labor_items_sort ON labor_items(sort_order);
CREATE INDEX idx_labor_items_deleted ON labor_items(deleted_at);

ALTER TABLE labor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labor_items_select" ON labor_items
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "labor_items_insert" ON labor_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "labor_items_update" ON labor_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "labor_items_delete" ON labor_items
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 3. SERVICE PACKAGES + PACKAGE ITEMS TABLES
-- ============================================
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'parts' CHECK (category IN ('fluids', 'parts', 'accessories', 'labor', 'other')),
  total_price NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_service_packages_sort ON service_packages(sort_order);
CREATE INDEX idx_service_packages_deleted ON service_packages(deleted_at);

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_packages_select" ON service_packages
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "service_packages_insert" ON service_packages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "service_packages_update" ON service_packages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "service_packages_delete" ON service_packages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE TABLE package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('fluids', 'parts', 'accessories', 'labor', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pc',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_package_items_package ON package_items(package_id);
CREATE INDEX idx_package_items_sort ON package_items(sort_order);

ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_items_select" ON package_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "package_items_insert" ON package_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "package_items_update" ON package_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "package_items_delete" ON package_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- DROP TABLE IF EXISTS package_items;
-- DROP TABLE IF EXISTS service_packages;
-- DROP TABLE IF EXISTS labor_items;
-- DROP TABLE IF EXISTS notifications;
