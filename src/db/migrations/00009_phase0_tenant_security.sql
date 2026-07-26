-- Migration 00009: Phase 0 tenant security and integrity foundation
-- Purpose: replaces global authenticated access with workshop-scoped RLS,
-- provisions a private attachment bucket, repairs audit conventions, and adds
-- concurrency-safe work-order numbering.
--
-- Data impact:
--   * Existing operational data is assigned automatically only when exactly
--     one auth user exists. Multiple-user legacy databases must be mapped in a
--     reviewed staging migration before this file is applied.
--   * The unowned default shop_settings seed is removed on empty databases.
--   * Invalid negative financial values cause validation to fail rather than
--     being silently rewritten.
--
-- Rollback guidance:
--   Keep workshop IDs and ownership assignments. Roll back application and
--   policy behavior from a verified backup; never restore the old broad RLS
--   policies. See docs/migration-guide.md.

BEGIN;

-- Preserve a supplied actor for trusted migrations while authenticated writes
-- are still forced to the current JWT actor.
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = COALESCE(auth.uid(), NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL DEFAULT 'My Workshop',
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT workshops_owner_unique UNIQUE (owner_id),
  CONSTRAINT workshops_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE TABLE workshop_members (
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (workshop_id, user_id)
);

CREATE UNIQUE INDEX workshop_members_one_active_owner
  ON workshop_members(workshop_id)
  WHERE role = 'owner' AND deleted_at IS NULL;
CREATE INDEX workshop_members_user_active
  ON workshop_members(user_id, workshop_id)
  WHERE deleted_at IS NULL;

ALTER TABLE customers ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE vehicles ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE work_orders ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE line_items ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE photos ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE payments ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE shop_settings ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE documents ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE activity_logs ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE attachments ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE notifications ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE labor_items ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE service_packages ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;
ALTER TABLE package_items ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE RESTRICT;

-- Complete audit and soft-deletion fields omitted by earlier migrations.
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE package_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE package_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE package_items ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE package_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'workshop';
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attachments ADD CONSTRAINT attachments_visibility_check
  CHECK (visibility IN ('private', 'workshop', 'customer'));
ALTER TABLE attachments ADD CONSTRAINT attachments_dimensions_check
  CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0));

-- Refuse an ambiguous legacy ownership conversion. No row is committed when
-- this block raises because the migration is transactional.
DO $$
DECLARE
  v_user_count INTEGER;
  v_operational_count BIGINT;
  v_settings_count INTEGER;
  v_owner_id UUID;
  v_workshop_id UUID;
  v_user RECORD;
