-- Add missing templates column to collections table
-- Run this in your Supabase SQL Editor

-- Add templates column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collections' 
        AND column_name = 'templates'
    ) THEN
        ALTER TABLE collections ADD COLUMN templates JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added templates column to collections table';
    ELSE
        RAISE NOTICE 'templates column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'collections'
ORDER BY ordinal_position;
