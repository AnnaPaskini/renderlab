-- Simplify templates table to just name and prompt
-- Drop unnecessary columns
ALTER TABLE public.templates DROP COLUMN IF EXISTS aiModel;
ALTER TABLE public.templates DROP COLUMN IF EXISTS details;
ALTER TABLE public.templates DROP COLUMN IF EXISTS finalPrompt;
ALTER TABLE public.templates DROP COLUMN IF EXISTS avoidElements;

-- Add simple prompt column
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Drop unnecessary indexes
DROP INDEX IF EXISTS templates_aimodel_idx;

-- Add full-text search index for name and prompt
CREATE INDEX IF NOT EXISTS templates_search_idx ON public.templates USING gin(to_tsvector('english', name || ' ' || COALESCE(prompt, '')));

-- Update comment
COMMENT ON TABLE public.templates IS 'User prompt templates - simple name + prompt storage';
COMMENT ON COLUMN public.templates.prompt IS 'Full prompt text that user wants to save';