BEGIN
  SELECT count(*) INTO v_user_count FROM auth.users;
  SELECT (
    (SELECT count(*) FROM customers) +
    (SELECT count(*) FROM vehicles) +
    (SELECT count(*) FROM work_orders) +
    (SELECT count(*) FROM line_items) +
    (SELECT count(*) FROM photos) +
    (SELECT count(*) FROM payments) +
    (SELECT count(*) FROM documents) +
    (SELECT count(*) FROM activity_logs) +
    (SELECT count(*) FROM attachments) +
    (SELECT count(*) FROM notifications) +
    (SELECT count(*) FROM labor_items) +
    (SELECT count(*) FROM service_packages) +
    (SELECT count(*) FROM package_items)
  ) INTO v_operational_count;
  SELECT count(*) INTO v_settings_count FROM shop_settings;

  IF v_operational_count > 0 AND v_user_count <> 1 THEN
    RAISE EXCEPTION
      'Phase 0 ownership backfill requires exactly one auth user for existing data; found % users',
      v_user_count;
  END IF;

  IF v_operational_count = 0 AND v_user_count <> 1 AND EXISTS (
    SELECT 1 FROM shop_settings
    WHERE shop_name <> 'My Repair Shop'
       OR address IS NOT NULL
       OR contact_number IS NOT NULL
       OR email IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Custom shop settings require an explicit owner mapping';
  END IF;

  FOR v_user IN SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'My Workshop') AS name FROM auth.users LOOP
    INSERT INTO workshops (owner_id, name, created_by, updated_by)
    VALUES (v_user.id, v_user.name, v_user.id, v_user.id)
    ON CONFLICT (owner_id) DO NOTHING;

    SELECT id INTO v_workshop_id FROM workshops WHERE owner_id = v_user.id;
    INSERT INTO workshop_members (workshop_id, user_id, role, created_by, updated_by)
    VALUES (v_workshop_id, v_user.id, 'owner', v_user.id, v_user.id)
    ON CONFLICT (workshop_id, user_id) DO NOTHING;
  END LOOP;

  IF v_user_count = 1 THEN
    SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
    SELECT id INTO v_workshop_id FROM workshops WHERE owner_id = v_owner_id;

    UPDATE customers SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE vehicles SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE work_orders SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE line_items SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE photos SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE payments SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE shop_settings SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE documents SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE activity_logs SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE attachments SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE notifications SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE labor_items SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE service_packages SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;
    UPDATE package_items SET workshop_id = v_workshop_id WHERE workshop_id IS NULL;

    IF v_settings_count > 1 THEN
      RAISE EXCEPTION 'Multiple legacy shop_settings rows require explicit reconciliation';
    END IF;
  ELSE
    DELETE FROM shop_settings WHERE workshop_id IS NULL;
  END IF;

  INSERT INTO shop_settings (workshop_id, shop_name, created_by, updated_by)
  SELECT w.id, w.name, w.owner_id, w.owner_id
  FROM workshops w
  WHERE NOT EXISTS (SELECT 1 FROM shop_settings s WHERE s.workshop_id = w.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_workshop_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT wm.workshop_id
  FROM public.workshop_members wm
  WHERE wm.user_id = auth.uid()
    AND wm.deleted_at IS NULL
  ORDER BY CASE wm.role WHEN 'owner' THEN 0 ELSE 1 END, wm.created_at
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_workshop_member(target_workshop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workshop_members wm
    WHERE wm.workshop_id = target_workshop_id
      AND wm.user_id = auth.uid()
      AND wm.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workshop_owner(target_workshop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workshop_members wm
    WHERE wm.workshop_id = target_workshop_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
      AND wm.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.current_workshop_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_workshop_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_workshop_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_workshop_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workshop_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workshop_owner(UUID) TO authenticated;

-- Every application insert receives the caller's workshop automatically.
ALTER TABLE customers ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE vehicles ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE work_orders ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE line_items ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE photos ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE payments ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE shop_settings ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE documents ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE activity_logs ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE attachments ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE notifications ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE labor_items ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE service_packages ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();
ALTER TABLE package_items ALTER COLUMN workshop_id SET DEFAULT public.current_workshop_id();

ALTER TABLE customers ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE work_orders ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE line_items ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE photos ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE shop_settings ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE activity_logs ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE attachments ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE labor_items ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE service_packages ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE package_items ALTER COLUMN workshop_id SET NOT NULL;

CREATE UNIQUE INDEX customers_workshop_id_id ON customers(workshop_id, id);
CREATE UNIQUE INDEX vehicles_workshop_id_id ON vehicles(workshop_id, id);
CREATE UNIQUE INDEX work_orders_workshop_id_id ON work_orders(workshop_id, id);
CREATE UNIQUE INDEX service_packages_workshop_id_id ON service_packages(workshop_id, id);
CREATE UNIQUE INDEX shop_settings_one_per_workshop ON shop_settings(workshop_id) WHERE deleted_at IS NULL;

CREATE INDEX customers_workshop_active ON customers(workshop_id, name) WHERE deleted_at IS NULL;
CREATE INDEX vehicles_workshop_active ON vehicles(workshop_id, make, model) WHERE deleted_at IS NULL;
CREATE INDEX work_orders_workshop_active ON work_orders(workshop_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX line_items_workshop_active ON line_items(workshop_id, work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX photos_workshop_active ON photos(workshop_id) WHERE deleted_at IS NULL;
CREATE INDEX payments_workshop_active ON payments(workshop_id, work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX documents_workshop_active ON documents(workshop_id, work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX activity_logs_workshop_created ON activity_logs(workshop_id, created_at DESC);
CREATE INDEX attachments_workshop_active ON attachments(workshop_id, parent_type, parent_id) WHERE deleted_at IS NULL;
CREATE INDEX notifications_workshop_active ON notifications(workshop_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX labor_items_workshop_active ON labor_items(workshop_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX service_packages_workshop_active ON service_packages(workshop_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX package_items_workshop_active ON package_items(workshop_id, package_id) WHERE deleted_at IS NULL;

-- Composite keys prevent a caller from joining a row to another workshop even
-- when a globally valid UUID is supplied.
ALTER TABLE vehicles ADD CONSTRAINT vehicles_workshop_customer_fk
  FOREIGN KEY (workshop_id, customer_id) REFERENCES customers(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_workshop_vehicle_fk
  FOREIGN KEY (workshop_id, vehicle_id) REFERENCES vehicles(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_workshop_customer_fk
  FOREIGN KEY (workshop_id, customer_id) REFERENCES customers(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_workshop_linked_fk
  FOREIGN KEY (workshop_id, linked_work_order_id) REFERENCES work_orders(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE line_items ADD CONSTRAINT line_items_workshop_order_fk
  FOREIGN KEY (workshop_id, work_order_id) REFERENCES work_orders(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE payments ADD CONSTRAINT payments_workshop_order_fk
  FOREIGN KEY (workshop_id, work_order_id) REFERENCES work_orders(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE documents ADD CONSTRAINT documents_workshop_order_fk
  FOREIGN KEY (workshop_id, work_order_id) REFERENCES work_orders(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_workshop_order_fk
  FOREIGN KEY (workshop_id, work_order_id) REFERENCES work_orders(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE notifications ADD CONSTRAINT notifications_workshop_order_fk
  FOREIGN KEY (workshop_id, work_order_id) REFERENCES work_orders(workshop_id, id) ON DELETE RESTRICT;
ALTER TABLE package_items ADD CONSTRAINT package_items_workshop_package_fk
  FOREIGN KEY (workshop_id, package_id) REFERENCES service_packages(workshop_id, id) ON DELETE RESTRICT;

-- Legacy single-column foreign keys must not cascade-delete operational or
-- audit records. The composite tenant keys above remain the primary integrity
-- boundary; these replacements close the older hard-delete paths.
ALTER TABLE line_items DROP CONSTRAINT IF EXISTS line_items_job_id_fkey;
ALTER TABLE line_items ADD CONSTRAINT line_items_work_order_id_fkey
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE RESTRICT;
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_vehicle_id_fkey;
ALTER TABLE photos ADD CONSTRAINT photos_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT;
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_job_id_fkey;
ALTER TABLE photos ADD CONSTRAINT photos_work_order_id_fkey
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE RESTRICT;
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_line_item_id_fkey;
ALTER TABLE photos ADD CONSTRAINT photos_line_item_id_fkey
  FOREIGN KEY (line_item_id) REFERENCES line_items(id) ON DELETE RESTRICT;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_work_order_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_work_order_id_fkey
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE RESTRICT;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_work_order_id_fkey;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_work_order_id_fkey
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE RESTRICT;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_work_order_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_work_order_id_fkey
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE RESTRICT;
ALTER TABLE package_items DROP CONSTRAINT IF EXISTS package_items_package_id_fkey;
ALTER TABLE package_items ADD CONSTRAINT package_items_package_id_fkey
  FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE RESTRICT;

-- Validate existing financial values instead of silently altering records.
ALTER TABLE line_items ADD CONSTRAINT line_items_quantity_positive CHECK (quantity > 0) NOT VALID;
ALTER TABLE line_items ADD CONSTRAINT line_items_unit_price_nonnegative CHECK (unit_price >= 0) NOT VALID;
ALTER TABLE line_items ADD CONSTRAINT line_items_total_nonnegative CHECK (line_total >= 0) NOT VALID;
ALTER TABLE line_items ADD CONSTRAINT line_items_total_matches_inputs
  CHECK (line_total = round(quantity * unit_price, 2)) NOT VALID;
ALTER TABLE line_items ADD CONSTRAINT line_items_discount_valid CHECK (
  (discount_type IS NULL AND discount_value = 0) OR
  (discount_type = 'amount' AND discount_value >= 0) OR
  (discount_type = 'percent' AND discount_value BETWEEN 0 AND 100)
) NOT VALID;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_discount_valid CHECK (
  (overall_discount_type IS NULL AND overall_discount_value = 0) OR
  (overall_discount_type = 'amount' AND overall_discount_value >= 0) OR
  (overall_discount_type = 'percent' AND overall_discount_value BETWEEN 0 AND 100)
) NOT VALID;
ALTER TABLE payments ADD CONSTRAINT payments_amount_positive CHECK (amount > 0) NOT VALID;
ALTER TABLE labor_items ADD CONSTRAINT labor_items_price_nonnegative CHECK (unit_price >= 0) NOT VALID;
ALTER TABLE service_packages ADD CONSTRAINT service_packages_price_nonnegative CHECK (total_price IS NULL OR total_price >= 0) NOT VALID;
ALTER TABLE package_items ADD CONSTRAINT package_items_values_valid CHECK (quantity > 0 AND unit_price >= 0) NOT VALID;

ALTER TABLE line_items VALIDATE CONSTRAINT line_items_quantity_positive;
ALTER TABLE line_items VALIDATE CONSTRAINT line_items_unit_price_nonnegative;
ALTER TABLE line_items VALIDATE CONSTRAINT line_items_total_nonnegative;
ALTER TABLE line_items VALIDATE CONSTRAINT line_items_total_matches_inputs;
ALTER TABLE line_items VALIDATE CONSTRAINT line_items_discount_valid;
ALTER TABLE work_orders VALIDATE CONSTRAINT work_orders_discount_valid;
ALTER TABLE payments VALIDATE CONSTRAINT payments_amount_positive;
ALTER TABLE labor_items VALIDATE CONSTRAINT labor_items_price_nonnegative;
ALTER TABLE service_packages VALIDATE CONSTRAINT service_packages_price_nonnegative;
ALTER TABLE package_items VALIDATE CONSTRAINT package_items_values_valid;

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE work_orders ADD CONSTRAINT work_orders_estimate_number_format
  CHECK (estimate_no ~ '^[0-9]{2}-[0-9]{4}-[0-9]{6}$') NOT VALID;
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_payment_status_check;
UPDATE work_orders SET payment_status = 'overpaid' WHERE payment_status = 'refund';
ALTER TABLE work_orders ADD CONSTRAINT work_orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid'));

CREATE OR REPLACE FUNCTION enforce_workshop_scope()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.workshop_id = COALESCE(NEW.workshop_id, public.current_workshop_id());
    IF NEW.workshop_id IS NULL THEN
      RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
    END IF;
    IF auth.uid() IS NOT NULL AND NOT public.is_workshop_member(NEW.workshop_id) THEN
      RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
    END IF;
    IF auth.uid() IS NULL AND current_user NOT IN ('postgres', 'service_role', 'supabase_auth_admin') THEN
      RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.workshop_id IS DISTINCT FROM OLD.workshop_id THEN
    RAISE EXCEPTION 'workshop scope is immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'customers', 'vehicles', 'work_orders', 'line_items', 'photos', 'payments',
    'shop_settings', 'documents', 'activity_logs', 'attachments', 'notifications',
    'labor_items', 'service_packages', 'package_items'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER enforce_%1$s_workshop_scope BEFORE INSERT OR UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION enforce_workshop_scope()',
      table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION validate_active_relationship()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  parent_exists BOOLEAN;
  row_data JSONB := to_jsonb(NEW);
  row_workshop UUID := (row_data->>'workshop_id')::UUID;
  parent_id UUID;
BEGIN
  IF row_data->>'deleted_at' IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'vehicles' THEN
    parent_id := NULLIF(row_data->>'customer_id', '')::UUID;
    IF parent_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.customers
        WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
      ) INTO parent_exists;
    ELSE
      parent_exists := true;
    END IF;
  ELSIF TG_TABLE_NAME = 'work_orders' THEN
    parent_id := NULLIF(row_data->>'vehicle_id', '')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
    ) INTO parent_exists;
    parent_id := NULLIF(row_data->>'customer_id', '')::UUID;
    IF parent_exists AND parent_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.customers
        WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
      ) INTO parent_exists;
    END IF;
    parent_id := NULLIF(row_data->>'linked_work_order_id', '')::UUID;
    IF parent_exists AND parent_id IS NOT NULL THEN
      IF parent_id = (row_data->>'id')::UUID THEN
        parent_exists := false;
      ELSE
        SELECT EXISTS (
          SELECT 1 FROM public.work_orders
          WHERE id = parent_id
            AND workshop_id = row_workshop
            AND deleted_at IS NULL
        ) INTO parent_exists;
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME IN ('line_items', 'payments', 'documents') THEN
    parent_id := NULLIF(row_data->>'work_order_id', '')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM public.work_orders
      WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
    ) INTO parent_exists;
  ELSIF TG_TABLE_NAME = 'notifications' THEN
    parent_id := NULLIF(row_data->>'work_order_id', '')::UUID;
    IF parent_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.work_orders
        WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
      ) INTO parent_exists;
    ELSE
      parent_exists := true;
    END IF;
  ELSIF TG_TABLE_NAME = 'package_items' THEN
    parent_id := NULLIF(row_data->>'package_id', '')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM public.service_packages
      WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
    ) INTO parent_exists;
  ELSIF TG_TABLE_NAME = 'photos' THEN
    parent_exists := true;
    parent_id := NULLIF(row_data->>'vehicle_id', '')::UUID;
    IF parent_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.vehicles
        WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
      ) INTO parent_exists;
    END IF;
    parent_id := NULLIF(row_data->>'work_order_id', '')::UUID;
    IF parent_exists AND parent_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.work_orders
        WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
      ) INTO parent_exists;
    END IF;
    parent_id := NULLIF(row_data->>'line_item_id', '')::UUID;
    IF parent_exists AND parent_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.line_items
        WHERE id = parent_id AND workshop_id = row_workshop AND deleted_at IS NULL
      ) INTO parent_exists;
    END IF;
  ELSE
    parent_exists := true;
  END IF;

  IF NOT COALESCE(parent_exists, false) THEN
    RAISE EXCEPTION '% parent is unavailable in this workshop', TG_TABLE_NAME
      USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'vehicles', 'work_orders', 'line_items', 'photos', 'payments',
    'documents', 'notifications', 'package_items'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER validate_%1$s_active_relationship BEFORE INSERT OR UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION validate_active_relationship()',
      table_name
    );
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX attachments_storage_path_unique ON attachments(storage_path);
CREATE UNIQUE INDEX attachments_thumbnail_path_unique
  ON attachments(thumbnail_path) WHERE thumbnail_path IS NOT NULL;

CREATE OR REPLACE FUNCTION validate_attachment_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  parent_workshop UUID;
  expected_prefix TEXT;
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  CASE NEW.parent_type
    WHEN 'vehicle' THEN SELECT workshop_id INTO parent_workshop FROM public.vehicles WHERE id = NEW.parent_id AND deleted_at IS NULL;
    WHEN 'work_order' THEN SELECT workshop_id INTO parent_workshop FROM public.work_orders WHERE id = NEW.parent_id AND deleted_at IS NULL;
    WHEN 'line_item' THEN SELECT workshop_id INTO parent_workshop FROM public.line_items WHERE id = NEW.parent_id AND deleted_at IS NULL;
    WHEN 'customer' THEN SELECT workshop_id INTO parent_workshop FROM public.customers WHERE id = NEW.parent_id AND deleted_at IS NULL;
    ELSE RAISE EXCEPTION 'unsupported attachment parent type' USING ERRCODE = '22023';
  END CASE;

  IF parent_workshop IS NULL OR parent_workshop <> NEW.workshop_id THEN
    RAISE EXCEPTION 'attachment parent does not belong to this workshop' USING ERRCODE = '23503';
  END IF;

  expected_prefix := NEW.workshop_id::TEXT || '/' || NEW.parent_type || '/' || NEW.parent_id::TEXT || '/';
  IF NEW.storage_path NOT LIKE expected_prefix || '%'
     OR NEW.storage_path !~* '\.jpg$'
     OR NEW.storage_path ~* '_thumb\.jpg$' THEN
    RAISE EXCEPTION 'attachment storage path does not match its parent' USING ERRCODE = '23514';
  END IF;
  IF NEW.thumbnail_path IS NOT NULL AND (
    NEW.thumbnail_path NOT LIKE expected_prefix || '%'
    OR NEW.thumbnail_path !~* '_thumb\.jpg$'
  ) THEN
    RAISE EXCEPTION 'attachment thumbnail path does not match its parent' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_attachments_parent
  BEFORE INSERT OR UPDATE OF parent_type, parent_id, workshop_id, storage_path, thumbnail_path, deleted_at ON attachments
  FOR EACH ROW EXECUTE FUNCTION validate_attachment_parent();

CREATE OR REPLACE FUNCTION set_line_item_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.line_total := round(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_line_items_total
  BEFORE INSERT OR UPDATE OF quantity, unit_price, line_total ON line_items
  FOR EACH ROW EXECUTE FUNCTION set_line_item_total();

CREATE OR REPLACE FUNCTION enforce_work_order_transition()
RETURNS TRIGGER AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text <> 'draft' THEN
      RAISE EXCEPTION 'new work orders must start in draft'
        USING ERRCODE = '23514';
    END IF;
    NEW.version := 1;
    RETURN NEW;
  END IF;

  IF NEW.estimate_no IS DISTINCT FROM OLD.estimate_no THEN
    RAISE EXCEPTION 'work order number is immutable' USING ERRCODE = '23514';
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    NEW.version = OLD.version + 1;
    RETURN NEW;
  END IF;

  allowed := CASE OLD.status::text
    WHEN 'draft' THEN NEW.status::text IN ('estimate', 'voided')
    WHEN 'estimate' THEN NEW.status::text IN ('approved', 'voided')
    WHEN 'approved' THEN NEW.status::text IN ('in_progress', 'voided')
    WHEN 'in_progress' THEN NEW.status::text IN ('completed', 'voided')
    WHEN 'completed' THEN NEW.status::text IN ('released', 'voided')
    WHEN 'released' THEN NEW.status::text IN ('closed', 'voided')
    ELSE false
  END;

  IF NOT allowed THEN
    RAISE EXCEPTION 'invalid work order status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  NEW.version = OLD.version + 1;
  INSERT INTO public.activity_logs (workshop_id, work_order_id, event_type, description, metadata, created_by)
  VALUES (
    OLD.workshop_id,
    OLD.id,
    'status_changed',
    format('Status changed from %s to %s', OLD.status, NEW.status),
    jsonb_build_object('from', OLD.status, 'to', NEW.status),
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_work_orders_transition
  BEFORE INSERT OR UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION enforce_work_order_transition();

CREATE OR REPLACE FUNCTION protect_derived_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'payment status is derived from line items and payments'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_work_orders_payment_status
  BEFORE UPDATE OF payment_status ON work_orders
  FOR EACH ROW EXECUTE FUNCTION protect_derived_payment_status();

CREATE OR REPLACE FUNCTION recalculate_work_order_payment_status(target_work_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  subtotal NUMERIC(14,2);
  overall_type TEXT;
  overall_value NUMERIC;
  total_net NUMERIC(14,2);
  total_paid NUMERIC(14,2);
  calculated_status TEXT;
BEGIN
  SELECT COALESCE(sum(line_net), 0)::NUMERIC(14,2)
  INTO subtotal
  FROM (
    SELECT greatest(
      round(quantity * unit_price, 2) - least(
        round(quantity * unit_price, 2),
        CASE discount_type
          WHEN 'amount' THEN round(discount_value, 2)
          WHEN 'percent' THEN round(round(quantity * unit_price, 2) * discount_value / 100, 2)
          ELSE 0
        END
      ),
      0
    ) AS line_net
    FROM public.line_items
    WHERE work_order_id = target_work_order_id AND deleted_at IS NULL
  ) lines;

  SELECT overall_discount_type, overall_discount_value
  INTO overall_type, overall_value
  FROM public.work_orders
  WHERE id = target_work_order_id;

  total_net := greatest(
    subtotal - least(
      subtotal,
      CASE overall_type
        WHEN 'amount' THEN round(overall_value, 2)
        WHEN 'percent' THEN round(subtotal * overall_value / 100, 2)
        ELSE 0
      END
    ),
    0
  );

  SELECT COALESCE(sum(amount), 0)::NUMERIC(14,2)
  INTO total_paid
  FROM public.payments
  WHERE work_order_id = target_work_order_id AND deleted_at IS NULL;

  calculated_status := CASE
    WHEN total_net = 0 AND total_paid = 0 THEN 'unpaid'
    WHEN total_paid = 0 THEN 'unpaid'
    WHEN total_paid < total_net THEN 'partial'
    WHEN total_paid = total_net THEN 'paid'
    ELSE 'overpaid'
  END;

  UPDATE public.work_orders
  SET payment_status = calculated_status
  WHERE id = target_work_order_id
    AND payment_status IS DISTINCT FROM calculated_status;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_work_order_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'work_orders' THEN
    PERFORM public.recalculate_work_order_payment_status(NEW.id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_work_order_payment_status(OLD.work_order_id);
  ELSE
    PERFORM public.recalculate_work_order_payment_status(NEW.work_order_id);
    IF TG_OP = 'UPDATE' AND NEW.work_order_id IS DISTINCT FROM OLD.work_order_id THEN
      PERFORM public.recalculate_work_order_payment_status(OLD.work_order_id);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER refresh_payment_status_after_line_items
  AFTER INSERT OR UPDATE OR DELETE ON line_items
  FOR EACH ROW EXECUTE FUNCTION refresh_work_order_payment_status();
CREATE TRIGGER refresh_payment_status_after_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION refresh_work_order_payment_status();
CREATE TRIGGER refresh_payment_status_after_order_discount
  AFTER UPDATE OF overall_discount_type, overall_discount_value ON work_orders
  FOR EACH ROW
  WHEN (
    OLD.overall_discount_type IS DISTINCT FROM NEW.overall_discount_type
    OR OLD.overall_discount_value IS DISTINCT FROM NEW.overall_discount_value
  )
  EXECUTE FUNCTION refresh_work_order_payment_status();

REVOKE ALL ON FUNCTION recalculate_work_order_payment_status(UUID) FROM PUBLIC;

DO $$
DECLARE
  order_record RECORD;
BEGIN
  FOR order_record IN SELECT id FROM work_orders LOOP
    PERFORM recalculate_work_order_payment_status(order_record.id);
  END LOOP;
END;
$$;

-- Repair missing audit triggers. Existing trigger names are retained.
CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON workshops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_workshops_created_by BEFORE INSERT ON workshops FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_workshops_updated_by BEFORE UPDATE ON workshops FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER update_workshop_members_updated_at BEFORE UPDATE ON workshop_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_workshop_members_created_by BEFORE INSERT ON workshop_members FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_workshop_members_updated_by BEFORE UPDATE ON workshop_members FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER set_photos_created_by BEFORE INSERT ON photos FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_shop_settings_created_by BEFORE INSERT ON shop_settings FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_shop_settings_updated_by BEFORE UPDATE ON shop_settings FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_notifications_created_by BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_notifications_updated_by BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER update_labor_items_updated_at BEFORE UPDATE ON labor_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_labor_items_created_by BEFORE INSERT ON labor_items FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_labor_items_updated_by BEFORE UPDATE ON labor_items FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_service_packages_created_by BEFORE INSERT ON service_packages FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_service_packages_updated_by BEFORE UPDATE ON service_packages FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER update_package_items_updated_at BEFORE UPDATE ON package_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_package_items_created_by BEFORE INSERT ON package_items FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER set_package_items_updated_by BEFORE UPDATE ON package_items FOR EACH ROW EXECUTE FUNCTION set_updated_by();

CREATE OR REPLACE FUNCTION set_attachment_uploader()
RETURNS TRIGGER AS $$
BEGIN
  NEW.uploaded_by = COALESCE(auth.uid(), NEW.uploaded_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER set_attachments_uploaded_by BEFORE INSERT ON attachments FOR EACH ROW EXECUTE FUNCTION set_attachment_uploader();

-- Atomic daily numbering. Allocated values are intentionally never reused.
CREATE TABLE work_order_number_counters (
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
  counter_date DATE NOT NULL,
  last_value INTEGER NOT NULL CHECK (last_value > 0),
  PRIMARY KEY (workshop_id, counter_date)
);
ALTER TABLE work_order_number_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_number_counters FORCE ROW LEVEL SECURITY;

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS jobs_estimate_no_key;
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_estimate_no_key;
CREATE UNIQUE INDEX work_orders_workshop_number_unique ON work_orders(workshop_id, estimate_no);

-- Seed counters from already-issued Phase 0-format numbers before new values
-- can be allocated. Legacy formats remain immutable but do not collide with
-- the six-digit format.
INSERT INTO work_order_number_counters (workshop_id, counter_date, last_value)
SELECT
  workshop_id,
  to_date(left(estimate_no, 7), 'YY-MMDD'),
  max(right(estimate_no, 6)::INTEGER)
FROM work_orders
WHERE estimate_no ~ '^[0-9]{2}-[0-9]{4}-[0-9]{6}$'
  AND right(estimate_no, 6)::INTEGER > 0
GROUP BY workshop_id, to_date(left(estimate_no, 7), 'YY-MMDD')
ON CONFLICT (workshop_id, counter_date)
DO UPDATE SET last_value = greatest(
  work_order_number_counters.last_value,
  EXCLUDED.last_value
);

CREATE OR REPLACE FUNCTION next_work_order_number(target_workshop_id UUID DEFAULT public.current_workshop_id())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  local_date DATE;
  next_value INTEGER;
  workshop_timezone TEXT;
BEGIN
  IF target_workshop_id IS NULL OR NOT public.is_workshop_member(target_workshop_id) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;

  SELECT timezone INTO workshop_timezone
  FROM public.workshops
  WHERE id = target_workshop_id AND deleted_at IS NULL;
  local_date := (now() AT TIME ZONE workshop_timezone)::date;

  INSERT INTO public.work_order_number_counters (workshop_id, counter_date, last_value)
  VALUES (target_workshop_id, local_date, 1)
  ON CONFLICT (workshop_id, counter_date)
  DO UPDATE SET last_value = public.work_order_number_counters.last_value + 1
  RETURNING last_value INTO next_value;

  IF next_value > 999999 THEN
    RAISE EXCEPTION 'daily work order number capacity exhausted'
      USING ERRCODE = '22003';
  END IF;

  RETURN to_char(local_date, 'YY-MMDD') || '-' || lpad(next_value::text, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION next_work_order_number(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION next_work_order_number(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION search_workshop(search_term TEXT, result_limit INTEGER DEFAULT 5)
RETURNS TABLE (entity_type TEXT, id UUID, label TEXT, detail TEXT)
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH input AS (
    SELECT '%' || left(btrim(search_term), 80) || '%' AS pattern,
           greatest(1, least(result_limit, 10)) AS row_limit
  ), results(entity_type, id, label, detail) AS (
    SELECT 'customer'::TEXT, c.id, c.name, NULL::TEXT
    FROM public.customers c, input i
    WHERE length(btrim(search_term)) >= 2 AND c.deleted_at IS NULL AND c.name ILIKE i.pattern
    LIMIT (SELECT row_limit FROM input)
  ), vehicle_results(entity_type, id, label, detail) AS (
    SELECT 'vehicle'::TEXT, v.id, concat_ws(' ', v.make, v.model), COALESCE(v.plate, v.vin)
    FROM public.vehicles v, input i
    WHERE length(btrim(search_term)) >= 2
      AND v.deleted_at IS NULL
      AND concat_ws(' ', v.make, v.model, v.plate, v.vin) ILIKE i.pattern
    LIMIT (SELECT row_limit FROM input)
  ), order_results(entity_type, id, label, detail) AS (
    SELECT 'work_order'::TEXT, w.id, w.estimate_no, NULL::TEXT
    FROM public.work_orders w, input i
    WHERE length(btrim(search_term)) >= 2 AND w.deleted_at IS NULL AND w.estimate_no ILIKE i.pattern
    LIMIT (SELECT row_limit FROM input)
  )
  SELECT entity_type, id, label, detail FROM results
  UNION ALL SELECT entity_type, id, label, detail FROM vehicle_results
  UNION ALL SELECT entity_type, id, label, detail FROM order_results;
$$;

REVOKE ALL ON FUNCTION search_workshop(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION search_workshop(TEXT, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION create_work_order_with_items(
  order_payload JSONB,
  items_payload JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_workshop UUID := public.current_workshop_id();
  new_order_id UUID;
  item_payload JSONB;
BEGIN
  IF target_workshop IS NULL OR NOT public.is_workshop_member(target_workshop) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(items_payload) <> 'array' OR jsonb_array_length(items_payload) > 200 THEN
    RAISE EXCEPTION 'line items must be an array with at most 200 entries' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(NULLIF(order_payload->>'status', ''), 'draft') <> 'draft' THEN
    RAISE EXCEPTION 'new work orders must start in draft' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.work_orders (
    workshop_id, estimate_no, vehicle_id, customer_id, status, date, prepared_by,
    odometer, currency, payer_type, insurance_company, insurance_policy_no,
    insurance_claim_no, linked_work_order_id, overall_discount_type,
    overall_discount_value, notes, internal_notes, terms
  ) VALUES (
    target_workshop,
    public.next_work_order_number(target_workshop),
    (order_payload->>'vehicle_id')::UUID,
    NULLIF(order_payload->>'customer_id', '')::UUID,
    'draft'::public.work_order_status,
    COALESCE(
      NULLIF(order_payload->>'date', '')::DATE,
      (
        now() AT TIME ZONE (
          SELECT timezone FROM public.workshops WHERE id = target_workshop
        )
      )::DATE
    ),
    NULLIF(order_payload->>'prepared_by', ''),
    NULLIF(order_payload->>'odometer', '')::INTEGER,
    COALESCE(order_payload->>'currency', 'PHP')::public.currency_code,
    NULLIF(order_payload->>'payer_type', ''),
    NULLIF(order_payload->>'insurance_company', ''),
    NULLIF(order_payload->>'insurance_policy_no', ''),
    NULLIF(order_payload->>'insurance_claim_no', ''),
    NULLIF(order_payload->>'linked_work_order_id', '')::UUID,
    NULLIF(order_payload->>'overall_discount_type', ''),
    COALESCE((order_payload->>'overall_discount_value')::NUMERIC, 0),
    NULLIF(order_payload->>'notes', ''),
    NULLIF(order_payload->>'internal_notes', ''),
    NULLIF(order_payload->>'terms', '')
  ) RETURNING id INTO new_order_id;

  FOR item_payload IN SELECT value FROM jsonb_array_elements(items_payload) LOOP
    INSERT INTO public.line_items (
      workshop_id, work_order_id, category, item, specification, part_number,
      quantity, unit, unit_price, line_total, discount_type, discount_value,
      installation_status, notes, source_url, sort_order
    ) VALUES (
      target_workshop,
      new_order_id,
      (item_payload->>'category')::public.line_item_category,
      item_payload->>'item',
      NULLIF(item_payload->>'specification', ''),
      NULLIF(item_payload->>'part_number', ''),
      (item_payload->>'quantity')::NUMERIC,
      item_payload->>'unit',
      (item_payload->>'unit_price')::NUMERIC,
      round((item_payload->>'quantity')::NUMERIC * (item_payload->>'unit_price')::NUMERIC, 2),
      NULLIF(item_payload->>'discount_type', ''),
      COALESCE((item_payload->>'discount_value')::NUMERIC, 0),
      NULLIF(item_payload->>'installation_status', ''),
      NULLIF(item_payload->>'notes', ''),
      NULLIF(item_payload->>'source_url', ''),
      COALESCE((item_payload->>'sort_order')::INTEGER, 0)
    );
  END LOOP;

  PERFORM public.recalculate_work_order_payment_status(new_order_id);
  RETURN new_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_work_order_with_items(
  target_work_order_id UUID,
  expected_version INTEGER,
  order_payload JSONB,
  items_payload JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_workshop UUID := public.current_workshop_id();
  current_version INTEGER;
  item_payload JSONB;
  item_id UUID;
  affected INTEGER;
BEGIN
  IF target_workshop IS NULL OR NOT public.is_workshop_member(target_workshop) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(items_payload) <> 'array' OR jsonb_array_length(items_payload) > 200 THEN
    RAISE EXCEPTION 'line items must be an array with at most 200 entries' USING ERRCODE = '22023';
  END IF;

  SELECT version INTO current_version
  FROM public.work_orders
  WHERE id = target_work_order_id AND workshop_id = target_workshop AND deleted_at IS NULL
  FOR UPDATE;
  IF current_version IS NULL THEN
    RAISE EXCEPTION 'work order not found' USING ERRCODE = 'P0002';
  END IF;
  IF current_version <> expected_version THEN
    RAISE EXCEPTION 'work order changed; refresh before saving' USING ERRCODE = '40001';
  END IF;

  UPDATE public.work_orders SET
    vehicle_id = (order_payload->>'vehicle_id')::UUID,
    customer_id = NULLIF(order_payload->>'customer_id', '')::UUID,
    status = COALESCE(order_payload->>'status', status::TEXT)::public.work_order_status,
    date = COALESCE(NULLIF(order_payload->>'date', '')::DATE, date),
    prepared_by = NULLIF(order_payload->>'prepared_by', ''),
    odometer = NULLIF(order_payload->>'odometer', '')::INTEGER,
    currency = COALESCE(order_payload->>'currency', currency::TEXT)::public.currency_code,
    payer_type = NULLIF(order_payload->>'payer_type', ''),
    insurance_company = NULLIF(order_payload->>'insurance_company', ''),
    insurance_policy_no = NULLIF(order_payload->>'insurance_policy_no', ''),
    insurance_claim_no = NULLIF(order_payload->>'insurance_claim_no', ''),
    linked_work_order_id = NULLIF(order_payload->>'linked_work_order_id', '')::UUID,
    overall_discount_type = NULLIF(order_payload->>'overall_discount_type', ''),
    overall_discount_value = COALESCE((order_payload->>'overall_discount_value')::NUMERIC, 0),
    notes = NULLIF(order_payload->>'notes', ''),
    internal_notes = NULLIF(order_payload->>'internal_notes', ''),
    terms = NULLIF(order_payload->>'terms', '')
  WHERE id = target_work_order_id AND workshop_id = target_workshop;

  UPDATE public.line_items
  SET deleted_at = now(), updated_by = auth.uid()
  WHERE work_order_id = target_work_order_id
    AND workshop_id = target_workshop
    AND deleted_at IS NULL;

  FOR item_payload IN SELECT value FROM jsonb_array_elements(items_payload) LOOP
    item_id := NULLIF(item_payload->>'id', '')::UUID;
    IF item_id IS NULL THEN
      INSERT INTO public.line_items (
        workshop_id, work_order_id, category, item, specification, part_number,
        quantity, unit, unit_price, line_total, discount_type, discount_value,
        installation_status, notes, source_url, sort_order
      ) VALUES (
        target_workshop, target_work_order_id,
        (item_payload->>'category')::public.line_item_category, item_payload->>'item',
        NULLIF(item_payload->>'specification', ''), NULLIF(item_payload->>'part_number', ''),
        (item_payload->>'quantity')::NUMERIC, item_payload->>'unit', (item_payload->>'unit_price')::NUMERIC,
        round((item_payload->>'quantity')::NUMERIC * (item_payload->>'unit_price')::NUMERIC, 2),
        NULLIF(item_payload->>'discount_type', ''), COALESCE((item_payload->>'discount_value')::NUMERIC, 0),
        NULLIF(item_payload->>'installation_status', ''), NULLIF(item_payload->>'notes', ''),
        NULLIF(item_payload->>'source_url', ''), COALESCE((item_payload->>'sort_order')::INTEGER, 0)
      );
    ELSE
      UPDATE public.line_items SET
        category = (item_payload->>'category')::public.line_item_category,
        item = item_payload->>'item',
        specification = NULLIF(item_payload->>'specification', ''),
        part_number = NULLIF(item_payload->>'part_number', ''),
        quantity = (item_payload->>'quantity')::NUMERIC,
        unit = item_payload->>'unit',
        unit_price = (item_payload->>'unit_price')::NUMERIC,
        line_total = round((item_payload->>'quantity')::NUMERIC * (item_payload->>'unit_price')::NUMERIC, 2),
        discount_type = NULLIF(item_payload->>'discount_type', ''),
        discount_value = COALESCE((item_payload->>'discount_value')::NUMERIC, 0),
        installation_status = NULLIF(item_payload->>'installation_status', ''),
        notes = NULLIF(item_payload->>'notes', ''),
        source_url = NULLIF(item_payload->>'source_url', ''),
        sort_order = COALESCE((item_payload->>'sort_order')::INTEGER, 0),
        deleted_at = NULL,
        updated_by = auth.uid()
      WHERE id = item_id
        AND work_order_id = target_work_order_id
        AND workshop_id = target_workshop;
      GET DIAGNOSTICS affected = ROW_COUNT;
      IF affected <> 1 THEN
        RAISE EXCEPTION 'line item does not belong to this work order' USING ERRCODE = '23503';
      END IF;
    END IF;
  END LOOP;

  PERFORM public.recalculate_work_order_payment_status(target_work_order_id);
  RETURN target_work_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION copy_work_order_transactional(source_work_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_workshop UUID := public.current_workshop_id();
  new_order_id UUID;
BEGIN
  IF target_workshop IS NULL OR NOT public.is_workshop_member(target_workshop) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.work_orders
    WHERE id = source_work_order_id AND workshop_id = target_workshop AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'work order not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.work_orders (
    workshop_id, estimate_no, vehicle_id, customer_id, status, date, prepared_by,
    odometer, currency, payer_type, insurance_company, insurance_policy_no,
    insurance_claim_no, linked_work_order_id, overall_discount_type,
    overall_discount_value, notes, internal_notes, terms
  )
  SELECT
    target_workshop, public.next_work_order_number(target_workshop), vehicle_id,
    customer_id, 'draft'::public.work_order_status,
    (now() AT TIME ZONE (SELECT timezone FROM public.workshops WHERE id = target_workshop))::DATE,
    prepared_by, odometer,
    currency, payer_type, insurance_company, insurance_policy_no,
    insurance_claim_no, linked_work_order_id, overall_discount_type,
    overall_discount_value, notes, internal_notes, terms
  FROM public.work_orders
  WHERE id = source_work_order_id AND workshop_id = target_workshop
  RETURNING id INTO new_order_id;

  INSERT INTO public.line_items (
    workshop_id, work_order_id, category, item, specification, part_number,
    quantity, unit, unit_price, line_total, discount_type, discount_value,
    installation_status, notes, source_url, is_inventory, sort_order
  )
  SELECT
    target_workshop, new_order_id, category, item, specification, part_number,
    quantity, unit, unit_price, line_total, discount_type, discount_value,
    installation_status, notes, source_url, is_inventory, sort_order
  FROM public.line_items
  WHERE work_order_id = source_work_order_id
    AND workshop_id = target_workshop
    AND deleted_at IS NULL;

  PERFORM public.recalculate_work_order_payment_status(new_order_id);
  RETURN new_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION transition_work_order_status(
  target_work_order_id UUID,
  expected_version INTEGER,
  target_status public.work_order_status
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_workshop UUID := public.current_workshop_id();
  updated_version INTEGER;
BEGIN
  IF target_workshop IS NULL OR NOT public.is_workshop_member(target_workshop) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.work_orders
  SET status = target_status
  WHERE id = target_work_order_id
    AND workshop_id = target_workshop
    AND deleted_at IS NULL
    AND version = expected_version
  RETURNING version INTO updated_version;

  IF updated_version IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.work_orders
      WHERE id = target_work_order_id
        AND workshop_id = target_workshop
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'work order changed; refresh before changing status'
        USING ERRCODE = '40001';
    END IF;
    RAISE EXCEPTION 'work order not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN updated_version;
END;
$$;

REVOKE ALL ON FUNCTION create_work_order_with_items(JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_work_order_with_items(UUID, INTEGER, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION copy_work_order_transactional(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION transition_work_order_status(UUID, INTEGER, public.work_order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_work_order_with_items(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_work_order_with_items(UUID, INTEGER, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION copy_work_order_transactional(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION transition_work_order_status(UUID, INTEGER, public.work_order_status) TO authenticated;

-- Provision an isolated workshop for future sign-ups. This does not expose any
-- account-administration UI or add users to an existing workshop.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_workshop_id UUID;
BEGIN
  INSERT INTO public.workshops (owner_id, name, created_by, updated_by)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), 'My Workshop'),
    NEW.id,
    NEW.id
  )
  RETURNING id INTO new_workshop_id;

  INSERT INTO public.workshop_members (workshop_id, user_id, role, created_by, updated_by)
  VALUES (new_workshop_id, NEW.id, 'owner', NEW.id, NEW.id);

  INSERT INTO public.shop_settings (workshop_id, shop_name, created_by, updated_by)
  VALUES (new_workshop_id, 'My Workshop', NEW.id, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_provision_workshop ON auth.users;
CREATE TRIGGER on_auth_user_created_provision_workshop
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE OR REPLACE FUNCTION protect_workshop_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'workshops' THEN
    IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'workshop owner is immutable' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'workshop_members' THEN
    IF TG_OP = 'UPDATE' AND (
      NEW.workshop_id IS DISTINCT FROM OLD.workshop_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR (OLD.role = 'owner' AND (
        NEW.role IS DISTINCT FROM OLD.role
        OR NEW.deleted_at IS NOT NULL
      ))
    ) THEN
      RAISE EXCEPTION 'workshop ownership membership is immutable' USING ERRCODE = '42501';
    END IF;
    IF NEW.role = 'owner' AND NOT EXISTS (
      SELECT 1 FROM public.workshops
      WHERE id = NEW.workshop_id AND owner_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'owner membership must match the workshop owner'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_workshops_owner
  BEFORE UPDATE OF owner_id ON workshops
  FOR EACH ROW EXECUTE FUNCTION protect_workshop_ownership();
CREATE TRIGGER protect_workshop_members_owner
  BEFORE INSERT OR UPDATE ON workshop_members
  FOR EACH ROW EXECUTE FUNCTION protect_workshop_ownership();

-- Remove every permissive legacy policy before creating scoped replacements.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'customers', 'vehicles', 'work_orders', 'line_items', 'photos', 'payments',
        'shop_settings', 'documents', 'activity_logs', 'attachments', 'notifications',
        'labor_items', 'service_packages', 'package_items'
      ])
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END;
$$;

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops FORCE ROW LEVEL SECURITY;
ALTER TABLE workshop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_members FORCE ROW LEVEL SECURITY;

CREATE POLICY workshops_select ON workshops FOR SELECT TO authenticated
  USING (public.is_workshop_member(id) AND deleted_at IS NULL);
CREATE POLICY workshops_update ON workshops FOR UPDATE TO authenticated
  USING (public.is_workshop_owner(id) AND deleted_at IS NULL)
  WITH CHECK (public.is_workshop_owner(id) AND deleted_at IS NULL);

CREATE POLICY workshop_members_select ON workshop_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_workshop_owner(workshop_id));
CREATE POLICY workshop_members_insert ON workshop_members FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_owner(workshop_id));
CREATE POLICY workshop_members_update ON workshop_members FOR UPDATE TO authenticated
  USING (public.is_workshop_owner(workshop_id)) WITH CHECK (public.is_workshop_owner(workshop_id));

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'customers', 'vehicles', 'work_orders', 'line_items', 'photos', 'payments',
    'documents', 'attachments', 'notifications', 'labor_items', 'service_packages', 'package_items'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %1$I_select ON %1$I FOR SELECT TO authenticated USING (public.is_workshop_member(workshop_id) AND deleted_at IS NULL)',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY %1$I_insert ON %1$I FOR INSERT TO authenticated WITH CHECK (public.is_workshop_member(workshop_id) AND workshop_id = public.current_workshop_id() AND deleted_at IS NULL)',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY %1$I_update ON %1$I FOR UPDATE TO authenticated USING (public.is_workshop_member(workshop_id) AND deleted_at IS NULL) WITH CHECK (public.is_workshop_member(workshop_id) AND workshop_id = public.current_workshop_id() AND deleted_at IS NULL)',
      table_name
    );
  END LOOP;
END;
$$;

-- Creation must go through the security-definer transaction that allocates the
-- permanent number and inserts all initial line items atomically.
DROP POLICY work_orders_insert ON work_orders;

CREATE OR REPLACE FUNCTION public.is_attachment_parent_active(
  target_parent_type TEXT,
  target_parent_id UUID,
  target_workshop_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE target_parent_type
    WHEN 'vehicle' THEN EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE id = target_parent_id AND workshop_id = target_workshop_id AND deleted_at IS NULL
    )
    WHEN 'work_order' THEN EXISTS (
      SELECT 1 FROM public.work_orders
      WHERE id = target_parent_id AND workshop_id = target_workshop_id AND deleted_at IS NULL
    )
    WHEN 'line_item' THEN EXISTS (
      SELECT 1 FROM public.line_items
      WHERE id = target_parent_id AND workshop_id = target_workshop_id AND deleted_at IS NULL
    )
    WHEN 'customer' THEN EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = target_parent_id AND workshop_id = target_workshop_id AND deleted_at IS NULL
    )
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.is_attachment_parent_active(TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_attachment_parent_active(TEXT, UUID, UUID) TO authenticated;

DROP POLICY attachments_select ON attachments;
DROP POLICY attachments_insert ON attachments;
DROP POLICY attachments_update ON attachments;
CREATE POLICY attachments_select ON attachments FOR SELECT TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND public.is_attachment_parent_active(parent_type, parent_id, workshop_id)
    AND (visibility <> 'private' OR public.is_workshop_owner(workshop_id))
  );
CREATE POLICY attachments_insert ON attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_workshop_member(workshop_id)
    AND workshop_id = public.current_workshop_id()
    AND deleted_at IS NULL
    AND public.is_attachment_parent_active(parent_type, parent_id, workshop_id)
    AND (visibility <> 'private' OR public.is_workshop_owner(workshop_id))
  );
CREATE POLICY attachments_update ON attachments FOR UPDATE TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND public.is_attachment_parent_active(parent_type, parent_id, workshop_id)
    AND (visibility <> 'private' OR public.is_workshop_owner(workshop_id))
  )
  WITH CHECK (
    public.is_workshop_member(workshop_id)
    AND workshop_id = public.current_workshop_id()
    AND deleted_at IS NULL
    AND public.is_attachment_parent_active(parent_type, parent_id, workshop_id)
    AND (visibility <> 'private' OR public.is_workshop_owner(workshop_id))
  );

-- Active child rows are visible only while their operational parent is active.
-- The restore trigger enforces the same rule for writes.
DROP POLICY line_items_select ON line_items;
CREATE POLICY line_items_select ON line_items FOR SELECT TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM work_orders parent
      WHERE parent.id = work_order_id
        AND parent.workshop_id = line_items.workshop_id
        AND parent.deleted_at IS NULL
    )
  );
DROP POLICY payments_select ON payments;
CREATE POLICY payments_select ON payments FOR SELECT TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM work_orders parent
      WHERE parent.id = work_order_id
        AND parent.workshop_id = payments.workshop_id
        AND parent.deleted_at IS NULL
    )
  );
DROP POLICY documents_select ON documents;
CREATE POLICY documents_select ON documents FOR SELECT TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM work_orders parent
      WHERE parent.id = work_order_id
        AND parent.workshop_id = documents.workshop_id
        AND parent.deleted_at IS NULL
    )
  );
DROP POLICY notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications FOR SELECT TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND (
      work_order_id IS NULL
      OR EXISTS (
        SELECT 1 FROM work_orders parent
        WHERE parent.id = work_order_id
          AND parent.workshop_id = notifications.workshop_id
          AND parent.deleted_at IS NULL
      )
    )
  );
DROP POLICY package_items_select ON package_items;
CREATE POLICY package_items_select ON package_items FOR SELECT TO authenticated
  USING (
    public.is_workshop_member(workshop_id)
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM service_packages parent
      WHERE parent.id = package_id
        AND parent.workshop_id = package_items.workshop_id
        AND parent.deleted_at IS NULL
    )
  );

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY shop_settings_select ON shop_settings FOR SELECT TO authenticated
  USING (public.is_workshop_member(workshop_id) AND deleted_at IS NULL);
CREATE POLICY shop_settings_insert ON shop_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_owner(workshop_id) AND workshop_id = public.current_workshop_id());
CREATE POLICY shop_settings_update ON shop_settings FOR UPDATE TO authenticated
  USING (public.is_workshop_owner(workshop_id) AND deleted_at IS NULL)
  WITH CHECK (
    public.is_workshop_owner(workshop_id)
    AND workshop_id = public.current_workshop_id()
    AND deleted_at IS NULL
  );

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY activity_logs_select ON activity_logs FOR SELECT TO authenticated
  USING (public.is_workshop_member(workshop_id));
CREATE POLICY activity_logs_insert ON activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_member(workshop_id) AND workshop_id = public.current_workshop_id());

-- Soft deletion and restoration cross the active-row SELECT boundary through
-- tightly scoped functions. Hard DELETE remains unavailable to clients.
CREATE OR REPLACE FUNCTION soft_delete_record(target_table TEXT, target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected INTEGER;
  target_workshop UUID := public.current_workshop_id();
BEGIN
  IF target_table <> ALL (ARRAY[
    'customers', 'vehicles', 'work_orders', 'line_items', 'photos', 'payments',
    'shop_settings', 'documents', 'attachments', 'notifications', 'labor_items',
    'service_packages', 'package_items'
  ]) THEN
    RAISE EXCEPTION 'unsupported soft-delete table' USING ERRCODE = '22023';
  END IF;
  IF target_workshop IS NULL OR NOT public.is_workshop_member(target_workshop) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;

  IF target_table = 'customers' AND (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE customer_id = target_id
        AND workshop_id = target_workshop
        AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.work_orders
      WHERE customer_id = target_id
        AND workshop_id = target_workshop
        AND deleted_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'customer has active operational records'
      USING ERRCODE = '23503';
  END IF;
  IF target_table = 'vehicles' AND EXISTS (
    SELECT 1 FROM public.work_orders
    WHERE vehicle_id = target_id
      AND workshop_id = target_workshop
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'vehicle has active work orders' USING ERRCODE = '23503';
  END IF;
  IF target_table = 'work_orders' AND EXISTS (
    SELECT 1 FROM public.work_orders
    WHERE linked_work_order_id = target_id
      AND workshop_id = target_workshop
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'work order is linked from an active work order'
      USING ERRCODE = '23503';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = now(), updated_by = $1 WHERE id = $2 AND workshop_id = $3 AND deleted_at IS NULL',
    target_table
  ) USING auth.uid(), target_id, target_workshop;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

CREATE OR REPLACE FUNCTION restore_record(target_table TEXT, target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected INTEGER;
  target_workshop UUID := public.current_workshop_id();
BEGIN
  IF target_table <> ALL (ARRAY[
    'customers', 'vehicles', 'work_orders', 'line_items', 'photos', 'payments',
    'shop_settings', 'documents', 'attachments', 'notifications', 'labor_items',
    'service_packages', 'package_items'
  ]) THEN
    RAISE EXCEPTION 'unsupported restore table' USING ERRCODE = '22023';
  END IF;
  IF target_workshop IS NULL OR NOT public.is_workshop_member(target_workshop) THEN
    RAISE EXCEPTION 'workshop access denied' USING ERRCODE = '42501';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NULL, updated_by = $1 WHERE id = $2 AND workshop_id = $3 AND deleted_at IS NOT NULL',
    target_table
  ) USING auth.uid(), target_id, target_workshop;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

CREATE OR REPLACE FUNCTION soft_delete_package_items(target_package_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected INTEGER;
  target_workshop UUID := public.current_workshop_id();
BEGIN
  IF target_workshop IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.service_packages
    WHERE id = target_package_id AND workshop_id = target_workshop AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'package access denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.package_items
  SET deleted_at = now(), updated_by = auth.uid()
  WHERE package_id = target_package_id
    AND workshop_id = target_workshop
    AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION soft_delete_record(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION restore_record(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION soft_delete_package_items(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_record(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_record(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_package_items(UUID) TO authenticated;

-- Private storage is provisioned in SQL. Authenticated users can request signed
-- reads for their workshop; writes are server-only through service_role.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', false, 10485760, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can read photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS attachments_workshop_read ON storage.objects;

CREATE POLICY attachments_workshop_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_workshop_member(((storage.foldername(name))[1])::UUID)
    AND EXISTS (
      SELECT 1
      FROM public.attachments attachment
      WHERE attachment.workshop_id = ((storage.foldername(name))[1])::UUID
        AND (attachment.storage_path = name OR attachment.thumbnail_path = name)
        AND attachment.deleted_at IS NULL
        AND (
          attachment.visibility <> 'private'
          OR public.is_workshop_owner(attachment.workshop_id)
        )
    )
  );

COMMIT;
