-- SQL script to fix memes table schema issues

-- Check if memes table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'memes') THEN
    -- Create memes table if it doesn't exist
    CREATE TABLE public.memes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      image_path TEXT NOT NULL,
      user_id UUID NOT NULL,
      creator_id UUID REFERENCES auth.users(id),
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add RLS policies for memes table
    ALTER TABLE public.memes ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for viewing memes (anyone can view active memes)
    CREATE POLICY memes_select_policy ON public.memes
      FOR SELECT USING (status = 'active');
      
    -- Create policy for inserting memes (authenticated users only)
    CREATE POLICY memes_insert_policy ON public.memes
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      
    -- Create policy for updating memes (only the creator can update)
    CREATE POLICY memes_update_policy ON public.memes
      FOR UPDATE TO authenticated USING (auth.uid() = user_id);
      
    -- Create policy for deleting memes (only the creator can delete)
    CREATE POLICY memes_delete_policy ON public.memes
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
  ELSE
    -- Table exists, check if columns need to be fixed
    
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
    
    -- Check if image_path doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'memes' 
      AND column_name = 'image_path'
    ) THEN
      -- Add image_path column
      ALTER TABLE public.memes ADD COLUMN image_path TEXT;
    END IF;
  END IF;
END
$$; 

-- SQL script to fix meme schema issues, particularly the user_id and creator_id columns

-- Function to fix the meme table columns
CREATE OR REPLACE FUNCTION fix_meme_columns()
RETURNS VOID 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user_id column exists and add it if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'memes' 
    AND column_name = 'user_id'
  ) THEN
    -- Add user_id column
    ALTER TABLE public.memes ADD COLUMN user_id UUID;
    
    -- If creator_id exists, copy values from creator_id to user_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'memes' 
      AND column_name = 'creator_id'
    ) THEN
      UPDATE public.memes SET user_id = creator_id;
    END IF;
  END IF;

  -- Check if creator_id column exists and add it if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'memes' 
    AND column_name = 'creator_id'
  ) THEN
    -- Add creator_id column
    ALTER TABLE public.memes ADD COLUMN creator_id UUID;
    
    -- If user_id exists, copy values from user_id to creator_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'memes' 
      AND column_name = 'user_id'
    ) THEN
      UPDATE public.memes SET creator_id = user_id;
    END IF;
  END IF;

  -- Make sure there's a foreign key relationship for creator_id if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public' 
    AND tc.table_name = 'memes' 
    AND ccu.column_name = 'creator_id'
  ) THEN
    -- Drop existing FK if it exists but is incorrectly defined
    BEGIN
      ALTER TABLE public.memes DROP CONSTRAINT IF EXISTS memes_creator_id_fkey;
    EXCEPTION WHEN OTHERS THEN
      -- Constraint doesn't exist or can't be dropped, continue
    END;
    
    -- Add foreign key constraint
    BEGIN
      ALTER TABLE public.memes 
        ADD CONSTRAINT memes_creator_id_fkey 
        FOREIGN KEY (creator_id) 
        REFERENCES public.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      -- Can't add constraint, might be due to invalid data or users table issue
    END;
  END IF;

  -- Create an index on user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'memes' 
    AND indexname = 'memes_user_id_idx'
  ) THEN
    CREATE INDEX memes_user_id_idx ON public.memes(user_id);
  END IF;
END;
$$;

-- Execute the function
SELECT fix_meme_columns();

-- Clean up by dropping the function
DROP FUNCTION IF EXISTS fix_meme_columns(); 