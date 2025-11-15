-- Create inpaint_edits table for audit trail
CREATE TABLE IF NOT EXISTS inpaint_edits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Image references
  base_image_id INTEGER REFERENCES images(id) ON DELETE SET NULL,
  result_image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  
  -- URLs for audit trail
  base_image_url TEXT NOT NULL,
  mask_url TEXT NOT NULL,
  
  -- Mask data (JSONB)
  mask_bounds JSONB NOT NULL,
  -- Example: {"x": 100, "y": 200, "width": 300, "height": 400, "imageWidth": 1024, "imageHeight": 1024}
  
  -- Prompts
  user_prompt TEXT NOT NULL,       -- Original user input (max 2000 chars)
  full_prompt TEXT NOT NULL,       -- Complete smart prompt sent to API
  
  -- Reference images
  reference_image_urls TEXT[] DEFAULT '{}',
  
  -- Model metadata
  model_provider TEXT NOT NULL DEFAULT 'gemini',
  model_name TEXT NOT NULL DEFAULT 'gemini-2.5-flash-image',
  
  -- Cost tracking
  cost DECIMAL(10, 4) DEFAULT 0.039,
  
  -- Token usage (JSONB)
  tokens_used JSONB,
  -- Example: {"input": 3946, "output": 1290, "total": 5236}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_inpaint_edits_user_id ON inpaint_edits(user_id);
CREATE INDEX idx_inpaint_edits_created_at ON inpaint_edits(created_at DESC);
CREATE INDEX idx_inpaint_edits_result_image ON inpaint_edits(result_image_id);

-- RLS Policies
ALTER TABLE inpaint_edits ENABLE ROW LEVEL SECURITY;

-- Users can view their own edits
CREATE POLICY "Users can view own inpaint edits"
  ON inpaint_edits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own edits
CREATE POLICY "Users can insert own inpaint edits"
  ON inpaint_edits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own edits
CREATE POLICY "Users can delete own inpaint edits"
  ON inpaint_edits
  FOR DELETE
  USING (auth.uid() = user_id);
