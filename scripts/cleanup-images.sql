-- ============================================
-- CLEANUP OLD IMAGES - SQL APPROACH
-- ============================================
-- Purpose: Free up Supabase bandwidth quota
-- Current: Egress 11.5 GB / 5 GB (231% over)
-- Target: Delete 100-200 old images
-- ============================================

-- STEP 1: Analyze current storage
-- ============================================

-- Count total images
SELECT COUNT(*) as total_images 
FROM images;

-- Count images by age
SELECT 
  CASE 
    WHEN created_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
    WHEN created_at > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
    WHEN created_at > NOW() - INTERVAL '90 days' THEN 'Last 90 days'
    ELSE 'Older than 90 days'
  END as age_group,
  COUNT(*) as count
FROM images
GROUP BY age_group
ORDER BY 
  CASE age_group
    WHEN 'Last 7 days' THEN 1
    WHEN 'Last 30 days' THEN 2
    WHEN 'Last 90 days' THEN 3
    ELSE 4
  END;

-- See oldest images (preview what will be deleted)
SELECT 
  id,
  created_at,
  LEFT(prompt, 50) as prompt_preview,
  user_id
FROM images 
ORDER BY created_at ASC 
LIMIT 20;

-- Count images older than 30 days
SELECT COUNT(*) as images_to_delete
FROM images 
WHERE created_at < NOW() - INTERVAL '30 days';


-- STEP 2: Delete old images (CAREFUL!)
-- ============================================

-- Option A: Delete images older than 30 days
-- WARNING: This is permanent! Make sure you want to do this.

DELETE FROM images 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Check how many were deleted (run after DELETE)
SELECT COUNT(*) as remaining_images FROM images;


-- Option B: Delete images older than 60 days (more conservative)
-- DELETE FROM images 
-- WHERE created_at < NOW() - INTERVAL '60 days';


-- Option C: Delete oldest 100 images
-- DELETE FROM images 
-- WHERE id IN (
--   SELECT id 
--   FROM images 
--   ORDER BY created_at ASC 
--   LIMIT 100
-- );


-- Option D: Delete oldest 200 images (recommended for your case)
-- DELETE FROM images 
-- WHERE id IN (
--   SELECT id 
--   FROM images 
--   ORDER BY created_at ASC 
--   LIMIT 200
-- );


-- STEP 3: Verify cleanup
-- ============================================

-- Count remaining images
SELECT COUNT(*) as total_images FROM images;

-- Check newest remaining images
SELECT 
  created_at,
  LEFT(prompt, 50) as prompt_preview
FROM images 
ORDER BY created_at DESC 
LIMIT 10;

-- Check oldest remaining images
SELECT 
  created_at,
  LEFT(prompt, 50) as prompt_preview
FROM images 
ORDER BY created_at ASC 
LIMIT 10;


-- STEP 4: Also clean up related tables (optional)
-- ============================================

-- If you have inpaint_edits table, you might want to clean that too
-- DELETE FROM inpaint_edits 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- If you have prompts table with old test data
-- DELETE FROM prompts 
-- WHERE created_at < NOW() - INTERVAL '90 days' 
-- AND user_id IS NULL; -- Only delete public/test prompts


-- ============================================
-- ESTIMATED IMPACT
-- ============================================
-- 100 images deleted ≈ 2-3 GB bandwidth freed
-- 200 images deleted ≈ 4-6 GB bandwidth freed
-- 300 images deleted ≈ 6-9 GB bandwidth freed
--
-- Goal: Get Egress under 5 GB (currently 11.5 GB)
-- Recommendation: Delete 200 oldest images
-- ============================================


-- ============================================
-- AFTER CLEANUP
-- ============================================
-- 1. Wait 10-15 minutes for Supabase to update stats
-- 2. Go to Dashboard → Project Settings → Usage
-- 3. Check Egress metric
-- 4. Also manually delete files from Storage:
--    - Go to Storage → images bucket
--    - Sort by upload date
--    - Delete files matching the dates of deleted records
-- ============================================
