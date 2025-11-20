-- Run this in Supabase SQL Editor to check the collections table schema

-- Check if table exists and get its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'collections'
ORDER BY 
    ordinal_position;

-- Also check if it might be in a different schema
SELECT 
    table_schema,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_name = 'collections';
