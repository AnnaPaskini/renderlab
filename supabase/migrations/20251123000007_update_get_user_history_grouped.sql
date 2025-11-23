-- Update get_user_history_grouped function to map url -> image_url
-- This ensures consistency with frontend expectations

CREATE OR REPLACE FUNCTION get_user_history_grouped(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  date_group DATE,
  images_count INTEGER,
  images JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(i.created_at) as date_group,
    COUNT(*)::INTEGER as images_count,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', i.id,
        'name', i.name,
        'image_url', i.url,              -- ✅ Map database 'url' field to 'image_url' in JSON
        'reference_url', i.reference_url,
        'collection_id', i.collection_id,
        'prompt', i.prompt,
        'created_at', i.created_at,
        'user_id', i.user_id
      ) ORDER BY i.created_at DESC
    ) as images
  FROM images i
  WHERE i.user_id = user_uuid
  GROUP BY DATE(i.created_at)
  ORDER BY date_group DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
