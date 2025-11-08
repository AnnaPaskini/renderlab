-- Add reference_url column to images table
-- This column stores the URL of the reference image used for generation
-- NULL means the image was generated from text prompt only

ALTER TABLE images 
ADD COLUMN IF NOT EXISTS reference_url TEXT;

-- Add index for faster queries on reference_url
CREATE INDEX IF NOT EXISTS idx_images_reference_url ON images(reference_url);

-- Add comment to document the column
COMMENT ON COLUMN images.reference_url IS 'URL of the reference image used during generation. NULL if generated from text prompt only.';
