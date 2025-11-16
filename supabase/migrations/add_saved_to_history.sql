-- Add saved_to_history tracking to inpaint_edits table
ALTER TABLE inpaint_edits
ADD COLUMN IF NOT EXISTS saved_to_history BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS saved_at TIMESTAMP WITH TIME ZONE;

-- Add index for saved edits
CREATE INDEX IF NOT EXISTS idx_inpaint_edits_saved ON inpaint_edits(saved_to_history, user_id) WHERE saved_to_history = true;