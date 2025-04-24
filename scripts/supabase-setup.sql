-- SQL script to set up the correct schema for MemeSwipe in Supabase

-- Create memes table
CREATE TABLE IF NOT EXISTS public.memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_path TEXT NOT NULL,
  user_id UUID NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  image_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meme_id UUID NOT NULL REFERENCES public.memes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meme_id, type)
);

-- Create users table to mirror Clerk user data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  monthly_upload_count INTEGER DEFAULT 0,
  total_uploads INTEGER DEFAULT 0,
  account_status TEXT DEFAULT 'active',
  account_type TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing memes (anyone can view active memes)
CREATE POLICY IF NOT EXISTS memes_select_policy ON public.memes
  FOR SELECT USING (status = 'active');
  
-- Create policy for inserting memes (authenticated users only)
CREATE POLICY IF NOT EXISTS memes_insert_policy ON public.memes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  
-- Create policy for updating memes (only the creator can update)
CREATE POLICY IF NOT EXISTS memes_update_policy ON public.memes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  
-- Create policy for deleting memes (only the creator can delete)
CREATE POLICY IF NOT EXISTS memes_delete_policy ON public.memes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for interactions
CREATE POLICY IF NOT EXISTS interactions_select_policy ON public.interactions
  FOR SELECT USING (true);
  
CREATE POLICY IF NOT EXISTS interactions_insert_policy ON public.interactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY IF NOT EXISTS interactions_update_policy ON public.interactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  
CREATE POLICY IF NOT EXISTS interactions_delete_policy ON public.interactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for users
CREATE POLICY IF NOT EXISTS users_select_policy ON public.users
  FOR SELECT USING (true);
  
CREATE POLICY IF NOT EXISTS users_insert_policy ON public.users
  FOR INSERT TO anon WITH CHECK (true);
  
CREATE POLICY IF NOT EXISTS users_update_policy ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create index for frequent queries
CREATE INDEX IF NOT EXISTS memes_user_id_idx ON public.memes(user_id);
CREATE INDEX IF NOT EXISTS memes_status_idx ON public.memes(status);
CREATE INDEX IF NOT EXISTS interactions_meme_id_idx ON public.interactions(meme_id);
CREATE INDEX IF NOT EXISTS interactions_user_id_idx ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS interactions_type_idx ON public.interactions(type);

-- Create stored function to handle user upload limits
CREATE OR REPLACE FUNCTION check_upload_limit(user_id UUID) 
RETURNS TABLE (allowed BOOLEAN, limit INTEGER, count INTEGER, remaining INTEGER) 
LANGUAGE plpgsql
AS $$
DECLARE
  user_type TEXT;
  user_limit INTEGER;
  user_count INTEGER;
BEGIN
  -- Get user account type
  SELECT account_type, monthly_upload_count INTO user_type, user_count
  FROM public.users
  WHERE id = user_id;
  
  -- Determine upload limit based on account type
  IF user_type = 'premium' THEN
    user_limit := 100;
  ELSE
    user_limit := 10;
  END IF;
  
  -- Calculate remaining uploads
  remaining := greatest(0, user_limit - user_count);
  
  -- Return results
  RETURN QUERY SELECT 
    remaining > 0 as allowed,
    user_limit as limit,
    user_count as count,
    remaining as remaining;
END;
$$;

-- Create function to fix image_url/image_path inconsistency 
CREATE OR REPLACE FUNCTION fix_meme_image_columns()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if image_url exists but image_path doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'memes' 
    AND column_name = 'image_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'memes' 
    AND column_name = 'image_path'
  ) THEN
    -- Rename image_url to image_path
    ALTER TABLE public.memes RENAME COLUMN image_url TO image_path;
  END IF;
END;
$$;

-- Execute the fix
SELECT fix_meme_image_columns(); 