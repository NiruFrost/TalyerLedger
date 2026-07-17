-- ============================================
-- 00005: Work Order / Document / Activity / Attachment
-- Renames jobs → work_orders, adds documents, activity_logs, attachments
-- NOTE: Apply 00004 first (adds voided, payer_type, insurance, linked_job_id)
-- ============================================

-- ============================================
-- 1. RENAME jobs → work_orders
-- ============================================
ALTER TABLE IF EXISTS jobs RENAME TO work_orders;

-- ============================================
-- 2. RENAME FK COLUMNS IN CHILD TABLES
-- ============================================
ALTER TABLE line_items RENAME COLUMN job_id TO work_order_id;
ALTER TABLE payments RENAME COLUMN job_id TO work_order_id;
ALTER TABLE photos RENAME COLUMN job_id TO work_order_id;

-- ============================================
-- 3. RENAME linked_job_id → linked_work_order_id
-- ============================================
ALTER TABLE work_orders RENAME COLUMN IF EXISTS linked_job_id TO linked_work_order_id;

-- ============================================
-- 4. RECREATE INDEXES WITH NEW NAMES
-- ============================================
DROP INDEX IF EXISTS idx_jobs_vehicle;
DROP INDEX IF EXISTS idx_jobs_customer;
DROP INDEX IF EXISTS idx_jobs_status;
DROP INDEX IF EXISTS idx_jobs_estimate_no;
DROP INDEX IF EXISTS idx_jobs_date;
DROP INDEX IF EXISTS idx_jobs_deleted;
DROP INDEX IF EXISTS idx_jobs_linked_job;
DROP INDEX IF EXISTS idx_jobs_payer_type;

CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_estimate_no ON work_orders(estimate_no);
CREATE INDEX idx_work_orders_date ON work_orders(date);
CREATE INDEX idx_work_orders_deleted ON work_orders(deleted_at);
CREATE INDEX idx_work_orders_linked_wo ON work_orders(linked_work_order_id);
CREATE INDEX idx_work_orders_payer_type ON work_orders(payer_type);

-- ============================================
-- 5. RENAME TRIGGERS
-- ============================================
ALTER TRIGGER update_jobs_updated_at ON work_orders RENAME TO update_work_orders_updated_at;
ALTER TRIGGER set_jobs_created_by ON work_orders RENAME TO set_work_orders_created_by;
ALTER TRIGGER set_jobs_updated_by ON work_orders RENAME TO set_work_orders_updated_by;

-- ============================================
-- 6. CREATE documents TABLE
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('estimate', 'statement_of_account', 'payment_acknowledgment', 'job_order')),
  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_work_order ON documents(work_order_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_deleted ON documents(deleted_at);

-- ============================================
-- 7. CREATE activity_logs TABLE
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_logs_work_order ON activity_logs(work_order_id);
CREATE INDEX idx_activity_logs_event ON activity_logs(event_type);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- 8. CREATE attachments TABLE (generic, replaces photos)
-- ============================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL CHECK (parent_type IN ('work_order', 'vehicle', 'customer', 'line_item')),
  parent_id UUID NOT NULL,
  attachment_type TEXT NOT NULL DEFAULT 'image' CHECK (attachment_type IN ('image', 'pdf', 'docx', 'xlsx', 'video', 'other')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_attachments_parent ON attachments(parent_type, parent_id);
CREATE INDEX idx_attachments_type ON attachments(attachment_type);
CREATE INDEX idx_attachments_deleted ON attachments(deleted_at);

-- ============================================
-- 9. RLS POLICIES FOR NEW TABLES
-- ============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read documents" ON documents
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert documents" ON documents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update documents" ON documents
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read activity_logs" ON activity_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert activity_logs" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can read attachments" ON attachments
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can insert attachments" ON attachments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update attachments" ON attachments
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- 10. TRIGGERS FOR NEW TABLES
-- ============================================
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_documents_created_by
  BEFORE INSERT ON documents FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_documents_updated_by
  BEFORE UPDATE ON documents FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER set_activity_logs_created_by
  BEFORE INSERT ON activity_logs FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_attachments_created_by
  BEFORE INSERT ON attachments FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- DROP TRIGGER IF EXISTS set_attachments_created_by ON attachments;
-- DROP TRIGGER IF EXISTS set_activity_logs_created_by ON activity_logs;
-- DROP TRIGGER IF EXISTS set_documents_updated_by ON documents;
-- DROP TRIGGER IF EXISTS set_documents_created_by ON documents;
-- DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
-- DROP TABLE IF EXISTS attachments CASCADE;
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- ALTER TRIGGER update_work_orders_updated_at ON work_orders RENAME TO update_jobs_updated_at;
-- ALTER TRIGGER set_work_orders_created_by ON work_orders RENAME TO set_jobs_created_by;
-- ALTER TRIGGER set_work_orders_updated_by ON work_orders RENAME TO set_jobs_updated_by;
-- DROP INDEX IF EXISTS idx_attachments_deleted;
-- DROP INDEX IF EXISTS idx_attachments_type;
-- DROP INDEX IF EXISTS idx_attachments_parent;
-- DROP INDEX IF EXISTS idx_activity_logs_created;
-- DROP INDEX IF EXISTS idx_activity_logs_event;
-- DROP INDEX IF EXISTS idx_activity_logs_work_order;
-- DROP INDEX IF EXISTS idx_documents_deleted;
-- DROP INDEX IF EXISTS idx_documents_type;
-- DROP INDEX IF EXISTS idx_documents_work_order;
-- DROP INDEX IF EXISTS idx_work_orders_payer_type;
-- DROP INDEX IF EXISTS idx_work_orders_linked_wo;
-- DROP INDEX IF EXISTS idx_work_orders_deleted;
-- DROP INDEX IF EXISTS idx_work_orders_date;
-- DROP INDEX IF EXISTS idx_work_orders_estimate_no;
-- DROP INDEX IF EXISTS idx_work_orders_status;
-- DROP INDEX IF EXISTS idx_work_orders_customer;
-- DROP INDEX IF EXISTS idx_work_orders_vehicle;
-- CREATE INDEX idx_jobs_payer_type ON work_orders(payer_type);
-- CREATE INDEX idx_jobs_linked_job ON work_orders(linked_work_order_id);
-- CREATE INDEX idx_jobs_deleted ON work_orders(deleted_at);
-- CREATE INDEX idx_jobs_date ON work_orders(date);
-- CREATE INDEX idx_jobs_estimate_no ON work_orders(estimate_no);
-- CREATE INDEX idx_jobs_status ON work_orders(status);
-- CREATE INDEX idx_jobs_customer ON work_orders(customer_id);
-- CREATE INDEX idx_jobs_vehicle ON work_orders(vehicle_id);
-- ALTER TABLE work_orders RENAME COLUMN IF EXISTS linked_work_order_id TO linked_job_id;
-- ALTER TABLE photos RENAME COLUMN work_order_id TO job_id;
-- ALTER TABLE payments RENAME COLUMN work_order_id TO job_id;
-- ALTER TABLE line_items RENAME COLUMN work_order_id TO job_id;
-- ALTER TABLE work_orders RENAME TO jobs;
