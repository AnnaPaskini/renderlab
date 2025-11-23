-- Add batch_id column to images table
-- This column stores the batch UUID for grouping images generated in the same batch operation
-- NULL means the image was generated individually, not as part of a batch

ALTER TABLE images 
ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Add index for faster queries on batch_id
CREATE INDEX IF NOT EXISTS idx_images_batch_id ON images(batch_id);

-- Add comment to document the column
COMMENT ON COLUMN images.batch_id IS 'UUID for grouping images generated in the same batch operation. NULL if generated individually.';
