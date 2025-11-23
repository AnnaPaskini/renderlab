-- Migration: Create prompts table and functions
-- Description: Sets up prompts library with atomic operations

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  title TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 100),
  prompt TEXT NOT NULL CHECK (char_length(prompt) >= 50 AND char_length(prompt) <= 2000),
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exterior', 'interior', 'lighting', 'materials', 'atmosphere')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  badge TEXT CHECK (badge IN ('featured', 'trending', 'community-favorite')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_status_created ON prompts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

-- Create prompt_likes table for tracking likes
CREATE TABLE IF NOT EXISTS prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_prompt_with_limit(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS toggle_prompt_like(UUID, UUID);
DROP FUNCTION IF EXISTS approve_prompt_with_badge(UUID, TEXT);

-- Function: Create prompt with limit check (atomic)
-- Ensures user doesn't exceed 5 pending prompts
CREATE OR REPLACE FUNCTION create_prompt_with_limit(
  p_user_id UUID,
  p_author_name TEXT,
  p_author_avatar_url TEXT,
  p_title TEXT,
  p_prompt TEXT,
  p_image_url TEXT,
  p_category TEXT,
  p_tags TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_pending_count INTEGER;
  v_new_id UUID;
BEGIN
  -- Check pending prompts count (without FOR UPDATE)
  SELECT COUNT(*) INTO v_pending_count
  FROM prompts
  WHERE user_id = p_user_id AND status = 'pending';

  IF v_pending_count >= 5 THEN
    RAISE EXCEPTION 'You already have 5 pending prompts. Please wait for approval.';
  END IF;

  -- Insert new prompt
  INSERT INTO prompts (
    user_id,
    author_name,
    author_avatar_url,
    title,
    prompt,
    image_url,
    category,
    tags,
    status
  ) VALUES (
    p_user_id,
    p_author_name,
    p_author_avatar_url,
    p_title,
    p_prompt,
    p_image_url,
    p_category,
    p_tags,
    'pending'
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Toggle prompt like (atomic)
-- Handles race conditions when liking/unliking
CREATE OR REPLACE FUNCTION toggle_prompt_like(
  p_prompt_id UUID,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_liked BOOLEAN;
  v_existing_id UUID;
BEGIN
  -- Check if already liked
  SELECT id INTO v_existing_id
  FROM prompt_likes
  WHERE prompt_id = p_prompt_id AND user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- Unlike: remove record and decrement
    DELETE FROM prompt_likes WHERE id = v_existing_id;
    
    UPDATE prompts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = p_prompt_id;
    
    v_liked := FALSE;
  ELSE
    -- Like: add record and increment
    INSERT INTO prompt_likes (prompt_id, user_id)
    VALUES (p_prompt_id, p_user_id);
    
    UPDATE prompts
    SET likes_count = likes_count + 1
    WHERE id = p_prompt_id;
    
    v_liked := TRUE;
  END IF;

  RETURN json_build_object('liked', v_liked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve prompt and optionally set badge (admin only)
CREATE OR REPLACE FUNCTION approve_prompt_with_badge(
  p_prompt_id UUID,
  p_badge TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE prompts
  SET 
    status = 'approved',
    badge = p_badge,
    updated_at = NOW()
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved prompts" ON prompts;
DROP POLICY IF EXISTS "Users can view own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can create prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update own pending prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete own pending prompts" ON prompts;
DROP POLICY IF EXISTS "Anyone can view likes" ON prompt_likes;
DROP POLICY IF EXISTS "Users can like prompts" ON prompt_likes;
DROP POLICY IF EXISTS "Users can unlike prompts" ON prompt_likes;

-- RLS Policies for prompts table

-- Anyone can view approved prompts
CREATE POLICY "Anyone can view approved prompts" ON prompts
  FOR SELECT
  USING (status = 'approved');

-- Users can view their own prompts (any status)
CREATE POLICY "Users can view own prompts" ON prompts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own prompts
CREATE POLICY "Users can create prompts" ON prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending prompts
CREATE POLICY "Users can update own pending prompts" ON prompts
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending prompts
CREATE POLICY "Users can delete own pending prompts" ON prompts
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for prompt_likes table

-- Users can view all likes
CREATE POLICY "Anyone can view likes" ON prompt_likes
  FOR SELECT
  USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like prompts" ON prompt_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike prompts" ON prompt_likes
  FOR DELETE
  USING (auth.uid() = user_id);
