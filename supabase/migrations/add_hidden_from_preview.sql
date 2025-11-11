-- RenderLab Database Migration: Add hidden_from_preview column
-- Run this in Supabase SQL Editor

-- Step 1: Add hidden_from_preview column to images table
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS hidden_from_preview BOOLEAN DEFAULT FALSE;

-- Step 2: Create index for better query performance
-- This index helps when filtering out hidden images
CREATE INDEX IF NOT EXISTS idx_images_hidden_preview 
  ON images(user_id, hidden_from_preview, created_at DESC) 
  WHERE hidden_from_preview = FALSE;

-- Step 3: Verify the column was added
-- Run this to check:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'images' AND column_name = 'hidden_from_preview';
