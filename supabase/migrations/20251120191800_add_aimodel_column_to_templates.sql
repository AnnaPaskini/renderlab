-- Add aiModel column to templates table
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS aiModel TEXT;

-- Add index for faster filtering by model
CREATE INDEX IF NOT EXISTS templates_aimodel_idx ON public.templates(aiModel);

-- Add comment for documentation
COMMENT ON COLUMN public.templates.aiModel IS 'AI model used: nano-banana, seedream4, or flux';
