-- Migration: Secure Storage with Row Level Security
-- Date: 2025-11-24
-- Description: Implement structured storage paths and RLS policies for renderlab-images bucket

-- =====================================================
-- 1. DROP EXISTING POLICIES (if any)
-- =====================================================
DROP POLICY IF EXISTS "Users can read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload only into their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read images" ON storage.objects;

-- =====================================================
-- 2. CREATE NEW RLS POLICIES
-- =====================================================

-- Policy: Users can read ONLY their own images
-- Path format: {userId}/{context}/{fileName}
CREATE POLICY "Users can read their own images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'renderlab-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can upload ONLY into their own folder
-- Enforces path structure: {userId}/{context}/{fileName}
CREATE POLICY "Users can upload only into their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'renderlab-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete ONLY their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'renderlab-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 3. MAKE BUCKET PRIVATE
-- =====================================================

-- Update bucket to be private (RLS enforced)
UPDATE storage.buckets
SET public = false
WHERE id = 'renderlab-images';

-- =====================================================
-- 4. ENSURE RLS IS ENABLED
-- =====================================================

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. All uploads must follow: {userId}/{context}/{fileName}
--    where context is one of: workspace, batch, inpaint, history
-- 2. Users can only access files in their own userId folder
-- 3. Public access is disabled - all access goes through RLS
-- 4. UPDATE is not allowed for authenticated users (immutable storage)
