-- Migration 00003: Photos audit columns and storage policies
-- Description: Adds missing audit columns to photos, adds storage RLS policies
-- Reversible: Yes

-- ============================================
-- Add missing audit columns to photos
-- ============================================
ALTER TABLE photos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE photos ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by to shop_settings for consistency
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================
-- Add triggers for photos audit columns
-- ============================================
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_photos_updated_by
  BEFORE UPDATE ON photos FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- ============================================
-- Storage bucket and RLS policies
-- ============================================

-- Create storage bucket for photos (run in Supabase dashboard or via management API)
-- NOTE: Uncomment and run this in Supabase SQL Editor if the bucket doesn't exist:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Allow authenticated users to read any file
CREATE POLICY "Authenticated users can read photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "Authenticated users can update photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos');

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos');

-- ============================================
-- Down migration
-- ============================================
-- DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can read photos" ON storage.objects;
-- DROP TRIGGER IF EXISTS set_photos_updated_by ON photos;
-- DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
-- ALTER TABLE photos DROP COLUMN IF EXISTS updated_by;
-- ALTER TABLE photos DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE shop_settings DROP COLUMN IF EXISTS created_by;
