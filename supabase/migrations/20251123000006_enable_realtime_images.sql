-- Enable Realtime for images table
-- This allows real-time subscription to INSERT/UPDATE/DELETE events

-- Enable replica identity (required for Realtime)
ALTER TABLE public.images REPLICA IDENTITY FULL;

-- Add publication for Realtime (if not exists)
-- Note: Supabase automatically manages publications, but we ensure it's configured
DO $$ 
BEGIN
  -- Check if publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'images'
  ) THEN
    -- Add table to realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.images;
  END IF;
END $$;

-- Grant necessary permissions for Realtime
GRANT SELECT ON public.images TO anon;
GRANT SELECT ON public.images TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.images IS 'Images table with Realtime enabled for instant workspace preview updates';
