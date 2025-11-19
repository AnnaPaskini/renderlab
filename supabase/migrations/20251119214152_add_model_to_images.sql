-- Add model column to images table
-- This column stores the AI model used to generate the image
-- Values: 'nano-banana', 'seedream4', 'flux'

ALTER TABLE images 
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'nano-banana';

-- Create index for faster queries by model
CREATE INDEX IF NOT EXISTS idx_images_model ON images(model);

-- Add comment to document the column
COMMENT ON COLUMN images.model IS 'AI model used to generate the image (nano-banana, seedream4, flux)';
