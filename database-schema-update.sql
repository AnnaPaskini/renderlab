-- Database Schema Updates for Optimized Nano Banana
-- Run these commands in your Supabase SQL Editor

-- Add support for reference images (if column doesn't exist)
ALTER TABLE inpaint_edits 
ADD COLUMN IF NOT EXISTS reference_urls TEXT[];

-- Add processing time tracking (if column doesn't exist)
ALTER TABLE inpaint_edits 
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Add model field if it doesn't exist
ALTER TABLE inpaint_edits 
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini-2.5-flash-image';

-- Add result_image_url field if using direct URLs instead of image IDs
ALTER TABLE inpaint_edits 
ADD COLUMN IF NOT EXISTS result_image_url TEXT;

-- Add index for better query performance on user queries
CREATE INDEX IF NOT EXISTS idx_inpaint_edits_user_created 
ON inpaint_edits(user_id, created_at DESC);

-- Add index for searching by model
CREATE INDEX IF NOT EXISTS idx_inpaint_edits_model 
ON inpaint_edits(model);

-- Verify the schema
-- Run this to check that all columns exist:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inpaint_edits'
ORDER BY ordinal_position;
