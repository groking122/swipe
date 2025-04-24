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