ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
