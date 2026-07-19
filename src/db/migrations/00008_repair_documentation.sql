-- ============================================
-- 00008: Repair Documentation & Digital Evidence
-- Evolves the attachments table into the full
-- Attachment System with gallery, categories,
-- drop-off inspection fields, and timeline events.
-- ============================================

-- ============================================
-- 1. EVOLVE attachments TABLE
-- ============================================

-- Drop old policies and triggers so we can rebuild
DROP POLICY IF EXISTS "Users can read attachments" ON attachments;
DROP POLICY IF EXISTS "Users can insert attachments" ON attachments;
DROP POLICY IF EXISTS "Users can update attachments" ON attachments;
DROP TRIGGER IF EXISTS set_attachments_created_by ON attachments;

-- Add new columns (existing rows get NULLs)
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Migrate data: copy url -> storage_path, thumbnail_url -> thumbnail_path
UPDATE attachments SET storage_path = url WHERE storage_path IS NULL AND url IS NOT NULL;
UPDATE attachments SET thumbnail_path = thumbnail_url WHERE thumbnail_path IS NULL AND thumbnail_url IS NOT NULL;

-- Drop old columns
ALTER TABLE attachments DROP COLUMN IF EXISTS url;
ALTER TABLE attachments DROP COLUMN IF EXISTS thumbnail_url;

-- Alter CHECK constraints — need to drop and recreate
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_parent_type_check;
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_attachment_type_check;

ALTER TABLE attachments ADD CONSTRAINT attachments_parent_type_check
  CHECK (parent_type IN ('vehicle', 'work_order', 'line_item'));

ALTER TABLE attachments ADD CONSTRAINT attachments_attachment_type_check
  CHECK (attachment_type IN (
    'before', 'during', 'after', 'damage',
    'vehicle_overview', 'odometer', 'vin', 'plate_number',
    'authorization_letter', 'tool_condition_out', 'tool_condition_in',
    'other'
  ));

-- Add indexes for new query patterns
CREATE INDEX IF NOT EXISTS idx_attachments_parent_type ON attachments(parent_type);
CREATE INDEX IF NOT EXISTS idx_attachments_parent ON attachments(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_attachments_attachment_type ON attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_attachments_taken_at ON attachments(taken_at);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_deleted ON attachments(deleted_at);

-- ============================================
-- 2. RLS POLICIES
-- ============================================
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read non-deleted attachments
CREATE POLICY "attachments_select" ON attachments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- All authenticated users can insert
CREATE POLICY "attachments_insert" ON attachments
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- All authenticated users can update
CREATE POLICY "attachments_update" ON attachments
  FOR UPDATE TO authenticated
  USING (true);

-- All authenticated users can soft-delete
CREATE POLICY "attachments_delete" ON attachments
  FOR UPDATE TO authenticated
  USING (true);

-- ============================================
-- 3. TRIGGERS
-- ============================================
CREATE TRIGGER set_attachments_created_by
  BEFORE INSERT ON attachments FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON attachments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_attachments_updated_by
  BEFORE UPDATE ON attachments FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- ============================================
-- 4. ADD drop-off inspection FIELDS TO work_orders
-- ============================================
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS dropoff_condition_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS dropoff_representative_name TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS dropoff_representative_id TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS dropoff_inspected_at TIMESTAMPTZ;

-- ============================================
-- 5. ADD include_photo_appendix TO shop_settings
-- ============================================
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS include_photo_appendix BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE shop_settings DROP COLUMN IF EXISTS include_photo_appendix;
-- ALTER TABLE work_orders DROP COLUMN IF EXISTS dropoff_inspected_at;
-- ALTER TABLE work_orders DROP COLUMN IF EXISTS dropoff_representative_id;
-- ALTER TABLE work_orders DROP COLUMN IF EXISTS dropoff_representative_name;
-- ALTER TABLE work_orders DROP COLUMN IF EXISTS dropoff_condition_notes;
-- DROP TRIGGER IF EXISTS set_attachments_updated_by ON attachments;
-- DROP TRIGGER IF EXISTS update_attachments_updated_at ON attachments;
-- DROP TRIGGER IF EXISTS set_attachments_created_by ON attachments;
-- DROP POLICY IF EXISTS "attachments_delete" ON attachments;
-- DROP POLICY IF EXISTS "attachments_update" ON attachments;
-- DROP POLICY IF EXISTS "attachments_insert" ON attachments;
-- DROP POLICY IF EXISTS "attachments_select" ON attachments;
-- DROP INDEX IF EXISTS idx_attachments_deleted;
-- DROP INDEX IF EXISTS idx_attachments_uploaded_by;
-- DROP INDEX IF EXISTS idx_attachments_taken_at;
-- DROP INDEX IF EXISTS idx_attachments_attachment_type;
-- DROP INDEX IF EXISTS idx_attachments_parent;
-- ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_attachment_type_check;
-- ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_parent_type_check;
-- ALTER TABLE attachments ADD CONSTRAINT attachments_attachment_type_check CHECK (attachment_type IN ('image', 'pdf', 'docx', 'xlsx', 'video', 'other'));
-- ALTER TABLE attachments ADD CONSTRAINT attachments_parent_type_check CHECK (parent_type IN ('work_order', 'vehicle', 'customer', 'line_item'));
-- ALTER TABLE attachments ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
-- ALTER TABLE attachments ADD COLUMN IF NOT EXISTS url TEXT;
-- UPDATE attachments SET url = storage_path WHERE url IS NULL AND storage_path IS NOT NULL;
-- ALTER TABLE attachments DROP COLUMN IF EXISTS uploaded_by;
-- ALTER TABLE attachments DROP COLUMN IF EXISTS updated_by;
-- ALTER TABLE attachments DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE attachments DROP COLUMN IF EXISTS taken_at;
-- ALTER TABLE attachments DROP COLUMN IF EXISTS thumbnail_path;
-- ALTER TABLE attachments DROP COLUMN IF EXISTS storage_path;
-- CREATE TRIGGER set_attachments_created_by BEFORE INSERT ON attachments FOR EACH ROW EXECUTE FUNCTION set_created_by();
-- CREATE POLICY "Users can update attachments" ON attachments FOR UPDATE TO authenticated USING (true);
-- CREATE POLICY "Users can insert attachments" ON attachments FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Users can read attachments" ON attachments FOR SELECT TO authenticated USING (deleted_at IS NULL);
